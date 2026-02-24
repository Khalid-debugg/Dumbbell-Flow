import { ipcMain } from 'electron'
import { getDatabase } from '../database'

// Helper to get random element from array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Helper to get random date in range
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Sample data pools
const firstNames = {
  male: [
    'John',
    'Michael',
    'David',
    'James',
    'Robert',
    'William',
    'Richard',
    'Joseph',
    'Thomas',
    'Christopher',
    'Daniel',
    'Matthew',
    'Anthony',
    'Mark',
    'Steven',
    'Ahmed',
    'Mohammed',
    'Ali',
    'Omar',
    'Khaled'
  ],
  female: [
    'Mary',
    'Patricia',
    'Jennifer',
    'Linda',
    'Barbara',
    'Elizabeth',
    'Susan',
    'Jessica',
    'Sarah',
    'Karen',
    'Nancy',
    'Lisa',
    'Betty',
    'Margaret',
    'Sandra',
    'Fatima',
    'Aisha',
    'Layla',
    'Noor',
    'Zainab'
  ]
}

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Khan',
  'Ahmed',
  'Hassan',
  'Ali',
  'Ibrahim'
]

const addresses = [
  '123 Main St',
  '456 Oak Ave',
  '789 Elm Street',
  '321 Maple Drive',
  '654 Pine Road',
  '987 Cedar Lane',
  '147 Birch Boulevard',
  '258 Willow Way',
  '369 Spruce Court',
  '741 Ash Place'
]

const notes = [
  'VIP member',
  'Prefers morning sessions',
  'Interested in personal training',
  'Has previous knee injury',
  'Student discount applied',
  'Referred by existing member',
  'Looking to lose weight',
  'Training for marathon',
  'Bodybuilding enthusiast',
  ''
]

// Plan templates
const planTemplates = [
  { name: 'Monthly Basic', duration: 30, price: 50, planType: 'duration' as const, isOffer: 0 },
  { name: 'Monthly Premium', duration: 30, price: 80, planType: 'duration' as const, isOffer: 0 },
  {
    name: 'Quarterly Basic',
    duration: 90,
    price: 135,
    planType: 'duration' as const,
    isOffer: 0
  },
  {
    name: 'Quarterly Premium',
    duration: 90,
    price: 216,
    planType: 'duration' as const,
    isOffer: 0
  },
  { name: 'Semi-Annual', duration: 180, price: 240, planType: 'duration' as const, isOffer: 0 },
  { name: 'Annual Basic', duration: 365, price: 480, planType: 'duration' as const, isOffer: 0 },
  { name: 'Annual Premium', duration: 365, price: 768, planType: 'duration' as const, isOffer: 0 },
  { name: 'Student Monthly', duration: 30, price: 35, planType: 'duration' as const, isOffer: 1 },
  { name: 'Weekend Only', duration: 30, price: 40, planType: 'duration' as const, isOffer: 0 },
  {
    name: '10 Check-in Pass',
    checkInLimit: 10,
    price: 100,
    planType: 'checkin' as const,
    isOffer: 0
  },
  {
    name: '20 Check-in Pass',
    checkInLimit: 20,
    price: 180,
    planType: 'checkin' as const,
    isOffer: 0
  }
]

const paymentMethods: Array<'cash' | 'card' | 'transfer' | 'e-wallet'> = [
  'cash',
  'card',
  'transfer',
  'e-wallet'
]

interface SeedOptions {
  numMembers?: number
  numPlans?: number
  checkInRate?: number
  clearExisting?: boolean
}

interface SeedResult {
  success: boolean
  message: string
  stats?: {
    plans: number
    members: number
    memberships: number
    checkIns: number
    payments: number
    scenarios: {
      active: number
      expiring: number
      expired: number
      inactive: number
    }
  }
}

type PlanTemplate = {
  name: string
  price: number
  planType: 'duration' | 'checkin'
  isOffer: number
  duration?: number
  checkInLimit?: number
}

