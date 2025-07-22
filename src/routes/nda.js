const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../models/database');
const router = express.Router();

// Get NDA for a specific deck
router.get('/:deckId', async (req, res) => {
  const { deckId } = req.params;
  
  try {
    // Get deck info to customize NDA
    database.db.get(
      'SELECT * FROM talkdecks WHERE id = ?',
      [deckId],
      (err, deck) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!deck) {
          return res.status(404).json({ error: 'Deck not found' });
        }

        const config = JSON.parse(deck.config || '{}');
        const ndaText = config.ndaText || getDefaultNDAText(deck.title);
        
        res.json({
          deckId,
          title: deck.title,
          description: deck.description,
          ndaText,
          requiresSignature: config.requiresSignature !== false
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NDA' });
  }
});

// Sign NDA
router.post('/:deckId/sign', async (req, res) => {
  const { deckId } = req.params;
  const { email, name, signature } = req.body;
  
  if (!email || !name || !signature) {
    return res.status(400).json({ error: 'Email, name, and signature are required' });
  }

  try {
    const signatureId = uuidv4();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    database.db.run(
      `INSERT INTO nda_signatures (id, email, name, signature_data, ip_address, user_agent, deck_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [signatureId, email, name, signature, ip, userAgent, deckId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to save signature' });
        }
        
        // Generate access token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { 
            deckId, 
            email, 
            name, 
            signatureId,
            signedAt: new Date().toISOString()
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          success: true,
          message: 'NDA signed successfully',
          accessToken: token,
          expiresIn: '24h'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to process signature' });
  }
});

// Verify NDA signature
router.post('/:deckId/verify', async (req, res) => {
  const { deckId } = req.params;
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    if (decoded.deckId !== deckId) {
      return res.status(403).json({ error: 'Invalid access token for this deck' });
    }
    
    res.json({
      valid: true,
      email: decoded.email,
      name: decoded.name,
      signedAt: decoded.signedAt,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired access token' });
  }
});

function getDefaultNDAText(deckTitle) {
  return `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into by and between the presenter of "${deckTitle}" and the undersigned recipient.

CONFIDENTIAL INFORMATION: The information contained in this TalkDeck presentation, including but not limited to business plans, financial information, product details, technical specifications, and strategic plans, is considered confidential and proprietary.

OBLIGATIONS: The recipient agrees to:
1. Keep all information strictly confidential
2. Not disclose any information to third parties without written consent
3. Use the information solely for evaluation purposes
4. Return or destroy all materials upon request

DURATION: This agreement remains in effect for 2 years from the date of signing.

By signing below, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement.
  `.trim();
}

module.exports = router;