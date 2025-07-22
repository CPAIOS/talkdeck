const express = require('express');
const database = require('../models/database');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get session details
router.get('/:sessionId', verifyToken, async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    database.db.get(
      'SELECT * FROM chat_sessions WHERE id = ?',
      [sessionId],
      (err, session) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.user_email !== req.user.email) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        
        res.json({ session });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get all sessions for a user
router.get('/user/sessions', verifyToken, async (req, res) => {
  const { deckId } = req.query;
  
  try {
    let sql = `
      SELECT cs.*, t.title as deck_title 
      FROM chat_sessions cs
      JOIN talkdecks t ON cs.deck_id = t.id
      WHERE cs.user_email = ?
    `;
    let params = [req.user.email];
    
    if (deckId) {
      sql += ' AND cs.deck_id = ?';
      params.push(deckId);
    }
    
    sql += ' ORDER BY cs.started_at DESC';
    
    database.db.all(sql, params, (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ sessions });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Export session data
router.get('/:sessionId/export', verifyToken, async (req, res) => {
  const { sessionId } = req.params;
  const { format = 'json' } = req.query;
  
  try {
    // Verify session ownership
    const session = await getSession(sessionId);
    if (!session || session.user_email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get session messages
    const messages = await getSessionMessages(sessionId);
    
    const exportData = {
      session: {
        id: session.id,
        deck_id: session.deck_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        message_count: session.message_count
      },
      messages: messages,
      exported_at: new Date().toISOString()
    };
    
    if (format === 'json') {
      res.json(exportData);
    } else if (format === 'txt') {
      const textContent = formatAsText(exportData);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.txt"`);
      res.send(textContent);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export session' });
  }
});

// Helper functions
function getSession(sessionId) {
  return new Promise((resolve, reject) => {
    database.db.get(
      'SELECT * FROM chat_sessions WHERE id = ?',
      [sessionId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function getSessionMessages(sessionId) {
  return new Promise((resolve, reject) => {
    database.db.all(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          metadata: JSON.parse(row.metadata || '{}')
        })));
      }
    );
  });
}

function formatAsText(exportData) {
  const { session, messages } = exportData;
  
  let text = `TalkDeck Session Export\n`;
  text += `Session ID: ${session.id}\n`;
  text += `Started: ${session.started_at}\n`;
  text += `Ended: ${session.ended_at || 'In progress'}\n`;
  text += `Messages: ${session.message_count}\n\n`;
  text += `=${'='.repeat(50)}\n\n`;
  
  messages.forEach(msg => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const role = msg.role === 'user' ? 'YOU' : 'TALKDECK';
    text += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
  });
  
  return text;
}

module.exports = router;