import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = new Database(join(__dirname, 'marketplace.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS nfts (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    price REAL,
    royalty REAL,
    image_url TEXT,
    creator TEXT,
    owner TEXT,
    status TEXT,
    created_at TEXT,
    purchased_at TEXT,
    asset_id INTEGER,
    asset_transferred INTEGER DEFAULT 1
  )
`)

// Add asset_transferred column to existing DBs that don't have it yet
try {
  db.exec(`ALTER TABLE nfts ADD COLUMN asset_transferred INTEGER DEFAULT 1`)
} catch {
  // Column already exists — safe to ignore
}

export default db
