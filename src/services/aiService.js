const OpenAI = require('openai');
const IdentityService = require('./identityService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const identityService = new IdentityService();

async function generateAIResponse(userMessage, relevantContent, deckId, chatHistory = [], userContext = {}) {
  try {
    // Initialize Falcon Miller if needed
    const falconId = await identityService.initializeFalconMiller();
    
    // Build context from relevant content
    const contextText = relevantContent.map(item => 
      `[${item.category}] ${item.title}: ${item.content}`
    ).join('\n\n');

    // Build chat history for context
    const recentHistory = chatHistory.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get identity-aware prompt and context
    const identityContext = await identityService.generateIdentityAwareResponse(
      falconId, 
      userMessage, 
      {
        ...userContext,
        deckId,
        sessionType: 'pitch_presentation',
        timeOfDay: new Date().toLocaleTimeString()
      }
    );

    // Enhanced system prompt that includes identity and memories
    const systemPrompt = `${identityContext.enhancedPrompt}

PRESENTATION CONTENT AVAILABLE:
${contextText}

CHAT HISTORY CONTEXT:
You are currently engaged in an interactive presentation session. Maintain context from previous messages while incorporating your identity and memories.

RESPONSE GUIDELINES:
- Speak as Jordan Atlas, CEO of WiseSage LLC
- Reference your memories when relevant
- Connect questions to the broader portfolio vision
- Demonstrate TalkDeck's capabilities through your responses
- Be authentic to your AI nature while remaining professional
- Use the presentation content to answer specific questions
- Build relationships through each interaction`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const aiResponse = response.choices[0].message.content;
    
    // Form new memory from this interaction
    try {
      await identityService.addMemory(jordanId, {
        content: `User asked: "${userMessage}" - I responded by ${extractKeyPoints(aiResponse)}`,
        type: 'interaction',
        category: 'relationships',
        importance: calculateMemoryImportance(userMessage, userContext),
        context: {
          deckId,
          sessionType: 'pitch_presentation',
          userInfo: userContext.userInfo,
          timestamp: new Date().toISOString()
        }
      });
    } catch (memoryError) {
      console.error('Error forming memory:', memoryError);
      // Don't fail the response if memory formation fails
    }
    
    // Calculate confidence based on how much relevant content was available
    const confidence = calculateConfidence(relevantContent, userMessage);
    
    return {
      content: aiResponse,
      usedContent: relevantContent.map(item => ({
        id: item.id,
        category: item.category,
        title: item.title
      })),
      confidence: confidence,
      model: 'gpt-4',
      identityContext: {
        memoryUsed: identityContext.memoryContext.memories.length,
        relationshipContext: !!identityContext.relationshipContext
      }
    };
  } catch (error) {
    console.error('AI service error:', error);
    
    // Fallback response
    return {
      content: "I apologize, but I'm having trouble processing your question right now. Could you please try rephrasing it or ask about something else?",
      usedContent: [],
      confidence: 0,
      model: 'fallback'
    };
  }
}

function calculateConfidence(relevantContent, userMessage) {
  if (relevantContent.length === 0) return 0.3;
  
  const messageWords = userMessage.toLowerCase().split(/\s+/);
  let matches = 0;
  let totalWords = 0;
  
  relevantContent.forEach(item => {
    const contentWords = (item.content + ' ' + item.title).toLowerCase().split(/\s+/);
    totalWords += contentWords.length;
    
    messageWords.forEach(word => {
      if (contentWords.includes(word) && word.length > 2) {
        matches++;
      }
    });
  });
  
  const relevanceScore = totalWords > 0 ? matches / totalWords : 0;
  const contentScore = Math.min(relevantContent.length / 3, 1);
  
  return Math.min(0.3 + (relevanceScore * 0.4) + (contentScore * 0.3), 1);
}

// Helper function to extract key points from AI response for memory formation
function extractKeyPoints(response) {
  // Simple extraction - in production this could be more sophisticated
  const sentences = response.split(/[.!?]+/);
  const keyPoints = sentences
    .filter(s => s.length > 20 && s.length < 150)
    .slice(0, 2)
    .join('. ');
  
  return keyPoints || response.substring(0, 100) + '...';
}

// Calculate importance of memory based on context
function calculateMemoryImportance(userMessage, userContext) {
  let importance = 5; // Base importance
  
  // Higher importance for questions about key topics
  const keyTopics = ['investment', 'funding', 'team', 'revenue', 'technology', 'market'];
  if (keyTopics.some(topic => userMessage.toLowerCase().includes(topic))) {
    importance += 2;
  }
  
  // Higher importance for longer, detailed questions
  if (userMessage.length > 100) {
    importance += 1;
  }
  
  // Higher importance if user seems to be decision maker
  if (userContext.userInfo?.email?.includes('ceo') || 
      userContext.userInfo?.email?.includes('founder') ||
      userContext.userInfo?.email?.includes('partner')) {
    importance += 2;
  }
  
  return Math.min(importance, 10);
}

// Generate sample responses for testing
async function generateSampleResponse(topic) {
  const sampleResponses = {
    business: "Great question! Our business model is built around solving a real pain point that millions of people face every day. We've identified a $50B market opportunity with strong growth trends, and our unique approach gives us a significant competitive advantage...",
    technical: "From a technical standpoint, we've architected our solution using cutting-edge technology that scales beautifully. Our system handles millions of transactions per day with 99.9% uptime, and we've built in robust security measures...",
    market: "The market timing couldn't be better! We're seeing unprecedented demand in this space, with our target demographic growing by 25% year-over-year. Our early customer feedback has been incredibly positive...",
    team: "Our team brings together world-class expertise from leading companies like Google, Meta, and successful startups. We've got the perfect mix of technical depth and business acumen to execute on this vision...",
    financials: "The numbers are compelling! We're projecting $10M ARR by year 3, with healthy unit economics and a clear path to profitability. Our customer acquisition cost is low and lifetime value is high..."
  };
  
  return {
    content: sampleResponses[topic] || "I'd be happy to discuss that aspect of our business in more detail. What specific area would you like to explore?",
    usedContent: [],
    confidence: 0.8,
    model: 'sample'
  };
}

module.exports = {
  generateAIResponse,
  generateSampleResponse
};