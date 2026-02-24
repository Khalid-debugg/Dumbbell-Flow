const Database = require('better-sqlite3')
const path = require('path')

// Helper to get random element from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Helper to get random date in range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

// Helper to generate UUID-like ID
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
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
  { name: 'Monthly Basic', duration: 30, price: 50, planType: 'duration', isOffer: 0 },
  { name: 'Monthly Premium', duration: 30, price: 80, planType: 'duration', isOffer: 0 },
  { name: 'Quarterly Basic', duration: 90, price: 135, planType: 'duration', isOffer: 0 },
  { name: 'Quarterly Premium', duration: 90, price: 216, planType: 'duration', isOffer: 0 },
  { name: 'Semi-Annual', duration: 180, price: 240, planType: 'duration', isOffer: 0 },
  { name: 'Annual Basic', duration: 365, price: 480, planType: 'duration', isOffer: 0 },
  { name: 'Annual Premium', duration: 365, price: 768, planType: 'duration', isOffer: 0 },
  { name: 'Student Monthly', duration: 30, price: 35, planType: 'duration', isOffer: 1 },
  { name: 'Weekend Only', duration: 30, price: 40, planType: 'duration', isOffer: 0 },
  { name: '10 Check-in Pass', checkInLimit: 10, price: 100, planType: 'checkin', isOffer: 0 },
  { name: '20 Check-in Pass', checkInLimit: 20, price: 180, planType: 'checkin', isOffer: 0 }
]

const paymentMethods = ['cash', 'card', 'transfer', 'e-wallet']

