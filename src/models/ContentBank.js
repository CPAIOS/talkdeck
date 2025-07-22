const { v4: uuidv4 } = require('uuid');
const database = require('./database');

class ContentBank {
  constructor() {
    this.db = database.db;
  }

  // Create a new content item
  async createContent(deckId, category, title, content, metadata = {}) {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO content_bank (id, deck_id, category, title, content, metadata) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, deckId, category, title, content, JSON.stringify(metadata)],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(id);
          }
        }
      );
    });
  }

  // Get relevant content for a query (JIT loading)
  async getRelevantContent(deckId, query, category = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM content_bank 
        WHERE deck_id = ? 
        AND (content LIKE ? OR title LIKE ?)
      `;
      let params = [deckId, `%${query}%`, `%${query}%`];

      if (category) {
        sql += ` AND category = ?`;
        params.push(category);
      }

      sql += ` ORDER BY created_at DESC LIMIT 10`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            metadata: JSON.parse(row.metadata || '{}')
          })));
        }
      });
    });
  }

  // Get content by category
  async getContentByCategory(deckId, category) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM content_bank 
         WHERE deck_id = ? AND category = ? 
         ORDER BY created_at DESC`,
        [deckId, category],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            })));
          }
        }
      );
    });
  }

  // Get all content for a deck
  async getAllContent(deckId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM content_bank 
         WHERE deck_id = ? 
         ORDER BY category, created_at DESC`,
        [deckId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            })));
          }
        }
      );
    });
  }

  // Update content
  async updateContent(id, title, content, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE content_bank 
         SET title = ?, content = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [title, content, JSON.stringify(metadata), id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Delete content
  async deleteContent(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM content_bank WHERE id = ?`,
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Search content with advanced filters
  async searchContent(deckId, searchTerm, filters = {}) {
    let sql = `
      SELECT * FROM content_bank 
      WHERE deck_id = ? 
      AND (content LIKE ? OR title LIKE ?)
    `;
    let params = [deckId, `%${searchTerm}%`, `%${searchTerm}%`];

    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }

    if (filters.startDate) {
      sql += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(filters.limit || 20);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            metadata: JSON.parse(row.metadata || '{}')
          })));
        }
      });
    });
  }
}

module.exports = ContentBank;