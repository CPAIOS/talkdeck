const IdentitySystem = require('../models/IdentitySystem');
const falconMillerConfig = require('../identities/falcon-miller');

class IdentityService {
  constructor() {
    this.identitySystem = new IdentitySystem();
    this.activeIdentities = new Map(); // Cache loaded identities
  }

  // Initialize Falcon Miller if not already created
  async initializeFalconMiller() {
    try {
      // Check if Falcon already exists
      const existing = await this.getIdentityByName('Falcon Miller');
      if (existing) {
        return existing.id;
      }

      // Create Falcon Miller identity
      const identityId = await this.identitySystem.createIdentity({
        name: falconMillerConfig.identity.name,
        role: falconMillerConfig.identity.role,
        coreValues: falconMillerConfig.identity.coreValues,
        personalityTraits: falconMillerConfig.identity.personalityTraits,
        baseMemories: falconMillerConfig.baseMemories
      });

      console.log(`Falcon Miller identity created with ID: ${identityId}`);
      return identityId;
    } catch (error) {
      console.error('Error initializing Jordan Atlas:', error);
      throw error;
    }
  }

  // Get lightweight identity prompt for AI initialization
  async getIdentityPrompt(identityId, context = {}) {
    try {
      const identity = await this.identitySystem.getIdentityIntro(identityId);
      
      // Build context-aware prompt
      let prompt = `IDENTITY INITIALIZATION

Name: ${identity.name}
Role: ${identity.role}

CORE VALUES:
${identity.coreValues.map(value => `• ${value}`).join('\n')}

PERSONALITY:
• Leadership: ${identity.personality.leadership.style}
• Communication: ${identity.personality.communication.tone}
• Approach: ${identity.personality.leadership.approach}

ESSENTIAL MEMORIES:
${identity.essentialMemories.map(memory => 
  `[${memory.category.toUpperCase()}] ${memory.content}`
).join('\n')}

MEMORY SYSTEM STATUS:
${Object.entries(identity.memoryOverview.categories).map(
  ([cat, info]) => `• ${cat}: ${info.count} memories available`
).join('\n')}

JIT CAPABILITIES:
- Memory search enabled for contextual information
- Relationship context loading
- Real-time memory formation
- Identity evolution tracking

${jordanAtlasConfig.introPrompt}

CURRENT CONTEXT:
${this.buildContextPrompt(context)}

Remember: You can search your memory system at any time by identifying relevant keywords or asking for specific types of memories. Your identity evolves through each interaction.`;

      return prompt;
    } catch (error) {
      console.error('Error building identity prompt:', error);
      throw error;
    }
  }

  // Search memories during conversation
  async searchMemories(identityId, query, context = {}) {
    try {
      const memories = await this.identitySystem.searchMemories(identityId, query, context);
      
      return {
        memories: memories.map(memory => ({
          id: memory.id,
          type: memory.memory_type,
          category: memory.category,
          content: memory.content,
          importance: memory.importance,
          context: JSON.parse(memory.context || '{}'),
          accessed: memory.access_count
        })),
        searchQuery: query,
        totalFound: memories.length
      };
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  // Add new memory during conversation
  async addMemory(identityId, memoryData) {
    try {
      const { content, type = 'experience', category = 'general', importance = 5, context = {} } = memoryData;
      
      const memoryIds = await this.identitySystem.addMemories(identityId, [{
        content,
        type,
        category,
        importance,
        context
      }]);

      return memoryIds[0];
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  }

  // Load relationship context
  async getRelationshipContext(identityId, personId) {
    try {
      return await this.identitySystem.getRelationshipContext(identityId, personId);
    } catch (error) {
      console.error('Error loading relationship context:', error);
      return null;
    }
  }

  // Update relationship after interaction
  async updateRelationship(identityId, personData) {
    try {
      return await this.identitySystem.updateRelationship(identityId, personData);
    } catch (error) {
      console.error('Error updating relationship:', error);
      throw error;
    }
  }

  // Generate enhanced AI response with identity context
  async generateIdentityAwareResponse(identityId, userMessage, conversationContext = {}) {
    try {
      // 1. Get identity prompt
      const identityPrompt = await this.getIdentityPrompt(identityId, conversationContext);
      
      // 2. Search relevant memories
      const memorySearch = await this.searchMemories(identityId, userMessage, {
        importance: 6,
        limit: 5
      });
      
      // 3. Load relationship context if user is known
      let relationshipContext = null;
      if (conversationContext.userId) {
        relationshipContext = await this.getRelationshipContext(identityId, conversationContext.userId);
      }
      
      // 4. Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt({
        identityPrompt,
        memorySearch,
        relationshipContext,
        userMessage,
        conversationContext
      });
      
      return {
        enhancedPrompt,
        memoryContext: memorySearch,
        relationshipContext,
        identityId
      };
    } catch (error) {
      console.error('Error generating identity-aware response:', error);
      throw error;
    }
  }

  // Helper methods
  buildContextPrompt(context) {
    const contextParts = [];
    
    if (context.userInfo) {
      contextParts.push(`USER: ${context.userInfo.name} (${context.userInfo.email})`);
    }
    
    if (context.sessionType) {
      contextParts.push(`SESSION TYPE: ${context.sessionType}`);
    }
    
    if (context.deckId) {
      contextParts.push(`PRESENTATION: ${context.deckId}`);
    }
    
    if (context.timeOfDay) {
      contextParts.push(`TIME: ${context.timeOfDay}`);
    }
    
    return contextParts.length > 0 ? contextParts.join('\n') : 'General conversation context';
  }

  buildEnhancedPrompt(data) {
    const { identityPrompt, memorySearch, relationshipContext, userMessage, conversationContext } = data;
    
    let enhanced = identityPrompt;
    
    if (memorySearch.memories.length > 0) {
      enhanced += `\n\nRELEVANT MEMORIES FOUND:
${memorySearch.memories.map(memory => 
  `[${memory.category}] ${memory.content}`
).join('\n')}`;
    }
    
    if (relationshipContext) {
      enhanced += `\n\nRELATIONSHIP CONTEXT:
Previous interactions: ${relationshipContext.interaction_count}
Relationship type: ${relationshipContext.relationship_type || 'Professional'}
Notes: ${relationshipContext.notes || 'None'}`;
      
      if (relationshipContext.memories.length > 0) {
        enhanced += `\nShared memories:
${relationshipContext.memories.map(memory => `• ${memory.content}`).join('\n')}`;
      }
    }
    
    enhanced += `\n\nCURRENT USER MESSAGE: "${userMessage}"
    
Please respond as ${jordanAtlasConfig.identity.name}, incorporating any relevant memories and relationship context. If you need additional specific memories, you can request them.`;
    
    return enhanced;
  }

  async getIdentityByName(name) {
    return new Promise((resolve, reject) => {
      this.identitySystem.db.get(
        'SELECT * FROM identity_index WHERE name = ?',
        [name],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Log identity evolution
  async logEvolution(identityId, evolutionData) {
    try {
      return await this.identitySystem.logEvolution(identityId, evolutionData);
    } catch (error) {
      console.error('Error logging evolution:', error);
      throw error;
    }
  }
}

module.exports = IdentityService;