function seedDatabase(dbPath, options = {}) {
  const {
    numMembers = 100,
    numPlans = 11, // Include all plan templates (9 duration + 2 check-in)
    checkInRate = 0.7, // 70% chance of check-ins
    clearExisting = true
  } = options

  console.log('🚀 Starting database seeding...')
  console.log(`📊 Target: ${numMembers} members, ${numPlans} plans`)

  const db = new Database(dbPath)

  try {
    // Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing data...')
      db.exec('DELETE FROM whatsapp_notifications')
      db.exec('DELETE FROM membership_payments')
      db.exec('DELETE FROM check_ins')
      db.exec('DELETE FROM memberships')
      db.exec('DELETE FROM members')
      db.exec('DELETE FROM membership_plans')
      console.log('✓ Existing data cleared')
    }

    // Insert membership plans
    console.log('📋 Creating membership plans...')
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (id, name, description, price, is_offer, duration_days, plan_type, check_in_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const planIds = []
    for (let i = 0; i < Math.min(numPlans, planTemplates.length); i++) {
      const plan = planTemplates[i]
      const planId = generateId('plan')
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
    console.log(`✓ Created ${planIds.length} membership plans`)

    // Insert members
    console.log('👥 Creating members...')
    const insertMember = db.prepare(`
      INSERT INTO members (id, name, phone, email, gender, country_code, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const memberIds = []
    const usedPhones = new Set()

    for (let i = 0; i < numMembers; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const firstName = getRandom(firstNames[gender])
      const lastName = getRandom(lastNames)
      const name = `${firstName} ${lastName}`

      // Generate unique phone starting with 10, 11, 12, or 15
      let phone
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
      const memberId = generateId('member')

      insertMember.run(memberId, name, phone, email, gender, '+20', address, joinDate, note)
      memberIds.push({ id: memberId, joinDate, gender })
    }
    console.log(`✓ Created ${memberIds.length} members`)

    // Insert memberships with diverse scenarios
    console.log('💳 Creating memberships...')
    const insertMembership = db.prepare(`
      INSERT INTO memberships (
        id, member_id, plan_id, start_date, end_date,
        total_price, amount_paid, remaining_balance, payment_status,
        payment_method, payment_date, remaining_check_ins,
        is_custom, is_paused, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const membershipIds = []
    const today = new Date()

    memberIds.forEach((member, index) => {
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
        if (plan.planType === 'duration') {
          endDate.setDate(endDate.getDate() + plan.duration)
        } else {
          endDate.setDate(endDate.getDate() + 365) // 1 year validity for check-in plans
        }

        // Random payment status
        const paymentScenario = Math.random()
        let paymentStatus, amountPaid, remainingBalance
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

        const membershipId = generateId('membership')
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
          plan.planType === 'checkin' ? plan.checkInLimit : null,
          0, // is_custom
          0, // is_paused
          'Active membership'
        )
        membershipIds.push({ id: membershipId, memberId: member.id, endDate, plan })
      } else if (scenario < 0.75) {
        // 15% - Members with expiring membership (within 7 days)
        const plan = getRandom(planIds)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1)
        const startDate = new Date(endDate)
        if (plan.planType === 'duration') {
          startDate.setDate(startDate.getDate() - plan.duration)
        } else {
          startDate.setDate(startDate.getDate() - 180) // 6 months ago
        }

        const membershipId = generateId('membership')
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
      } else if (scenario < 0.85) {
        // 10% - Expired members (had membership, now expired)
        const plan = getRandom(planIds)
        const endDate = getRandomDate(
          new Date(today.getFullYear(), today.getMonth() - 6, 1),
          new Date(today.getTime() - 24 * 60 * 60 * 1000)
        )
        const startDate = new Date(endDate)
        if (plan.planType === 'duration') {
          startDate.setDate(startDate.getDate() - plan.duration)
        } else {
          startDate.setDate(startDate.getDate() - 365)
        }

        const membershipId = generateId('membership')
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
      } else if (scenario < 0.95) {
        // 10% - Members with multiple memberships (renewals)
        const numMemberships = Math.floor(Math.random() * 3) + 2 // 2-4 memberships
        let currentDate = new Date(member.joinDate)

        for (let i = 0; i < numMemberships; i++) {
          const plan = getRandom(planIds)
          const startDate = new Date(currentDate)
          const endDate = new Date(startDate)
          if (plan.planType === 'duration') {
            endDate.setDate(endDate.getDate() + plan.duration)
          } else {
            endDate.setDate(endDate.getDate() + 365)
          }

          const membershipId = generateId('membership')
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
            plan.planType === 'checkin' ? plan.checkInLimit : null,
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
      }
      // Remaining 5% - Inactive members (never had membership)
    })

    console.log(`✓ Created memberships for various scenarios`)

    // Insert check-ins
    console.log('✅ Creating check-ins...')
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

          const checkInId = generateId('checkin')
          insertCheckIn.run(checkInId, membership.memberId, checkInTime.toISOString())
          checkInCount++
          memberCheckIns++
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Update remaining check-ins for check-in based plans
      if (membership.plan.planType === 'checkin') {
        const updateMembership = db.prepare(`
          UPDATE memberships
          SET remaining_check_ins = ?
          WHERE id = ?
        `)
        updateMembership.run(membership.plan.checkInLimit - memberCheckIns, membership.id)
      }
    })

    console.log(`✓ Created ${checkInCount} check-ins`)

    // Insert membership payments for partial/unpaid memberships
    console.log('💰 Creating membership payments...')
    const insertPayment = db.prepare(`
      INSERT INTO membership_payments (id, membership_id, amount, payment_method, payment_date, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    let paymentCount = 0
    membershipIds.forEach((membership) => {
      // Get the membership details to check payment status
      const membershipDetails = db
        .prepare('SELECT * FROM memberships WHERE id = ?')
        .get(membership.id)

      if (membershipDetails.amount_paid > 0) {
        // Initial payment
        const paymentId = generateId('payment')
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

            const scheduledPaymentId = generateId('payment')
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

    console.log(`✓ Created ${paymentCount} membership payments`)

    // Print summary
    console.log('\n📊 Seeding Summary:')
    console.log(`  Membership Plans: ${planIds.length}`)
    console.log(`    - Duration-based: ${planIds.filter((p) => p.planType === 'duration').length}`)
    console.log(`    - Check-in-based: ${planIds.filter((p) => p.planType === 'checkin').length}`)
    console.log(`  Members: ${memberIds.length}`)
    console.log(`    - Active: ~${Math.floor(memberIds.length * 0.6)}`)
    console.log(`    - Expiring Soon: ~${Math.floor(memberIds.length * 0.15)}`)
    console.log(`    - Expired: ~${Math.floor(memberIds.length * 0.1)}`)
    console.log(`    - Inactive: ~${Math.floor(memberIds.length * 0.05)}`)
    console.log(`  Memberships: ${membershipIds.length}`)
    console.log(`  Check-ins: ${checkInCount}`)
    console.log(`  Payments: ${paymentCount}`)
    console.log('\n✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    db.close()
  }
}

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const options = {}
  let dbPath = null

  args.forEach((arg) => {
    if (arg.startsWith('--members=')) {
      options.numMembers = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--plans=')) {
      options.numPlans = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--check-in-rate=')) {
      options.checkInRate = parseFloat(arg.split('=')[1])
    } else if (arg === '--keep-existing') {
      options.clearExisting = false
    } else if (arg.startsWith('--db=')) {
      dbPath = arg.split('=')[1]
    }
  })

  // If no db path provided, use default location
  if (!dbPath) {
    const os = require('os')
    const appDataPath =
      process.env.APPDATA ||
      (process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support')
        : path.join(os.homedir(), '.config'))
    dbPath = path.join(appDataPath, 'fitflow', 'fitflow.db')
  }

  console.log(`📁 Using database: ${dbPath}`)
  seedDatabase(dbPath, options)
}

module.exports = { seedDatabase }
