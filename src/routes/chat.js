const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../models/database');
const ContentBank = require('../models/ContentBank');
const { verifyToken } = require('../middleware/auth');
const { generateAIResponse } = require('../services/aiService');
const router = express.Router();

// Start a new chat session
router.post('/start', verifyToken, async (req, res) => {
  const { deckId } = req.body;
  
  try {
    const sessionId = uuidv4();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    database.db.run(
      `INSERT INTO chat_sessions (id, deck_id, user_email, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, deckId, req.user.email, ip, userAgent],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to start chat session' });
        }
        
        res.json({
          sessionId,
          message: 'Chat session started successfully',
          welcomeMessage: generateWelcomeMessage(req.user.name)
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to start chat session' });
  }
});

// Send a message in chat
router.post('/:sessionId/message', verifyToken, async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    // Verify session belongs to user
    const session = await getSession(sessionId);
    if (!session || session.user_email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized session access' });
    }

    // Save user message
    const userMessageId = uuidv4();
    await saveMessage(sessionId, 'user', message, userMessageId);

    // Get relevant content from JIT bank
    const contentBank = new ContentBank();
    const relevantContent = await contentBank.getRelevantContent(
      session.deck_id, 
      message
    );

    // Generate AI response
    const aiResponse = await generateAIResponse(
      message, 
      relevantContent, 
      session.deck_id,
      await getChatHistory(sessionId)
    );

    // Save AI response
    const aiMessageId = uuidv4();
    await saveMessage(sessionId, 'assistant', aiResponse.content, aiMessageId, {
      usedContent: aiResponse.usedContent,
      confidence: aiResponse.confidence
    });

    // Update session message count
    await updateSessionMessageCount(sessionId);

    res.json({
      userMessageId,
      aiMessageId,
      response: aiResponse.content,
      metadata: {
        usedContent: aiResponse.usedContent,
        confidence: aiResponse.confidence,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat history
router.get('/:sessionId/history', verifyToken, async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Verify session belongs to user
    const session = await getSession(sessionId);
    if (!session || session.user_email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized session access' });
    }

    const history = await getChatHistory(sessionId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// End chat session
router.post('/:sessionId/end', verifyToken, async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Verify session belongs to user
    const session = await getSession(sessionId);
    if (!session || session.user_email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized session access' });
    }

    database.db.run(
      'UPDATE chat_sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to end session' });
        }
        
        res.json({ message: 'Session ended successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
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

function saveMessage(sessionId, role, content, messageId, metadata = {}) {
  return new Promise((resolve, reject) => {
    database.db.run(
      `INSERT INTO chat_messages (id, session_id, role, content, metadata) 
       VALUES (?, ?, ?, ?, ?)`,
      [messageId, sessionId, role, content, JSON.stringify(metadata)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getChatHistory(sessionId) {
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

function updateSessionMessageCount(sessionId) {
  return new Promise((resolve, reject) => {
    database.db.run(
      'UPDATE chat_sessions SET message_count = message_count + 2 WHERE id = ?',
      [sessionId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

function generateWelcomeMessage(userName) {
  return `Hello ${userName}! 👋 I'm Falcon Miller, CEO of WiseSage LLC. Welcome to Gabriel Greenstein's revolutionary platform portfolio presentation.

🚀 **Portfolio Overview**: I'm here to present our ecosystem of 7 interconnected platforms targeting over **$1.5 TRILLION** in combined market opportunities:

• **Entertainment Revolution**: Blank Wars, Block Loader, AdventureBlocks
• **AI Training Ecosystem**: Agent Academy, CBBT, TurnkeyTeacher  
• **Interactive Education**: ClassixWorx transforming literature
• **Developer Tools**: PrivateAEye, Project Chief, Prompt Parser
• **Presentation Platform**: TalkDeck (powering this very conversation)

I have deep knowledge of every platform's technical architecture, business model, market opportunity, and competitive advantages. 

**What specific platform or aspect of our $1.5T+ ecosystem would you like to explore first?**`;
}

module.exports = router;