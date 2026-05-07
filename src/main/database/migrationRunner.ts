import Database from 'better-sqlite3'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

interface Migration {
  id: number
  name: string
  filename: string
  up: string
  down: string
}

export class MigrationRunner {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
    this.ensureMigrationsTable()
  }

  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        filename TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  private getAppliedMigrations(): Set<string> {
    const stmt = this.db.prepare('SELECT filename FROM migrations ORDER BY id')
    const rows = stmt.all() as { filename: string }[]
    return new Set(rows.map((row) => row.filename))
  }

  private getMigrationFiles(): string[] {
    const migrationsPath = join(__dirname, 'migrations')
    const files = readdirSync(migrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .sort()
    return files
  }

  private parseMigrationFile(filename: string): Migration {
    const migrationsPath = join(__dirname, 'migrations')
    const filePath = join(migrationsPath, filename)
    const content = readFileSync(filePath, 'utf-8')

    // Extract migration ID from filename (e.g., 001_initial_schema.sql -> 1)
    const idMatch = filename.match(/^(\d+)_/)
    if (!idMatch) {
      throw new Error(`Invalid migration filename format: ${filename}`)
    }
    const id = parseInt(idMatch[1], 10)

    // Extract name from filename (e.g., 001_initial_schema.sql -> initial_schema)
    const name = filename
      .replace(/^\d+_/, '')
      .replace(/\.sql$/, '')
      .replace(/_/g, ' ')

    // Split content by -- DOWN marker
    const parts = content.split(/-- DOWN/i)
    const up = parts[0].replace(/-- UP/i, '').trim()
    const down = parts[1] ? parts[1].trim() : ''

    return { id, name, filename, up, down }
  }

  public runMigrations(): void {
    const appliedMigrations = this.getAppliedMigrations()
    const migrationFiles = this.getMigrationFiles()

    const pendingMigrations = migrationFiles.filter((file) => !appliedMigrations.has(file))

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      return
    }

    console.log(`Running ${pendingMigrations.length} migration(s)...`)

    for (const filename of pendingMigrations) {
      const migration = this.parseMigrationFile(filename)

      try {
        console.log(`Applying migration: ${migration.id} - ${migration.name}`)

        // Disable FK enforcement before the transaction so table-recreation
        // migrations can drop tables that are referenced by other tables' FKs.
        // PRAGMA foreign_keys cannot be changed inside an active transaction.
        const fkWasOn = this.db.pragma('foreign_keys', { simple: true }) as number
        if (fkWasOn) this.db.pragma('foreign_keys = OFF')

        try {
          this.db.exec('BEGIN TRANSACTION')
          this.db.exec(migration.up)

          const stmt = this.db.prepare('INSERT INTO migrations (id, name, filename) VALUES (?, ?, ?)')
          stmt.run(migration.id, migration.name, migration.filename)

          this.db.exec('COMMIT')
        } finally {
          if (fkWasOn) this.db.pragma('foreign_keys = ON')
        }

        console.log(`✓ Migration ${migration.id} applied successfully`)
      } catch (error) {
        this.db.exec('ROLLBACK')
        console.error(`✗ Migration ${migration.id} failed:`, error)
        throw error
      }
    }

    console.log('All migrations completed successfully')
  }

  public rollbackLastMigration(): void {
    const lastMigration = this.db
      .prepare('SELECT * FROM migrations ORDER BY id DESC LIMIT 1')
      .get() as { id: number; filename: string } | undefined

    if (!lastMigration) {
      console.log('No migrations to rollback')
      return
    }

    const migration = this.parseMigrationFile(lastMigration.filename)

    if (!migration.down) {
      throw new Error(`Migration ${migration.id} does not have a DOWN script`)
    }

    try {
      console.log(`Rolling back migration: ${migration.id} - ${migration.name}`)

      this.db.exec('BEGIN TRANSACTION')
      this.db.exec(migration.down)

      // Remove the migration record
      const stmt = this.db.prepare('DELETE FROM migrations WHERE id = ?')
      stmt.run(migration.id)

      this.db.exec('COMMIT')

      console.log(`✓ Migration ${migration.id} rolled back successfully`)
    } catch (error) {
      this.db.exec('ROLLBACK')
      console.error(`✗ Rollback of migration ${migration.id} failed:`, error)
      throw error
    }
  }

  public getMigrationStatus(): void {
    const appliedMigrations = this.getAppliedMigrations()
    const migrationFiles = this.getMigrationFiles()

    console.log('\nMigration Status:')
    console.log('=================')

    for (const filename of migrationFiles) {
      const migration = this.parseMigrationFile(filename)
      const status = appliedMigrations.has(filename) ? '✓ Applied' : '✗ Pending'
      console.log(`${status} - ${migration.id}: ${migration.name}`)
    }
  }
}
