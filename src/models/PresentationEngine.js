const { PresentationFlow } = require('./PresentationFlow');
const ContentBank = require('./ContentBank');

class PresentationEngine {
    constructor() {
        this.presentationFlow = new PresentationFlow();
        this.contentBank = new ContentBank();
        this.activePresentations = new Map();
        this.userJourneys = new Map();
    }

    // Initialize a new presentation session
    async initializePresentation(config, userId) {
        const presentation = this.presentationFlow.createPresentation(config);
        
        // Track user journey
        const userJourney = {
            userId,
            presentationId: presentation.id,
            startTime: new Date(),
            choices: [],
            currentPath: 'main',
            visitedSlides: [],
            branchHistory: []
        };
        
        this.activePresentations.set(userId, presentation);
        this.userJourneys.set(userId, userJourney);
        
        return presentation;
    }

    // Handle user choice and determine next action
    async handleUserChoice(userId, choiceId, context = {}) {
        const presentation = this.activePresentations.get(userId);
        const userJourney = this.userJourneys.get(userId);
        
        if (!presentation || !userJourney) {
            throw new Error('No active presentation found for user');
        }

        // Record the choice
        const choice = {
            slideIndex: presentation.currentSlideIndex,
            choiceId,
            timestamp: new Date(),
            context
        };
        
        userJourney.choices.push(choice);
        
        // Execute the choice action
        const result = this.presentationFlow.handleUserChoice(presentation.id, choiceId);
        
        if (result) {
            return await this.processChoiceResult(userId, result, choice);
        }
        
        return null;
    }

    // Process the result of a user choice
    async processChoiceResult(userId, result, choice) {
        const presentation = this.activePresentations.get(userId);
        const userJourney = this.userJourneys.get(userId);
        
        switch (result.type) {
            case 'navigation':
                // Simple navigation to another slide
                userJourney.visitedSlides.push(presentation.currentSlideIndex);
                return {
                    type: 'slide_change',
                    slide: result.newSlide,
                    slideIndex: presentation.currentSlideIndex
                };

            case 'content_injection':
                // Inject additional content into current slide
                return {
                    type: 'content_injection',
                    content: result.content,
                    insertionPoint: 'after_main_content'
                };

            case 'branch':
                // Create a new branch path
                return await this.createBranch(userId, result.branchSlides, choice);

            case 'ai_response':
                // Trigger AI response with specific context
                return await this.generateContextualResponse(userId, result.context, result.prompt);

            case 'deep_dive':
                // Create a deep dive experience
                return await this.createDeepDive(userId, result.topic, result.content);

            default:
                return null;
        }
    }

    // Create a branching path
    async createBranch(userId, branchSlides, originChoice) {
        const presentation = this.activePresentations.get(userId);
        const userJourney = this.userJourneys.get(userId);
        
        // Create unique branch ID
        const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store branch information
        const branch = {
            id: branchId,
            originSlide: presentation.currentSlideIndex,
            originChoice: originChoice,
            slides: branchSlides,
            returnToSlide: presentation.currentSlideIndex + 1,
            createdAt: new Date()
        };
        
        userJourney.branchHistory.push(branch);
        userJourney.currentPath = branchId;
        
        // Add branch slides to presentation
        const insertIndex = presentation.currentSlideIndex + 1;
        presentation.slides.splice(insertIndex, 0, ...branchSlides);
        
        // Update slide indices
        presentation.totalSlides = presentation.slides.length;
        
        // Navigate to first branch slide
        presentation.currentSlideIndex = insertIndex;
        
        return {
            type: 'branch_created',
            branchId,
            firstSlide: branchSlides[0],
            slideIndex: insertIndex,
            breadcrumb: this.generateBreadcrumb(userId)
        };
    }

    // Generate contextual AI response
    async generateContextualResponse(userId, context, prompt) {
        const presentation = this.activePresentations.get(userId);
        const userJourney = this.userJourneys.get(userId);
        
        // Get relevant content from content bank
        const relevantContent = await this.contentBank.getRelevantContent(
            presentation.id,
            prompt,
            context.category
        );
        
        // Build context for AI
        const aiContext = {
            currentSlide: presentation.slides[presentation.currentSlideIndex],
            userJourney: userJourney.choices,
            relevantContent,
            presentationContext: context
        };
        
        // TODO: Integrate with AI service
        // For now, return a mock response
        return {
            type: 'ai_response',
            response: this.generateMockResponse(prompt, aiContext),
            context: aiContext,
            suggestedActions: this.generateSuggestedActions(aiContext)
        };
    }

    // Create a deep dive experience
    async createDeepDive(userId, topic, content) {
        const presentation = this.activePresentations.get(userId);
        
        // Get all related content for the topic
        const relatedContent = await this.contentBank.getContentByCategory(
            presentation.id,
            topic
        );
        
        // Create deep dive slides
        const deepDiveSlides = this.createDeepDiveSlides(topic, content, relatedContent);
        
        return await this.createBranch(userId, deepDiveSlides, {
            type: 'deep_dive',
            topic,
            timestamp: new Date()
        });
    }

