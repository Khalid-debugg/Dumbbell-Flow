import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

let testDb: Database.Database | null = null
let testDbPath: string

/**
 * Creates a fresh test database with all tables
 */
export function createTestDatabase(): Database.Database {
  // Create temp directory for test database
  const tempDir = path.join(os.tmpdir(), 'dumbbellflow-test')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  testDbPath = path.join(tempDir, `test-${Date.now()}.db`)
  testDb = new Database(testDbPath)

  // Enable foreign keys
  testDb.pragma('foreign_keys = ON')

  // Create all tables (same as your main database schema)
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY CHECK (id = '1'),
      language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'es', 'pt', 'fr', 'de')),
      currency TEXT DEFAULT 'EGP',
      allowed_genders TEXT DEFAULT 'both' CHECK (allowed_genders IN ('male', 'female', 'both')),
      default_payment_method TEXT DEFAULT 'cash' CHECK (default_payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
      auto_backup INTEGER DEFAULT 1 CHECK (auto_backup IN (0, 1)),
      backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
      backup_folder_path TEXT,
      last_backup_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO settings (id) VALUES ('1');

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL UNIQUE,
      gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
      address TEXT,
      join_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS membership_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      is_offer INTEGER NOT NULL CHECK (is_offer IN (0, 1)),
      duration_days INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      amount_paid REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));
  `)

  return testDb
}

/**
 * Gets the current test database instance
 */
export function getTestDatabase(): Database.Database {
  if (!testDb) {
    throw new Error('Test database not initialized. Call createTestDatabase() first.')
  }
  return testDb
}

/**
 * Cleans up and deletes the test database
 */
export function cleanupTestDatabase(): void {
  if (testDb) {
    testDb.close()
    testDb = null
  }

  if (testDbPath && fs.existsSync(testDbPath)) {
    // Retry mechanism for Windows file locking
    let retries = 3
    while (retries > 0) {
      try {
        fs.unlinkSync(testDbPath)
        break
      } catch (err: any) {
        // File already deleted (race condition)
        if (err.code === 'ENOENT') {
          break
        }
        // File is locked, retry
        if (err.code === 'EBUSY' && retries > 1) {
          retries--
          // Wait a bit and retry
          const start = Date.now()
          while (Date.now() - start < 50) {
            // Busy wait
          }
        } else {
          throw err
        }
      }
    }
  }
}

/**
 * Clears all data from tables (keeps schema)
 */
export function clearTestData(): void {
  if (!testDb) return

  testDb.exec(`
    DELETE FROM check_ins;
    DELETE FROM memberships;
    DELETE FROM members;
    DELETE FROM membership_plans;
    UPDATE settings SET
      language = 'ar',
      currency = 'EGP',
      allowed_genders = 'both',
      default_payment_method = 'cash',
      auto_backup = 1,
      backup_frequency = 'daily',
      backup_folder_path = NULL,
      last_backup_date = NULL;
  `)
}

/**
 * Helper to generate a simple ID
 */
function generateTestId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Helper to insert a test member
 */
export function createTestMember(
  data: Partial<{
    name: string
    email: string
    phone: string
    gender: string
    address: string
    notes: string
    joinDate: string
  }> = {}
) {
  const db = getTestDatabase()
  const id = generateTestId()
  const member = {
    name: data.name || 'Test Member',
    email: data.email || 'test@example.com',
    phone: data.phone || Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
    gender: data.gender || 'male',
    address: data.address || '123 Test St',
    notes: data.notes || '',
    joinDate: data.joinDate || new Date().toISOString().split('T')[0]
  }

  db.prepare(
    `INSERT INTO members (id, name, email, phone, gender, address, notes, join_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    member.name,
    member.email,
    member.phone,
    member.gender,
    member.address,
    member.notes,
    member.joinDate
  )

  return {
    id,
    ...member
  }
}

/**
 * Helper to insert a test plan
 */
export function createTestPlan(
  data: Partial<{
    name: string
    description: string
    price: number
    durationDays: number
    isOffer: boolean
  }> = {}
) {
  const db = getTestDatabase()
  const id = generateTestId()
  const plan = {
    name: data.name || 'Test Plan',
    description: data.description || 'Test plan description',
    price: data.price !== undefined ? data.price : 100,
    durationDays: data.durationDays || 30,
    isOffer: data.isOffer || false
  }

  db.prepare(
    `INSERT INTO membership_plans (id, name, description, price, duration_days, is_offer)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, plan.name, plan.description, plan.price, plan.durationDays, plan.isOffer ? 1 : 0)

  return {
    id,
    ...plan
  }
}

/**
 * Helper to insert a test membership
 */
export function createTestMembership(data: {
  memberId: string
  planId: string
  startDate?: string
  endDate?: string
  amountPaid?: number
  paymentDate?: string
  paymentMethod?: string
  notes?: string
}) {
  const db = getTestDatabase()
  const id = generateTestId()
  const membership = {
    memberId: data.memberId,
    planId: data.planId,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate:
      data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amountPaid: data.amountPaid || 100,
    paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod || 'cash',
    notes: data.notes || null
  }

  db.prepare(
    `INSERT INTO memberships (id, member_id, plan_id, start_date, end_date, amount_paid, payment_date, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    membership.memberId,
    membership.planId,
    membership.startDate,
    membership.endDate,
    membership.amountPaid,
    membership.paymentDate,
    membership.paymentMethod,
    membership.notes
  )

  return {
    id,
    ...membership
  }
}

/**
 * Helper to insert a test check-in
 */
export function createTestCheckIn(data: { memberId: string; checkInTime?: string }) {
  const db = getTestDatabase()
  const id = generateTestId()
  const checkIn = {
    memberId: data.memberId,
    checkInTime: data.checkInTime || new Date().toISOString()
  }

  db.prepare(
    `INSERT INTO check_ins (id, member_id, check_in_time)
     VALUES (?, ?, ?)`
  ).run(id, checkIn.memberId, checkIn.checkInTime)

  return {
    id,
    ...checkIn
  }
}