function seedDatabase(options: SeedOptions = {}): SeedResult {
  const { numMembers = 100, numPlans = 11, checkInRate = 0.7, clearExisting = true } = options

  try {
    const db = getDatabase()

    // Clear existing data if requested
    if (clearExisting) {
      db.exec('DELETE FROM whatsapp_notifications')
      db.exec('DELETE FROM membership_payments')
      db.exec('DELETE FROM check_ins')
      db.exec('DELETE FROM memberships')
      db.exec('DELETE FROM members')
      db.exec('DELETE FROM membership_plans')
    }

    // Import crypto for UUID generation
    const crypto = require('crypto')
    const generateId = () => crypto.randomUUID()

    // Insert membership plans
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (id, name, description, price, is_offer, duration_days, plan_type, check_in_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const planIds: Array<PlanTemplate & { id: string }> = []
    for (let i = 0; i < Math.min(numPlans, planTemplates.length); i++) {
      const plan = planTemplates[i]
      const planId = generateId()
      insertPlan.run(
        planId,
        plan.name,
        `${plan.name} membership plan`,
        plan.price,
        plan.isOffer,
        plan.duration || null,
        plan.planType,
        plan.checkInLimit || null
      )
      planIds.push({ id: planId, ...plan })
    }

    // Insert members
    const insertMember = db.prepare(`
      INSERT INTO members (id, name, phone, email, gender, country_code, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const memberIds: Array<{ id: string; joinDate: string; gender: string }> = []
    const usedPhones = new Set<string>()

    for (let i = 0; i < numMembers; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const firstName = getRandom(firstNames[gender])
      const lastName = getRandom(lastNames)
      const name = `${firstName} ${lastName}`

      // Generate unique phone starting with 10, 11, 12, or 15
      let phone: string
      do {
        const prefixes = ['10', '11', '12', '15']
        const prefix = getRandom(prefixes)
        const remaining = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
        phone = `${prefix}${remaining}`
      } while (usedPhones.has(phone))
      usedPhones.add(phone)

      const email =
        Math.random() > 0.3
          ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`
          : null
      const address = Math.random() > 0.5 ? getRandom(addresses) : null
      const joinDate = formatDate(getRandomDate(new Date(2023, 0, 1), new Date(2025, 0, 1)))
      const note = getRandom(notes)
      const memberId = generateId()

      insertMember.run(memberId, name, phone, email, gender, '+20', address, joinDate, note)
      memberIds.push({ id: memberId, joinDate, gender })
    }

    // Insert memberships with diverse scenarios
    const insertMembership = db.prepare(`
      INSERT INTO memberships (
        id, member_id, plan_id, start_date, end_date,
        total_price, amount_paid, remaining_balance, payment_status,
        payment_method, payment_date, remaining_check_ins,
        is_custom, is_paused, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const membershipIds: Array<{
      id: string
      memberId: string
      endDate: Date
      plan: PlanTemplate & { id: string }
    }> = []
    const today = new Date()

    let activeCount = 0
    let expiringCount = 0
    let expiredCount = 0
    let inactiveCount = 0

    memberIds.forEach((member) => {
      // Determine membership scenario
      const scenario = Math.random()

      if (scenario < 0.6) {
        // 60% - Active members with current membership
        const plan = getRandom(planIds)
        const startDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 2, 1),
          today
        )
        const endDate = new Date(startDate)
        if (plan.planType === 'duration' && plan.duration) {
          endDate.setDate(endDate.getDate() + plan.duration)
        } else {
          endDate.setDate(endDate.getDate() + 365) // 1 year validity for check-in plans
        }

        // Random payment status
        const paymentScenario = Math.random()
        let paymentStatus: 'paid' | 'partial' | 'unpaid'
        let amountPaid: number
        let remainingBalance: number

        if (paymentScenario < 0.7) {
          paymentStatus = 'paid'
          amountPaid = plan.price
          remainingBalance = 0
        } else if (paymentScenario < 0.85) {
          paymentStatus = 'partial'
          amountPaid = Math.floor(plan.price * (0.3 + Math.random() * 0.4))
          remainingBalance = plan.price - amountPaid
        } else {
          paymentStatus = 'unpaid'
          amountPaid = 0
          remainingBalance = plan.price
        }

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          plan.id,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          amountPaid,
          remainingBalance,
          paymentStatus,
          getRandom(paymentMethods),
          formatDate(startDate),
          plan.planType === 'checkin' && plan.checkInLimit ? plan.checkInLimit : null,
          0, // is_custom
          0, // is_paused
          'Active membership'
        )
        membershipIds.push({ id: membershipId, memberId: member.id, endDate, plan })
        activeCount++
      } else if (scenario < 0.75) {
        // 15% - Members with expiring membership (within 7 days)
        const plan = getRandom(planIds)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1)
        const startDate = new Date(endDate)
        if (plan.planType === 'duration' && plan.duration) {
          startDate.setDate(startDate.getDate() - plan.duration)
        } else {
          startDate.setDate(startDate.getDate() - 180) // 6 months ago
        }

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          plan.id,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          plan.price,
          0,
          'paid',
          getRandom(paymentMethods),
          formatDate(startDate),
          plan.planType === 'checkin' ? Math.floor(Math.random() * 3) : null, // Few check-ins left
          0,
          0,
          'Expiring soon'
        )
        membershipIds.push({ id: membershipId, memberId: member.id, endDate, plan })
        expiringCount++
      } else if (scenario < 0.85) {
        // 10% - Expired members (had membership, now expired)
        const plan = getRandom(planIds)
        const endDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 6, 1),
          new Date(today.getTime() - 24 * 60 * 60 * 1000)
        )
        const startDate = new Date(endDate)
        if (plan.planType === 'duration' && plan.duration) {
          startDate.setDate(startDate.getDate() - plan.duration)
        } else {
          startDate.setDate(startDate.getDate() - 365)
        }

        const membershipId = generateId()
        insertMembership.run(
          membershipId,
          member.id,
          plan.id,
          formatDate(startDate),
          formatDate(endDate),
          plan.price,
          plan.price,
          0,
          'paid',
          getRandom(paymentMethods),
          formatDate(startDate),
          plan.planType === 'checkin' ? 0 : null,
          0,
          0,
          'Expired membership'
        )
        expiredCount++
      } else if (scenario < 0.95) {
        // 10% - Members with multiple memberships (renewals)
        const numMemberships = Math.floor(Math.random() * 3) + 2 // 2-4 memberships
        let currentDate = new Date(member.joinDate)

        for (let i = 0; i < numMemberships; i++) {
          const plan = getRandom(planIds)
          const startDate = new Date(currentDate)
          const endDate = new Date(startDate)
          if (plan.planType === 'duration' && plan.duration) {
            endDate.setDate(endDate.getDate() + plan.duration)
          } else {
            endDate.setDate(endDate.getDate() + 365)
          }

          const membershipId = generateId()
          insertMembership.run(
            membershipId,
            member.id,
            plan.id,
            formatDate(startDate),
            formatDate(endDate),
            plan.price,
            plan.price,
            0,
            'paid',
            getRandom(paymentMethods),
            formatDate(startDate),
            plan.planType === 'checkin' && plan.checkInLimit ? plan.checkInLimit : null,
            0,
            0,
            `Membership #${i + 1}`
          )

          if (endDate > today) {
            membershipIds.push({ id: membershipId, memberId: member.id, endDate, plan })
          }

          currentDate = new Date(endDate)
          currentDate.setDate(currentDate.getDate() + 1)
        }
        activeCount++
      } else {
        // Remaining 5% - Inactive members (never had membership)
        inactiveCount++
      }
    })

    // Insert check-ins
    const insertCheckIn = db.prepare(`
      INSERT INTO check_ins (id, member_id, check_in_time)
      VALUES (?, ?, ?)
    `)

    let checkInCount = 0
    // Generate check-ins for the last 90 days
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 90)

    membershipIds.forEach((membership) => {
      const currentDate = new Date(startDate)
      let memberCheckIns = 0

      while (currentDate <= today && currentDate <= membership.endDate) {
        // For check-in based plans, limit the number of check-ins
        if (
          membership.plan.planType === 'checkin' &&
          membership.plan.checkInLimit &&
          memberCheckIns >= membership.plan.checkInLimit
        ) {
          break
        }

        // Random check-in probability
        if (Math.random() < checkInRate) {
          const checkInTime = new Date(currentDate)
          checkInTime.setHours(
            Math.floor(Math.random() * 14) + 6, // 6 AM - 8 PM
            Math.floor(Math.random() * 60),
            0,
            0
          )

          const checkInId = generateId()
          insertCheckIn.run(checkInId, membership.memberId, checkInTime.toISOString())
          checkInCount++
          memberCheckIns++
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Update remaining check-ins for check-in based plans
      if (membership.plan.planType === 'checkin' && membership.plan.checkInLimit) {
        const updateMembership = db.prepare(`
          UPDATE memberships
          SET remaining_check_ins = ?
          WHERE id = ?
        `)
        updateMembership.run(membership.plan.checkInLimit - memberCheckIns, membership.id)
      }
    })

    // Insert membership payments for partial/unpaid memberships
    const insertPayment = db.prepare(`
      INSERT INTO membership_payments (id, membership_id, amount, payment_method, payment_date, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    let paymentCount = 0
    membershipIds.forEach((membership) => {
      // Get the membership details to check payment status
      const membershipDetails = db
        .prepare('SELECT * FROM memberships WHERE id = ?')
        .get(membership.id) as any

      if (membershipDetails.amount_paid > 0) {
        // Initial payment
        const paymentId = generateId()
        insertPayment.run(
          paymentId,
          membership.id,
          membershipDetails.amount_paid,
          membershipDetails.payment_method,
          membershipDetails.payment_date,
          'completed',
          'Initial payment'
        )
        paymentCount++

        // For partial payments, add some scheduled future payments
        if (membershipDetails.payment_status === 'partial') {
          const remainingPayments = Math.floor(Math.random() * 2) + 1 // 1-2 scheduled payments
          let remainingAmount = membershipDetails.remaining_balance

          for (let i = 0; i < remainingPayments && remainingAmount > 0; i++) {
            const paymentAmount =
              i === remainingPayments - 1
                ? remainingAmount
                : Math.floor(remainingAmount / (remainingPayments - i))

            const scheduledDate = new Date(membershipDetails.payment_date)
            scheduledDate.setDate(scheduledDate.getDate() + (i + 1) * 30) // Monthly payments

            const scheduledPaymentId = generateId()
            insertPayment.run(
              scheduledPaymentId,
              membership.id,
              paymentAmount,
              membershipDetails.payment_method,
              formatDate(scheduledDate),
              'scheduled',
              `Scheduled payment ${i + 1}`
            )
            paymentCount++
            remainingAmount -= paymentAmount
          }
        }
      }
    })

    return {
      success: true,
      message: 'Database seeded successfully',
      stats: {
        plans: planIds.length,
        members: memberIds.length,
        memberships: membershipIds.length,
        checkIns: checkInCount,
        payments: paymentCount,
        scenarios: {
          active: activeCount,
          expiring: expiringCount,
          expired: expiredCount,
          inactive: inactiveCount
        }
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export function registerSeedHandlers() {
  ipcMain.handle('seed:database', (_event, options: SeedOptions) => {
    return seedDatabase(options)
  })
}
