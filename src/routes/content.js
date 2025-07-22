const express = require('express');
const ContentBank = require('../models/ContentBank');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get all content categories for a deck
router.get('/:deckId/categories', verifyToken, async (req, res) => {
  const { deckId } = req.params;
  
  try {
    const contentBank = new ContentBank();
    const content = await contentBank.getAllContent(deckId);
    
    const categories = [...new Set(content.map(item => item.category))];
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get content by category
router.get('/:deckId/category/:category', verifyToken, async (req, res) => {
  const { deckId, category } = req.params;
  
  try {
    const contentBank = new ContentBank();
    const content = await contentBank.getContentByCategory(deckId, category);
    
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Search content
router.get('/:deckId/search', verifyToken, async (req, res) => {
  const { deckId } = req.params;
  const { q, category, limit = 10 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  try {
    const contentBank = new ContentBank();
    const content = await contentBank.searchContent(deckId, q, {
      category,
      limit: parseInt(limit)
    });
    
    res.json({ content, query: q });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search content' });
  }
});

module.exports = router;