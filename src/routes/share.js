const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const database = require('../models/database');
const router = express.Router();

// Create share link
router.post('/:deckId/link', async (req, res) => {
  const { deckId } = req.params;
  const { method = 'link', recipient = null } = req.body;
  
  try {
    const shareId = uuidv4();
    const shareUrl = `${process.env.APP_URL}/deck/${deckId}?share=${shareId}`;
    
    database.db.run(
      `INSERT INTO share_tracking (id, deck_id, share_method, recipient) 
       VALUES (?, ?, ?, ?)`,
      [shareId, deckId, method, recipient],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create share link' });
        }
        
        res.json({
          shareId,
          shareUrl,
          method,
          recipient
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Send via email
router.post('/:deckId/email', async (req, res) => {
  const { deckId } = req.params;
  const { to, subject, message, senderName = 'TalkDeck' } = req.body;
  
  if (!to || !subject) {
    return res.status(400).json({ error: 'Email and subject are required' });
  }
  
  try {
    // Create share tracking
    const shareId = uuidv4();
    const shareUrl = `${process.env.APP_URL}/deck/${deckId}?share=${shareId}`;
    
    await new Promise((resolve, reject) => {
      database.db.run(
        `INSERT INTO share_tracking (id, deck_id, share_method, recipient) 
         VALUES (?, ?, ?, ?)`,
        [shareId, deckId, 'email', to],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Get deck info
    const deck = await getDeckInfo(deckId);
    
    // Send email
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        
        ${message ? `<p>${message}</p>` : ''}
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${deck.title}</h3>
          <p>${deck.description}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${shareUrl}" 
             style="background: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View TalkDeck
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This TalkDeck includes an interactive presentation with NDA protection.
          You'll be asked to sign a brief confidentiality agreement before viewing.
        </p>
        
        <p style="color: #666; font-size: 12px;">
          Sent via TalkDeck - Interactive Pitch Presentations
        </p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: emailContent
    });
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      shareId,
      shareUrl,
      sentTo: to
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Track share click
router.post('/:deckId/click/:shareId', async (req, res) => {
  const { deckId, shareId } = req.params;
  
  try {
    const now = new Date().toISOString();
    
    database.db.run(
      `UPDATE share_tracking 
       SET clicked = TRUE, 
           first_click_at = COALESCE(first_click_at, ?),
           click_count = click_count + 1
       WHERE id = ? AND deck_id = ?`,
      [now, shareId, deckId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to track click' });
        }
        
        res.json({ success: true, tracked: this.changes > 0 });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Get share analytics
router.get('/:deckId/analytics', async (req, res) => {
  const { deckId } = req.params;
  
  try {
    database.db.all(
      `SELECT 
        share_method,
        COUNT(*) as total_shares,
        COUNT(CASE WHEN clicked = TRUE THEN 1 END) as clicked_shares,
        AVG(click_count) as avg_clicks,
        MAX(click_count) as max_clicks
       FROM share_tracking 
       WHERE deck_id = ? 
       GROUP BY share_method`,
      [deckId],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch analytics' });
        }
        
        database.db.all(
          `SELECT * FROM share_tracking 
           WHERE deck_id = ? 
           ORDER BY created_at DESC 
           LIMIT 50`,
          [deckId],
          (err, recent) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch recent shares' });
            }
            
            res.json({
              stats,
              recent,
              summary: {
                total: stats.reduce((sum, s) => sum + s.total_shares, 0),
                clicked: stats.reduce((sum, s) => sum + s.clicked_shares, 0),
                clickRate: stats.reduce((sum, s) => sum + s.clicked_shares, 0) / 
                          stats.reduce((sum, s) => sum + s.total_shares, 0) * 100
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper functions
function getDeckInfo(deckId) {
  return new Promise((resolve, reject) => {
    database.db.get(
      'SELECT * FROM talkdecks WHERE id = ?',
      [deckId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

module.exports = router;