    // Create slides for deep dive content
    createDeepDiveSlides(topic, mainContent, relatedContent) {
        const slides = [];
        
        // Main deep dive slide
        slides.push({
            id: `deep_dive_${topic}_main`,
            title: `Deep Dive: ${topic}`,
            type: 'deep_dive',
            visual: {
                type: 'image',
                src: `${topic}-deep-dive.svg`,
                animation: 'slideInLeft'
            },
            content: {
                speaker: 'Falcon Miller',
                text: mainContent,
                timing: 'after_visual'
            },
            interactiveStops: [{
                id: 'deep_dive_choice',
                type: 'choice',
                prompt: 'What aspect would you like to explore further?',
                choices: relatedContent.map(content => ({
                    id: `explore_${content.id}`,
                    text: content.title,
                    description: content.content.substring(0, 100) + '...',
                    action: {
                        type: 'show_content',
                        content: content
                    }
                }))
            }]
        });
        
        // Related content slides
        relatedContent.forEach(content => {
            slides.push({
                id: `deep_dive_${topic}_${content.id}`,
                title: content.title,
                type: 'deep_dive_detail',
                visual: {
                    type: 'image',
                    src: content.metadata?.visual || `${topic}-detail.svg`,
                    animation: 'fadeIn'
                },
                content: {
                    speaker: 'Falcon Miller',
                    text: content.content,
                    timing: 'after_visual'
                },
                interactiveStops: [{
                    id: 'return_choice',
                    type: 'choice',
                    prompt: 'What would you like to do next?',
                    choices: [
                        {
                            text: 'Return to main presentation',
                            action: { type: 'return_to_main' }
                        },
                        {
                            text: 'Explore more about this topic',
                            action: { type: 'ai_response', context: { topic: content.category } }
                        }
                    ]
                }]
            });
        });
        
        return slides;
    }

    // Generate breadcrumb navigation
    generateBreadcrumb(userId) {
        const userJourney = this.userJourneys.get(userId);
        const presentation = this.activePresentations.get(userId);
        
        if (!userJourney || !presentation) return [];
        
        const breadcrumb = [
            {
                title: 'Main Presentation',
                slideIndex: 0,
                path: 'main'
            }
        ];
        
        // Add branch levels
        userJourney.branchHistory.forEach(branch => {
            breadcrumb.push({
                title: branch.slides[0]?.title || 'Branch',
                slideIndex: branch.originSlide,
                path: branch.id
            });
        });
        
        return breadcrumb;
    }

    // Generate suggested actions based on context
    generateSuggestedActions(context) {
        const actions = [];
        
        // Always offer to continue
        actions.push({
            type: 'continue',
            text: 'Continue presentation',
            action: { type: 'navigate', target: 'next' }
        });
        
        // Offer topic-specific actions
        if (context.currentSlide.metadata?.category) {
            actions.push({
                type: 'deep_dive',
                text: `Deep dive into ${context.currentSlide.metadata.category}`,
                action: { 
                    type: 'deep_dive', 
                    topic: context.currentSlide.metadata.category 
                }
            });
        }
        
        // Offer related questions
        if (context.userJourney.length > 0) {
            actions.push({
                type: 'related_question',
                text: 'Ask a related question',
                action: { type: 'open_qa' }
            });
        }
        
        return actions;
    }

    // Mock response generator (to be replaced with actual AI service)
    generateMockResponse(prompt, context) {
        const responses = {
            technology: "Our technology stack is built on cutting-edge AI and machine learning algorithms. We've developed proprietary systems that can process and analyze vast amounts of data in real-time.",
            market: "The market opportunity is massive - we're looking at a $1.5 trillion combined market across all our platforms. Our timing is perfect as digital transformation accelerates.",
            business: "Our business model is designed for scalability and sustainability. We have multiple revenue streams and a clear path to profitability.",
            team: "Our team combines decades of experience from leading tech companies with fresh perspectives from industry innovators."
        };
        
        // Simple keyword matching for demo
        for (const [key, response] of Object.entries(responses)) {
            if (prompt.toLowerCase().includes(key)) {
                return response;
            }
        }
        
        return "That's an excellent question. Let me provide you with some detailed insights based on our current data and projections.";
    }

    // Get user's complete journey
    getUserJourney(userId) {
        const userJourney = this.userJourneys.get(userId);
        const presentation = this.activePresentations.get(userId);
        
        if (!userJourney || !presentation) return null;
        
        return {
            ...userJourney,
            currentSlide: presentation.slides[presentation.currentSlideIndex],
            totalSlides: presentation.totalSlides,
            completionPercentage: ((presentation.currentSlideIndex + 1) / presentation.totalSlides) * 100,
            timeSpent: new Date() - userJourney.startTime,
            breadcrumb: this.generateBreadcrumb(userId)
        };
    }

    // Clean up presentation session
    endPresentation(userId) {
        const userJourney = this.userJourneys.get(userId);
        if (userJourney) {
            userJourney.endTime = new Date();
            userJourney.completed = true;
        }
        
        this.activePresentations.delete(userId);
        return userJourney;
    }
}

module.exports = PresentationEngine;