const { createSlideStructure, createInteractiveStop } = require('../models/PresentationFlow');

// Sample presentation configuration for Gabriel Greenstein's portfolio
const samplePresentation = {
  title: "Gabriel Greenstein - Revolutionary Platform Portfolio",
  description: "Interactive investor presentation with Falcon Miller",
  mode: "manual",
  autoAdvanceTime: 8000,
  slides: [
    
    // Slide 1: Welcome & Introduction (Scripted)
    createSlideStructure({
      id: 'intro',
      title: 'Welcome to Our Revolutionary Ecosystem',
      type: 'scripted',
      visual: {
        type: 'image',
        src: 'intro-visual.svg',
        animation: 'zoom-in',
        duration: 1500
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'Hello, I am Falcon Miller, CEO of WiseSage LLC. Welcome to Gabriel Greenstein\'s revolutionary platform portfolio presentation. We\'re about to explore 7 interconnected platforms targeting over $1.5 TRILLION in combined market opportunities.',
        timing: 'after_visual',
        animation: 'fade-in'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'intro-choice',
          type: 'choice',
          timing: 'after_content',
          prompt: 'What aspect of our ecosystem interests you most?',
          choices: [
            {
              text: 'Show me the big picture',
              description: 'Overview of all 7 platforms',
              action: {
                type: 'navigate',
                target: 'next'
              }
            },
            {
              text: 'Jump to market opportunity',
              description: 'See the $1.5T market potential',
              action: {
                type: 'navigate',
                target: 9 // market-opportunity slide
              }
            },
            {
              text: 'Tell me about your AI',
              description: 'Deep dive into our AI capabilities',
              action: {
                type: 'ai_response',
                context: 'ai_technology',
                prompt: 'Explain our AI capabilities and how they power the ecosystem'
              }
            }
          ],
          style: {
            layout: 'cards',
            position: 'bottom'
          }
        })
      ]
    }),

    // Slide 2: Portfolio Overview (Interactive)
    createSlideStructure({
      id: 'overview',
      title: 'Our Revolutionary Ecosystem',
      type: 'interactive',
      visual: {
        type: 'image',
        src: 'platforms-diagram.svg',
        animation: 'slide-in-left',
        duration: 2000
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'Our portfolio spans Entertainment, AI Training, Interactive Education, and Developer Tools. Each platform is designed to disrupt its respective market and create unprecedented value.',
        timing: 'after_visual'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'platform-explorer',
          type: 'choice',
          timing: 'after_content',
          prompt: 'Which platform category would you like to explore first?',
          choices: [
            {
              text: 'Entertainment Revolution',
              description: 'Blank Wars, Block Loader, AdventureBlocks - $850B+ market',
              action: {
                type: 'navigate',
                target: 3 // blank-wars slide
              }
            },
            {
              text: 'AI Training Ecosystem',
              description: 'Agent Academy, CBBT, TurnkeyTeacher - $200B+ market',
              action: {
                type: 'navigate',
                target: 7 // ai-training slide
              }
            },
            {
              text: 'Interactive Education',
              description: 'ClassixWorx transforming literature - $350B+ market',
              action: {
                type: 'navigate',
                target: 6 // classixworx slide
              }
            },
            {
              text: 'Developer Tools',
              description: 'PrivateAEye, Project Chief, Prompt Parser - $100B+ market',
              action: {
                type: 'navigate',
                target: 8 // developer-tools slide
              }
            }
          ]
        })
      ]
    }),

    // Slide 3: TalkDeck Demo (Scripted with branching)
    createSlideStructure({
      id: 'talkdeck',
      title: 'TalkDeck: This Very Presentation',
      type: 'scripted',
      visual: {
        type: 'image',
        src: 'talkdeck-visual.svg',
        animation: 'fade-in',
        duration: 1000
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'TalkDeck revolutionizes pitch presentations by making them interactive and intelligent. Instead of static slides, investors get an AI-powered assistant that can answer any question about your business. You\'re experiencing TalkDeck right now!',
        timing: 'after_visual'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'talkdeck-demo',
          type: 'choice',
          timing: 'after_content',
          prompt: 'Want to see TalkDeck\'s capabilities?',
          choices: [
            {
              text: 'Ask me anything about our business',
              description: 'Test the AI\'s knowledge',
              action: {
                type: 'show_content',
                content: {
                  type: 'input_prompt',
                  message: 'Go ahead - ask me any question about our platforms, technology, market, team, or strategy. I have deep knowledge of our entire ecosystem.',
                  inputType: 'both' // text and voice
                }
              }
            },
            {
              text: 'Show me the technical architecture',
              description: 'Deep dive into how TalkDeck works',
              action: {
                type: 'branch',
                branchSlides: [
                  createSlideStructure({
                    id: 'talkdeck-tech',
                    title: 'TalkDeck Technical Architecture',
                    type: 'scripted',
                    visual: {
                      type: 'image',
                      src: 'talkdeck-architecture.svg'
                    },
                    content: {
                      text: 'TalkDeck combines Node.js backend with OpenAI integration, real-time voice processing, and dynamic content delivery. The JIT content system ensures relevant information is always available.',
                      timing: 'after_visual'
                    }
                  })
                ]
              }
            },
            {
              text: 'Continue with other platforms',
              description: 'Move on to Blank Wars',
              action: {
                type: 'navigate',
                target: 'next'
              }
            }
          ]
        })
      ]
    }),

    // Slide 4: Blank Wars (Interactive with deep dive options)
    createSlideStructure({
      id: 'blank-wars',
      title: 'Blank Wars: AI Reality TV Gaming',
      type: 'interactive',
      visual: {
        type: 'video',
        src: 'blank-wars-demo.mp4',
        autoplay: true,
        animation: 'none'
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'Blank Wars brings AI-driven reality TV gaming to life, complete with compelling narratives and "kitchen table drama" that engages players like never before. This is where entertainment meets AI storytelling.',
        timing: 'after_visual'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'blank-wars-deep-dive',
          type: 'choice',
          timing: 'after_content',
          prompt: 'What aspect of Blank Wars interests you most?',
          choices: [
            {
              text: 'Show me the gameplay',
              description: 'See actual gameplay footage',
              action: {
                type: 'show_content',
                content: {
                  type: 'video',
                  src: 'blank-wars-gameplay.mp4',
                  description: 'Watch how AI creates dynamic storylines that adapt to player choices'
                }
              }
            },
            {
              text: 'Business model & monetization',
              description: 'Revenue streams and market opportunity',
              action: {
                type: 'ai_response',
                context: 'blank_wars_business',
                prompt: 'Explain Blank Wars business model, revenue streams, and market opportunity in detail'
              }
            },
            {
              text: 'Technical implementation',
              description: 'How the AI storytelling works',
              action: {
                type: 'branch',
                branchSlides: [
                  createSlideStructure({
                    id: 'blank-wars-tech',
                    title: 'Blank Wars: AI Storytelling Engine',
                    visual: {
                      type: 'image',
                      src: 'blank-wars-tech-diagram.svg'
                    },
                    content: {
                      text: 'Our proprietary AI engine generates dynamic storylines, character development, and plot twists in real-time based on player actions and preferences.',
                      timing: 'after_visual'
                    }
                  })
                ]
              }
            },
            {
              text: 'Continue to Block Loader',
              description: 'Next platform in entertainment suite',
              action: {
                type: 'navigate',
                target: 'next'
              }
            }
          ]
        })
      ]
    }),

    // Slide 5: Block Loader (Scripted)
    createSlideStructure({
      id: 'block-loader',
      title: 'Block Loader: Entertainment Operating System',
      type: 'scripted',
      visual: {
        type: 'image',
        src: 'block-loader-visual.svg',
        animation: 'slide-in-right'
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'Block Loader is the foundational interactive entertainment operating system, akin to a Unity Engine for interactive web content, enabling rich, dynamic experiences across all our platforms.',
        timing: 'after_visual'
      },
      navigation: {
        autoAdvance: false,
        showNextButton: true
      }
    }),

    // Add more slides following the same pattern...
    // Slide 6: AdventureBlocks
    createSlideStructure({
      id: 'adventureblocks',
      title: 'AdventureBlocks: Creator Economy Storytelling',
      type: 'interactive',
      visual: {
        type: 'image',
        src: 'adventureblocks-visual.svg',
        animation: 'zoom-in'
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'AdventureBlocks empowers creators with tools for interactive storytelling, fostering a vibrant creator economy where narratives come alive through user engagement.',
        timing: 'after_visual'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'adventureblocks-creator',
          type: 'choice',
          prompt: 'How does AdventureBlocks empower creators?',
          choices: [
            {
              text: 'Show creator tools',
              action: { type: 'ai_response', context: 'creator_tools' }
            },
            {
              text: 'Revenue sharing model',
              action: { type: 'ai_response', context: 'revenue_sharing' }
            },
            {
              text: 'Continue presentation',
              action: { type: 'navigate', target: 'next' }
            }
          ]
        })
      ]
    }),

    // Final slide: Q&A Mode
    createSlideStructure({
      id: 'qna',
      title: 'Open Q&A with Falcon Miller',
      type: 'interactive',
      visual: {
        type: 'image',
        src: 'qna-visual.svg',
        animation: 'fade-in'
      },
      content: {
        speaker: 'Falcon Miller',
        text: 'I\'m now ready to answer any questions you may have about our portfolio, technology, business strategy, or investment opportunity. Feel free to ask me anything - I have comprehensive knowledge of our entire ecosystem.',
        timing: 'after_visual'
      },
      interactiveStops: [
        createInteractiveStop({
          id: 'open-qa',
          type: 'input',
          timing: 'after_content',
          prompt: 'What would you like to know?',
          inputType: 'both', // text and voice
          style: {
            layout: 'full',
            position: 'center'
          }
        })
      ]
    })
  ]
};

module.exports = samplePresentation;