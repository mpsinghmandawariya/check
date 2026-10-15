const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const configured = process.env.SQLITE_PATH || "./data/wordwise.sqlite";
const dbPath = path.isAbsolute(configured)
  ? configured
  : path.resolve(process.cwd(), configured);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`CREATE TABLE IF NOT EXISTS writing_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 original_text TEXT NOT NULL,
 corrected_text TEXT NOT NULL,
 corrections_json TEXT NOT NULL DEFAULT '[]',
 suggestions_json TEXT NOT NULL DEFAULT '[]',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
); CREATE INDEX IF NOT EXISTS idx_history_created ON writing_history(created_at DESC);`);
module.exports = { db, dbPath };
