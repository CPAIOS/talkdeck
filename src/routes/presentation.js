const express = require('express');
const PresentationEngine = require('../models/PresentationEngine');
const samplePresentation = require('../data/samplePresentation');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

const presentationEngine = new PresentationEngine();

// Initialize a new presentation
router.post('/initialize', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email; // Use email as user ID
        const { presentationId = 'sample', mode = 'manual' } = req.body;
        
        let presentationConfig;
        
        // Load presentation configuration
        if (presentationId === 'sample') {
            presentationConfig = samplePresentation;
        } else {
            // TODO: Load custom presentation configurations
            return res.status(404).json({ error: 'Presentation not found' });
        }
        
        // Set mode
        presentationConfig.mode = mode;
        
        // Initialize presentation
        const presentation = await presentationEngine.initializePresentation(
            presentationConfig,
            userId
        );
        
        res.json({
            success: true,
            presentation: {
                id: presentation.id,
                title: presentation.title,
                description: presentation.description,
                mode: presentation.mode,
                currentSlideIndex: presentation.currentSlideIndex,
                totalSlides: presentation.totalSlides,
                currentSlide: presentation.slides[presentation.currentSlideIndex]
            }
        });
    } catch (error) {
        console.error('Error initializing presentation:', error);
        res.status(500).json({ error: 'Failed to initialize presentation' });
    }
});

// Get current presentation state
router.get('/state', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const userJourney = presentationEngine.getUserJourney(userId);
        
        if (!userJourney) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        res.json({
            success: true,
            state: userJourney
        });
    } catch (error) {
        console.error('Error getting presentation state:', error);
        res.status(500).json({ error: 'Failed to get presentation state' });
    }
});

// Navigate to a specific slide
router.post('/navigate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { slideIndex, direction } = req.body;
        
        const presentation = presentationEngine.activePresentations.get(userId);
        if (!presentation) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        let targetIndex;
        
        if (typeof slideIndex === 'number') {
            targetIndex = slideIndex;
        } else if (direction === 'next') {
            targetIndex = presentation.currentSlideIndex + 1;
        } else if (direction === 'prev') {
            targetIndex = presentation.currentSlideIndex - 1;
        } else {
            return res.status(400).json({ error: 'Invalid navigation parameters' });
        }
        
        // Navigate to slide
        const result = presentationEngine.presentationFlow.goToSlide(
            presentation.id,
            targetIndex
        );
        
        if (!result) {
            return res.status(400).json({ error: 'Cannot navigate to that slide' });
        }
        
        res.json({
            success: true,
            slide: result,
            slideIndex: targetIndex,
            totalSlides: presentation.totalSlides
        });
    } catch (error) {
        console.error('Error navigating presentation:', error);
        res.status(500).json({ error: 'Failed to navigate presentation' });
    }
});

// Handle user choice
router.post('/choice', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { choiceId, context = {} } = req.body;
        
        if (!choiceId) {
            return res.status(400).json({ error: 'Choice ID is required' });
        }
        
        const result = await presentationEngine.handleUserChoice(
            userId,
            choiceId,
            context
        );
        
        if (!result) {
            return res.status(400).json({ error: 'Invalid choice or no result' });
        }
        
        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('Error handling user choice:', error);\n        res.status(500).json({ error: 'Failed to process choice' });
    }
});

// Get interactive elements for current slide
router.get('/interactive', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const presentation = presentationEngine.activePresentations.get(userId);
        
        if (!presentation) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        const currentSlide = presentation.slides[presentation.currentSlideIndex];
        const interactiveElements = currentSlide.interactiveStops || [];
        
        res.json({
            success: true,
            slideId: currentSlide.id,
            interactiveElements: interactiveElements,
            slideType: currentSlide.type
        });
    } catch (error) {
        console.error('Error getting interactive elements:', error);
        res.status(500).json({ error: 'Failed to get interactive elements' });
    }
});

// Update presentation mode
router.post('/mode', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { mode, autoAdvanceTime } = req.body;
        
        const presentation = presentationEngine.activePresentations.get(userId);
        if (!presentation) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        const success = presentationEngine.presentationFlow.updateMode(
            presentation.id,
            mode,
            autoAdvanceTime
        );
        
        if (!success) {
            return res.status(400).json({ error: 'Failed to update presentation mode' });
        }
        
        res.json({
            success: true,
            mode: presentation.mode,
            autoAdvanceTime: presentation.autoAdvanceTime
        });
    } catch (error) {
        console.error('Error updating presentation mode:', error);
        res.status(500).json({ error: 'Failed to update presentation mode' });
    }
});

