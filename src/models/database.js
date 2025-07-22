const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    // NDA signatures table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS nda_signatures (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        signature_data TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        deck_id TEXT NOT NULL
      )
    `);

    // TalkDeck configurations
    this.db.run(`
      CREATE TABLE IF NOT EXISTS talkdecks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        owner_email TEXT NOT NULL,
        config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat sessions
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        user_email TEXT,
        ip_address TEXT,
        user_agent TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        message_count INTEGER DEFAULT 0,
        FOREIGN KEY (deck_id) REFERENCES talkdecks (id)
      )
    `);

    // Chat messages
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
      )
    `);

    // Content bank items
    this.db.run(`
      CREATE TABLE IF NOT EXISTS content_bank (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deck_id) REFERENCES talkdecks (id)
      )
    `);

    // Share tracking
    this.db.run(`
      CREATE TABLE IF NOT EXISTS share_tracking (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        share_method TEXT NOT NULL,
        recipient TEXT,
        clicked BOOLEAN DEFAULT FALSE,
        first_click_at DATETIME,
        click_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deck_id) REFERENCES talkdecks (id)
      )
    `);
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = new Database();