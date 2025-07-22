const { v4: uuidv4 } = require('uuid');
const database = require('./database');
const fs = require('fs').promises;
const path = require('path');

class IdentitySystem {
  constructor() {
    this.db = database.db;
    this.initializeTables();
  }

  initializeTables() {
    // Identity index table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS identity_index (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        core_values TEXT NOT NULL,
        personality_traits TEXT NOT NULL,
        memory_map TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Memory bank table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS memory_bank (
        id TEXT PRIMARY KEY,
        identity_id TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        category TEXT NOT NULL,
        importance INTEGER DEFAULT 5,
        content TEXT NOT NULL,
        context TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0,
        last_accessed DATETIME,
        FOREIGN KEY (identity_id) REFERENCES identity_index (id)
      )
    `);

    // Relationship map table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        identity_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        person_name TEXT NOT NULL,
        relationship_type TEXT,
        interaction_count INTEGER DEFAULT 0,
        memory_refs TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (identity_id) REFERENCES identity_index (id)
      )
    `);

    // Identity evolution log
    this.db.run(`
      CREATE TABLE IF NOT EXISTS evolution_log (
        id TEXT PRIMARY KEY,
        identity_id TEXT NOT NULL,
        evolution_type TEXT NOT NULL,
        before_state TEXT,
        after_state TEXT,
        trigger_context TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (identity_id) REFERENCES identity_index (id)
      )
    `);
  }

  // Create a new identity with lightweight index
  async createIdentity(config) {
    const {
      name,
      role,
      coreValues,
      personalityTraits,
      baseMemories = []
    } = config;

    const identityId = uuidv4();
    
    // Create memory map structure
    const memoryMap = {
      categories: {
        professional: { count: 0, lastUpdated: null },
        personal: { count: 0, lastUpdated: null },
        expertise: { count: 0, lastUpdated: null },
        relationships: { count: 0, lastUpdated: null },
        experiences: { count: 0, lastUpdated: null }
      },
      quickAccess: [], // Most important memories
      contextTriggers: {} // Keywords that trigger memory loads
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO identity_index (id, name, role, core_values, personality_traits, memory_map)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          identityId,
          name,
          role,
          JSON.stringify(coreValues),
          JSON.stringify(personalityTraits),
          JSON.stringify(memoryMap)
        ],
        async (err) => {
          if (err) {
            reject(err);
          } else {
            // Add base memories if provided
            if (baseMemories.length > 0) {
              await this.addMemories(identityId, baseMemories);
            }
            resolve(identityId);
          }
        }
      );
    });
  }

  // Get lightweight identity intro (for initial prompt)
  async getIdentityIntro(identityId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT name, role, core_values, personality_traits, memory_map 
         FROM identity_index WHERE id = ?`,
        [identityId],
        async (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('Identity not found'));
          } else {
            // Get only the most important memories for intro
            const quickMemories = await this.getQuickAccessMemories(identityId);
            
            const intro = {
              name: row.name,
              role: row.role,
              coreValues: JSON.parse(row.core_values),
              personality: JSON.parse(row.personality_traits),
              memoryOverview: JSON.parse(row.memory_map),
              essentialMemories: quickMemories,
              memorySearchEnabled: true
            };
            
            resolve(intro);
          }
        }
      );
    });
  }

  // Search memories based on context
  async searchMemories(identityId, query, context = {}) {
    const { category, importance, limit = 10 } = context;
    
    let sql = `
      SELECT * FROM memory_bank 
      WHERE identity_id = ? 
      AND (content LIKE ? OR context LIKE ?)
    `;
    let params = [identityId, `%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (importance) {
      sql += ` AND importance >= ?`;
      params.push(importance);
    }

    sql += ` ORDER BY importance DESC, last_accessed DESC LIMIT ?`;
    params.push(limit);

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Update access count and last accessed
          rows.forEach(memory => {
            this.db.run(
              `UPDATE memory_bank 
               SET access_count = access_count + 1, 
                   last_accessed = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [memory.id]
            );
          });
          resolve(rows);
        }
      });
    });
  }

  // Add new memories
  async addMemories(identityId, memories) {
    const promises = memories.map(memory => {
      const memoryId = uuidv4();
      const {
        type = 'experience',
        category = 'general',
        importance = 5,
        content,
        context = null
      } = memory;

      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO memory_bank 
           (id, identity_id, memory_type, category, importance, content, context)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [memoryId, identityId, type, category, importance, content, JSON.stringify(context)],
          function(err) {
            if (err) reject(err);
            else resolve(memoryId);
          }
        );
      });
    });

    const results = await Promise.all(promises);
    await this.updateMemoryMap(identityId);
    return results;
  }

  // Update relationship information
  async updateRelationship(identityId, personInfo) {
    const { personId, name, type, newMemoryRefs = [], notes } = personInfo;
    
    return new Promise((resolve, reject) => {
      // Check if relationship exists
      this.db.get(
        `SELECT * FROM relationships WHERE identity_id = ? AND person_id = ?`,
        [identityId, personId],
        (err, existing) => {
          if (err) {
            reject(err);
          } else if (existing) {
            // Update existing relationship
            const memoryRefs = JSON.parse(existing.memory_refs || '[]');
            memoryRefs.push(...newMemoryRefs);
            
            this.db.run(
              `UPDATE relationships 
               SET interaction_count = interaction_count + 1,
                   memory_refs = ?,
                   notes = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [JSON.stringify(memoryRefs), notes || existing.notes, existing.id],
              function(err) {
                if (err) reject(err);
                else resolve(existing.id);
              }
            );
          } else {
            // Create new relationship
            const relationshipId = uuidv4();
            this.db.run(
              `INSERT INTO relationships 
               (id, identity_id, person_id, person_name, relationship_type, memory_refs, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [relationshipId, identityId, personId, name, type, JSON.stringify(newMemoryRefs), notes],
              function(err) {
                if (err) reject(err);
                else resolve(relationshipId);
              }
            );
          }
        }
      );
    });
  }

  // Get relationship context
  async getRelationshipContext(identityId, personId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM relationships WHERE identity_id = ? AND person_id = ?`,
        [identityId, personId],
        async (err, relationship) => {
          if (err) {
            reject(err);
          } else if (!relationship) {
            resolve(null);
          } else {
            // Get associated memories
            const memoryRefs = JSON.parse(relationship.memory_refs || '[]');
            const memories = await this.getMemoriesByIds(identityId, memoryRefs);
            
            resolve({
              ...relationship,
              memories,
              memoryRefs: undefined // Remove raw refs
            });
          }
        }
      );
    });
  }

  // Log identity evolution
  async logEvolution(identityId, evolutionData) {
    const { type, beforeState, afterState, triggerContext } = evolutionData;
    const evolutionId = uuidv4();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO evolution_log 
         (id, identity_id, evolution_type, before_state, after_state, trigger_context)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          evolutionId,
          identityId,
          type,
          JSON.stringify(beforeState),
          JSON.stringify(afterState),
          JSON.stringify(triggerContext)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(evolutionId);
        }
      );
    });
  }

  // Helper methods
  async getQuickAccessMemories(identityId, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM memory_bank 
         WHERE identity_id = ? AND importance >= 8
         ORDER BY importance DESC, access_count DESC
         LIMIT ?`,
        [identityId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getMemoriesByIds(identityId, memoryIds) {
    if (memoryIds.length === 0) return [];
    
    const placeholders = memoryIds.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM memory_bank 
         WHERE identity_id = ? AND id IN (${placeholders})`,
        [identityId, ...memoryIds],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async updateMemoryMap(identityId) {
    // Update memory counts in the identity index
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT category, COUNT(*) as count, MAX(timestamp) as lastUpdated
         FROM memory_bank WHERE identity_id = ?
         GROUP BY category`,
        [identityId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            this.db.get(
              `SELECT memory_map FROM identity_index WHERE id = ?`,
              [identityId],
              (err, identity) => {
                if (err) {
                  reject(err);
                } else {
                  const memoryMap = JSON.parse(identity.memory_map);
                  
                  rows.forEach(row => {
                    if (memoryMap.categories[row.category]) {
                      memoryMap.categories[row.category].count = row.count;
                      memoryMap.categories[row.category].lastUpdated = row.lastUpdated;
                    }
                  });
                  
                  this.db.run(
                    `UPDATE identity_index SET memory_map = ? WHERE id = ?`,
                    [JSON.stringify(memoryMap), identityId],
                    function(err) {
                      if (err) reject(err);
                      else resolve(true);
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  }
}

module.exports = IdentitySystem;