// Get presentation analytics
router.get('/analytics', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const userJourney = presentationEngine.getUserJourney(userId);
        
        if (!userJourney) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        // Calculate analytics
        const analytics = {
            totalSlides: userJourney.totalSlides,
            currentSlide: userJourney.currentSlide,
            completionPercentage: userJourney.completionPercentage,
            timeSpent: userJourney.timeSpent,
            choicesMade: userJourney.choices.length,
            branchesExplored: userJourney.branchHistory.length,
            visitedSlides: userJourney.visitedSlides.length,
            breadcrumb: userJourney.breadcrumb,
            engagementScore: calculateEngagementScore(userJourney)
        };
        
        res.json({
            success: true,
            analytics: analytics
        });
    } catch (error) {
        console.error('Error getting presentation analytics:', error);
        res.status(500).json({ error: 'Failed to get presentation analytics' });
    }
});

// End presentation
router.post('/end', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const finalJourney = presentationEngine.endPresentation(userId);
        
        if (!finalJourney) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        // TODO: Save journey to database for analytics
        
        res.json({
            success: true,
            message: 'Presentation ended successfully',
            summary: {
                totalChoices: finalJourney.choices.length,
                totalBranches: finalJourney.branchHistory.length,
                timeSpent: finalJourney.endTime - finalJourney.startTime,
                completionPercentage: finalJourney.completionPercentage
            }
        });
    } catch (error) {
        console.error('Error ending presentation:', error);
        res.status(500).json({ error: 'Failed to end presentation' });
    }
});

// Generate contextual suggestions
router.post('/suggestions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { query, context = {} } = req.body;
        
        const presentation = presentationEngine.activePresentations.get(userId);
        if (!presentation) {
            return res.status(404).json({ error: 'No active presentation found' });
        }
        
        const userJourney = presentationEngine.getUserJourney(userId);
        const currentSlide = presentation.slides[presentation.currentSlideIndex];
        
        // Generate contextual suggestions
        const suggestions = await generateContextualSuggestions(
            query,
            currentSlide,
            userJourney,
            context
        );
        
        res.json({
            success: true,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

// Helper function to calculate engagement score
function calculateEngagementScore(userJourney) {
    let score = 0;
    
    // Base score for completion
    score += userJourney.completionPercentage * 0.4;
    
    // Points for making choices
    score += Math.min(userJourney.choices.length * 5, 30);
    
    // Points for exploring branches
    score += userJourney.branchHistory.length * 10;
    
    // Points for time spent (up to reasonable limit)
    const timeMinutes = userJourney.timeSpent / (1000 * 60);
    score += Math.min(timeMinutes * 2, 20);
    
    // Points for slide variety
    score += Math.min(userJourney.visitedSlides.length * 2, 10);
    
    return Math.min(score, 100);
}

// Helper function to generate contextual suggestions
async function generateContextualSuggestions(query, currentSlide, userJourney, context) {
    const suggestions = [];
    
    // Navigation suggestions
    if (currentSlide.metadata?.category) {
        suggestions.push({
            type: 'navigation',
            title: `Explore more about ${currentSlide.metadata.category}`,
            description: 'Deep dive into this topic',
            action: {
                type: 'deep_dive',
                topic: currentSlide.metadata.category
            }
        });
    }
    
    // Content-based suggestions
    if (query && query.toLowerCase().includes('market')) {
        suggestions.push({
            type: 'content',
            title: 'Market Analysis',
            description: 'See our detailed market opportunity analysis',
            action: {
                type: 'navigate',
                target: 'market-opportunity'
            }
        });
    }
    
    // Journey-based suggestions
    if (userJourney.branchHistory.length === 0) {
        suggestions.push({
            type: 'exploration',
            title: 'Interactive Deep Dive',
            description: 'Explore topics in detail with interactive content',
            action: {
                type: 'show_branch_options'
            }
        });
    }
    
    return suggestions;
}

module.exports = router;