const { v4: uuidv4 } = require('uuid');

class PresentationFlow {
  constructor() {
    this.presentations = new Map();
  }

  // Define the new presentation structure
  createPresentation(config) {
    const presentation = {
      id: uuidv4(),
      title: config.title,
      description: config.description,
      mode: config.mode || 'manual', // 'manual' or 'slideshow'
      autoAdvanceTime: config.autoAdvanceTime || 5000, // ms for slideshow mode
      slides: config.slides || [],
      currentSlideIndex: 0,
      userPath: [], // Track user's choices/path through presentation
      createdAt: new Date().toISOString()
    };

    this.presentations.set(presentation.id, presentation);
    return presentation;
  }

  // Get presentation by ID
  getPresentation(id) {
    return this.presentations.get(id);
  }

  // Update presentation mode
  updateMode(presentationId, mode, autoAdvanceTime) {
    const presentation = this.presentations.get(presentationId);
    if (presentation) {
      presentation.mode = mode;
      if (autoAdvanceTime) {
        presentation.autoAdvanceTime = autoAdvanceTime;
      }
      return true;
    }
    return false;
  }

  // Navigate to specific slide
  goToSlide(presentationId, slideIndex) {
    const presentation = this.presentations.get(presentationId);
    if (presentation && slideIndex >= 0 && slideIndex < presentation.slides.length) {
      presentation.currentSlideIndex = slideIndex;
      return presentation.slides[slideIndex];
    }
    return null;
  }

  // Get current slide
  getCurrentSlide(presentationId) {
    const presentation = this.presentations.get(presentationId);
    if (presentation) {
      return presentation.slides[presentation.currentSlideIndex];
    }
    return null;
  }

  // Handle user interaction choice
  handleUserChoice(presentationId, choiceId) {
    const presentation = this.presentations.get(presentationId);
    if (!presentation) return null;

    const currentSlide = presentation.slides[presentation.currentSlideIndex];
    if (!currentSlide || !currentSlide.interactiveStops) return null;

    // Find the choice and its consequence
    for (const stop of currentSlide.interactiveStops) {
      const choice = stop.choices?.find(c => c.id === choiceId);
      if (choice) {
        // Record the user's choice
        presentation.userPath.push({
          slideIndex: presentation.currentSlideIndex,
          stopId: stop.id,
          choiceId: choiceId,
          choiceText: choice.text,
          timestamp: new Date().toISOString()
        });

        // Execute the choice action
        return this.executeChoiceAction(presentation, choice);
      }
    }

    return null;
  }

  // Execute choice action (navigation, content injection, etc.)
  executeChoiceAction(presentation, choice) {
    const action = choice.action;
    
    switch (action.type) {
      case 'navigate':
        // Navigate to specific slide
        if (action.target === 'next') {
          presentation.currentSlideIndex = Math.min(
            presentation.currentSlideIndex + 1,
            presentation.slides.length - 1
          );
        } else if (action.target === 'prev') {
          presentation.currentSlideIndex = Math.max(
            presentation.currentSlideIndex - 1,
            0
          );
        } else if (typeof action.target === 'number') {
          presentation.currentSlideIndex = Math.max(0, Math.min(
            action.target,
            presentation.slides.length - 1
          ));
        }
        return {
          type: 'navigation',
          newSlide: presentation.slides[presentation.currentSlideIndex]
        };

      case 'show_content':
        // Inject additional content into current slide
        return {
          type: 'content_injection',
          content: action.content
        };

      case 'branch':
        // Create a branching path with new slides
        return {
          type: 'branch',
          branchSlides: action.branchSlides
        };

      case 'ai_response':
        // Trigger AI response with specific context
        return {
          type: 'ai_response',
          context: action.context,
          prompt: action.prompt
        };

      default:
        return null;
    }
  }

  // Get user's journey through presentation
  getUserJourney(presentationId) {
    const presentation = this.presentations.get(presentationId);
    return presentation ? presentation.userPath : [];
  }
}

// Define the enhanced slide structure
const createSlideStructure = (config) => {
  return {
    id: config.id || uuidv4(),
    title: config.title,
    type: config.type || 'scripted', // 'scripted', 'interactive', 'branching'
    
    // Visual content
    visual: {
      type: config.visual?.type || 'image', // 'image', 'video', 'animation', 'table', 'embedded'
      src: config.visual?.src,
      animation: config.visual?.animation || 'fade-in',
      duration: config.visual?.duration || 1000,
      autoplay: config.visual?.autoplay || false
    },

    // Text content
    content: {
      speaker: config.content?.speaker || 'Falcon Miller',
      text: config.content?.text,
      timing: config.content?.timing || 'after_visual', // 'with_visual', 'after_visual', 'manual'
      animation: config.content?.animation || 'slide-up'
    },

    // Interactive elements
    interactiveStops: config.interactiveStops || [],

    // Navigation behavior
    navigation: {
      autoAdvance: config.navigation?.autoAdvance || false,
      autoAdvanceDelay: config.navigation?.autoAdvanceDelay || 5000,
      showNextButton: config.navigation?.showNextButton !== false,
      showPrevButton: config.navigation?.showPrevButton !== false
    },

    // Metadata
    metadata: {
      category: config.metadata?.category,
      tags: config.metadata?.tags || [],
      difficulty: config.metadata?.difficulty || 'basic',
      estimatedTime: config.metadata?.estimatedTime || 30 // seconds
    }
  };
};

// Define interactive stop structure
const createInteractiveStop = (config) => {
  return {
    id: config.id || uuidv4(),
    type: config.type || 'choice', // 'choice', 'question', 'poll', 'input'
    timing: config.timing || 'after_content', // 'with_visual', 'after_visual', 'after_content'
    
    prompt: config.prompt || 'What would you like to explore?',
    
    choices: config.choices?.map(choice => ({
      id: choice.id || uuidv4(),
      text: choice.text,
      description: choice.description,
      action: choice.action
    })) || [],

    // For open-ended questions
    inputType: config.inputType || 'text', // 'text', 'voice', 'both'
    
    // UI styling
    style: {
      layout: config.style?.layout || 'buttons', // 'buttons', 'cards', 'list'
      position: config.style?.position || 'bottom' // 'bottom', 'side', 'overlay'
    }
  };
};

module.exports = {
  PresentationFlow,
  createSlideStructure,
  createInteractiveStop
};