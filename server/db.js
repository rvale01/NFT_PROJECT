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
    asset_id INTEGER
  )
`)

export default db
