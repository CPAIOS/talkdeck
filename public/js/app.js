
class TalkDeck {
    constructor() {
        console.log('TalkDeck constructor called.');
        this.deckId = null;
        this.sessionId = null;
        this.accessToken = null;
        this.signaturePad = null;
        this.currentSlideIndex = 0;
        this.totalSlides = 0;
        this.slideshowMode = false;
        this.slideshowInterval = null;
        this.autoAdvanceTime = 8000; // 8 seconds default
        this.voiceMode = false;
        this.isAnimating = false;
        this.speechRecognition = null;
        this.isListening = false;
        this.voiceLanguage = 'en-US';
        this.speechSynthesis = window.speechSynthesis;
        this.currentVoice = null;
        this.voiceSettings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            autoSubmit: false,
            autoSpeak: true,
            autoNarrate: false,
            autoAdvance: false
        };
        this.currentChunkIndex = 0;
        this.speechChunks = [];
        this.isPaused = false;
        this.presentationScript = [
            { topic: 'intro', speaker: 'Falcon Miller', visual: 'intro-visual.svg', title: 'Welcome to TalkDeck', content: 'Hello, I am Falcon Miller, CEO of WiseSage LLC. Welcome to Gabriel Greenstein's revolutionary platform portfolio presentation. We're about to explore 7 interconnected platforms targeting over $1.5 TRILLION in combined market opportunities.' },
            { topic: 'overview', speaker: 'Falcon Miller', visual: 'platforms-diagram.svg', title: 'Our Revolutionary Ecosystem', content: 'Our portfolio spans Entertainment, AI Training, Interactive Education, and Developer Tools. Each platform is designed to disrupt its respective market and create unprecedented value.' },
            { topic: 'talkdeck', speaker: 'Falcon Miller', visual: 'talkdeck-visual.svg', title: 'TalkDeck: Interactive Presentations', content: 'TalkDeck revolutionizes pitch presentations by making them interactive and intelligent. Instead of static slides, investors get an AI-powered assistant that can answer any question about your business.' },
            { topic: 'blank-wars', speaker: 'Falcon Miller', visual: 'blank-wars-visual.svg', title: 'Blank Wars: AI Reality TV Gaming', content: 'Blank Wars brings AI-driven reality TV gaming to life, complete with compelling narratives and "kitchen table drama" that engages players like never before.' },
            { topic: 'block-loader', speaker: 'Falcon Miller', visual: 'block-loader-visual.svg', title: 'Block Loader: Entertainment OS', content: 'Block Loader is the foundational interactive entertainment operating system, akin to a Unity Engine for interactive web content, enabling rich, dynamic experiences.' },
            { topic: 'adventureblocks', speaker: 'Falcon Miller', visual: 'adventureblocks-visual.svg', title: 'AdventureBlocks: Creator Economy Storytelling', content: 'AdventureBlocks empowers creators with tools for interactive storytelling, fostering a vibrant creator economy where narratives come alive through user engagement.' },
            { topic: 'classixworx', speaker: 'Falcon Miller', visual: 'classixworx-visual.svg', title: 'ClassixWorx: Interactive Education', content: 'ClassixWorx transforms public domain literature into interactive educational experiences, making classic texts accessible and engaging for modern learners.' },
            { topic: 'ai-training', speaker: 'Falcon Miller', visual: 'ai-training-visual.svg', title: 'AI Training Ecosystem', content: 'Our AI Training Ecosystem, comprising Agent Academy, CBBT, and TurnkeyTeacher, provides comprehensive solutions for advanced AI development and education.' },
            { topic: 'developer-tools', speaker: 'Falcon Miller', visual: 'developer-tools-visual.svg', title: 'Developer/Investigation Tools', content: 'Our suite of developer tools, including PrivateAEye (AI fact-checker), Project Chief, and Prompt Parser, equips professionals with cutting-edge solutions for analysis and development.' },
            { topic: 'market-opportunity', speaker: 'Falcon Miller', visual: 'market-chart.svg', title: 'Market Opportunity', content: 'The combined market opportunity across all our platforms exceeds $1.5 TRILLION, indicating immense potential for growth and impact.' },
            { topic: 'competitive-advantage', speaker: 'Falcon Miller', visual: 'competitive-matrix.svg', title: 'Competitive Advantage', content: 'Our proprietary AI, Falcon Miller, and our integrated ecosystem of platforms provide an unparalleled competitive advantage in the market.' },
            { topic: 'financials', speaker: 'Falcon Miller', visual: 'financials-chart.svg', title: 'Financial Projections', content: 'We project aggressive growth and significant returns, driven by our innovative technology and strategic market positioning.' },
            { topic: 'next-steps', speaker: 'Falcon Miller', visual: 'roadmap.svg', title: 'Next Steps', content: 'We are currently seeking strategic partnerships and further investment to accelerate our growth and expand our global reach.' },
            { topic: 'qna', speaker: 'Falcon Miller', visual: 'qna-visual.svg', title: 'Q&A with Falcon Miller', content: 'I am now ready to answer any questions you may have about our portfolio, technology, or business strategy. Please feel free to ask.' }
        ];
        this.totalSlides = this.presentationScript.length;
        this.currentSlideIndex = 0;

        this.init();
    }

    init() {
        console.log('TalkDeck init() called.');
        this.setupEventListeners();
        this.checkUrlParams();
        this.updateSlideIndicator();
        this.updateNavigationButtons();
        this.updateTableOfContents();
        
        // Initialize voice features
        this.initializeSpeechRecognition();
        this.initializeTextToSpeech();
    }

    setupEventListeners() {
        console.log('Setting up event listeners.');
        
        // Landing page
        document.getElementById('get-started-btn').addEventListener('click', () => this.showDemo());
        
        // NDA page
        document.getElementById('clear-signature')?.addEventListener('click', () => this.signaturePad.clear());
        document.getElementById('sign-nda-btn')?.addEventListener('click', () => this.signNda());
        
        // Presentation controls
        document.getElementById('slideshow-mode')?.addEventListener('click', () => this.toggleSlideshowMode());
        document.getElementById('voice-mode')?.addEventListener('click', () => this.toggleVoiceMode());
        document.getElementById('export-session')?.addEventListener('click', () => this.exportSession());
        
        // Message input
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Input mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchInputMode(btn.dataset.mode));
        });
        
        // Voice input
        document.getElementById('voice-record')?.addEventListener('click', () => this.startVoiceRecording());
        
        // Voice settings
        document.getElementById('voice-settings')?.addEventListener('click', () => this.showVoiceSettings());
        
        // Voice help
        document.getElementById('voice-help')?.addEventListener('click', () => this.showVoiceHelp());
        
        // Voice mode indicator events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('voice-mode-indicator') && e.target.classList.contains('minimized')) {
                e.target.classList.remove('minimized');
            }
        });
        
        // Navigation
        document.getElementById('next-slide')?.addEventListener('click', () => this.nextSlide());
        document.getElementById('prev-slide')?.addEventListener('click', () => this.prevSlide());
        
        // Choice buttons (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('choice-btn')) {
                this.handleChoiceClick(e.target);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'Escape':
                    this.stopSlideshow();
                    break;
            }
        });
    }

    checkUrlParams() {
        console.log('Checking URL parameters.');
        const urlParams = new URLSearchParams(window.location.search);
        this.deckId = urlParams.get('deck');
        if (this.deckId || window.location.pathname === '/deck/demo') {
            console.log('Deck ID found or path is /deck/demo. Loading deck.');
            this.loadDeck();
        } else {
            console.log('No deck ID and not /deck/demo. Showing landing page.');
        }
    }

    async loadDeck() {
        console.log('Loading deck.');
        this.showPage('presentation-page');
        this.startPresentation();
    }

    startPresentation() {
        console.log('Starting presentation.');
        this.populateTableOfContents();
        this.goToSlide(0);
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        if (!message) return;

        messageInput.value = '';
        this.showInteractiveResponse(message);
        
        // TODO: Implement actual AI response
        // For now, just simulate a response
        setTimeout(() => {
            this.hideInteractiveOverlay();
        }, 3000);
    }

    // Slideshow mode methods
    toggleSlideshowMode() {
        if (this.slideshowMode) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }
    
    startSlideshow() {
        this.slideshowMode = true;
        document.getElementById('slideshow-mode').classList.add('active');
        this.autoAdvanceSlides();
    }
    
    stopSlideshow() {
        this.slideshowMode = false;
        document.getElementById('slideshow-mode').classList.remove('active');
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }
    
    autoAdvanceSlides() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
        }
        
        this.slideshowInterval = setInterval(() => {
            if (this.currentSlideIndex < this.totalSlides - 1) {
                this.nextSlide();
            } else {
                this.stopSlideshow(); // Stop at end
            }
        }, this.autoAdvanceTime);
    }
    
    // Voice mode methods
    toggleVoiceMode() {
        this.voiceMode = !this.voiceMode;
        const voiceBtn = document.getElementById('voice-mode');
        voiceBtn.classList.toggle('active', this.voiceMode);
        
        if (this.voiceMode) {
            this.switchInputMode('voice');
        } else {
            this.switchInputMode('text');
        }
    }
    
    switchInputMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        const textContainer = document.getElementById('text-input-container');
        const voiceContainer = document.getElementById('voice-input-container');
        
        if (mode === 'voice') {
            textContainer.style.display = 'none';
            voiceContainer.style.display = 'block';
            
            // Initialize voice if not already done
            if (!this.speechRecognition) {
                this.initializeSpeechRecognition();
            }
        } else {
            textContainer.style.display = 'block';
            voiceContainer.style.display = 'none';
        }
    }
    
    // Initialize speech recognition
    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        
        // Configure speech recognition
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = this.voiceLanguage;
        
        // Event handlers
        this.speechRecognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('Listening...', 'listening');
        };
        
        this.speechRecognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };
        
        this.speechRecognition.onerror = (event) => {
            this.handleSpeechError(event);
        };
        
        this.speechRecognition.onend = () => {
            this.isListening = false;
            this.updateVoiceStatus('', 'idle');
        };
        
        return true;
    }
    
    // Handle speech recognition results
    handleSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update UI with transcripts
        this.updateTranscriptDisplay(finalTranscript, interimTranscript);
        
        // If we have final transcript, process it
        if (finalTranscript.length > 0) {
            this.processSpeechInput(finalTranscript);
        }
    }
    
    // Handle speech recognition errors
    handleSpeechError(event) {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
            case 'network':
                errorMessage = 'Network error occurred';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied';
                break;
            case 'no-speech':
                errorMessage = 'No speech detected';
                break;
            case 'audio-capture':
                errorMessage = 'Audio capture failed';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech service not allowed';
                break;
        }
        
        this.updateVoiceStatus(errorMessage, 'error');
        this.stopVoiceRecording();
    }
    
    // Update transcript display
    updateTranscriptDisplay(finalTranscript, interimTranscript) {
        const messageInput = document.getElementById('message-input');
        const voiceStatus = document.getElementById('voice-status');
        
        if (finalTranscript) {
            // Add final transcript to input
            const currentValue = messageInput.value;
            messageInput.value = currentValue + ' ' + finalTranscript;
            messageInput.value = messageInput.value.trim();
        }
        
        if (interimTranscript) {
            // Show interim transcript in status
            voiceStatus.textContent = `Hearing: "${interimTranscript}"`;
        }
    }
    
    // Process speech input
    processSpeechInput(transcript) {
        const cleanTranscript = transcript.trim();
        
        // Check for voice commands
        if (this.isVoiceCommand(cleanTranscript)) {
            this.executeVoiceCommand(cleanTranscript);
        } else {
            // Regular input - add to message box
            const messageInput = document.getElementById('message-input');
            messageInput.value = cleanTranscript;
            
            // Auto-submit if enabled
            if (this.voiceSettings.autoSubmit) {
                setTimeout(() => {
                    this.sendMessage();
                }, 1000);
            }
        }
    }
    
    // Check if input is a voice command
    isVoiceCommand(transcript) {
        const commands = [
            'next slide', 'previous slide', 'go back', 'continue',
            'repeat', 'louder', 'quieter', 'faster', 'slower',
            'stop', 'pause', 'start slideshow', 'end slideshow'
        ];
        
        return commands.some(command => 
            transcript.toLowerCase().includes(command.toLowerCase())
        );
    }
    
    // Execute voice command
    executeVoiceCommand(transcript) {
        const command = transcript.toLowerCase();
        
        if (command.includes('next slide') || command.includes('continue')) {
            this.nextSlide();
            this.speakResponse('Moving to next slide');
        } else if (command.includes('previous slide') || command.includes('go back')) {
            this.prevSlide();
            this.speakResponse('Going back to previous slide');
        } else if (command.includes('repeat')) {
            this.repeatCurrentSlide();
        } else if (command.includes('start slideshow')) {
            this.startSlideshow();
            this.speakResponse('Starting slideshow mode');
        } else if (command.includes('end slideshow') || command.includes('stop')) {
            this.stopSlideshow();
            this.speakResponse('Stopping slideshow');
        } else if (command.includes('louder')) {
            this.adjustVolume(0.1);
        } else if (command.includes('quieter')) {
            this.adjustVolume(-0.1);
        } else if (command.includes('faster')) {
            this.adjustSpeechRate(0.1);
        } else if (command.includes('slower')) {
            this.adjustSpeechRate(-0.1);
        }
    }
    
    // Start voice recording
    startVoiceRecording() {
        if (!this.speechRecognition) {
            if (!this.initializeSpeechRecognition()) {
                this.showError('Speech recognition is not supported in this browser');
                return;
            }
        }
        
        if (this.isListening) {
            this.stopVoiceRecording();
            return;
        }
        
        // Request microphone permission
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                this.speechRecognition.start();
                this.updateVoiceButton(true);
            })
            .catch(error => {
                console.error('Microphone access denied:', error);
                this.showError('Microphone access is required for voice input');
            });
    }
    
    // Stop voice recording
    stopVoiceRecording() {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
        }
        
        this.updateVoiceButton(false);
        this.updateVoiceStatus('', 'idle');
    }
    
    // Update voice button state
    updateVoiceButton(isRecording) {
        const voiceBtn = document.getElementById('voice-record');
        const voiceIcon = voiceBtn.querySelector('.voice-icon');
        const voiceText = voiceBtn.querySelector('.voice-text');
        
        if (isRecording) {
            voiceBtn.classList.add('recording');
            voiceIcon.textContent = '⏹️';
            voiceText.textContent = 'Stop recording';
        } else {
            voiceBtn.classList.remove('recording');
            voiceIcon.textContent = '🎤';
            voiceText.textContent = 'Hold to speak';
        }
    }
    
    // Update voice status
    updateVoiceStatus(message, type = 'idle') {
        const voiceStatus = document.getElementById('voice-status');
        
        voiceStatus.textContent = message;
        voiceStatus.className = `voice-status ${type}`;
        
        // Clear status after delay for non-error messages
        if (type !== 'error' && type !== 'listening') {
            setTimeout(() => {
                voiceStatus.textContent = '';
                voiceStatus.className = 'voice-status';
            }, 3000);
        }
    }
    
    // Initialize text-to-speech
    initializeTextToSpeech() {
        if (!this.speechSynthesis) {
            console.warn('Text-to-speech not supported in this browser');
            return false;
        }
        
        // Load available voices
        this.loadVoices();
        
        // Listen for voice changes
        this.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
        
        return true;
    }
    
    // Load available voices
    loadVoices() {
        const voices = this.speechSynthesis.getVoices();
        
        // Find a suitable voice (prefer female, English)
        this.currentVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
            voice.lang.startsWith('en')
        ) || voices[0];
        
        console.log('Available voices:', voices.length);
        console.log('Selected voice:', this.currentVoice?.name);
    }
    
    // Speak response
    speakResponse(text) {
        if (!this.speechSynthesis || !this.currentVoice) {
            console.warn('Text-to-speech not available');
            return;
        }
        
        // Cancel any existing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        
        // Event handlers
        utterance.onstart = () => {
            this.updateVoiceStatus('Speaking...', 'speaking');
        };
        
        utterance.onend = () => {
            this.updateVoiceStatus('', 'idle');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.updateVoiceStatus('Speech error', 'error');
        };
        
        this.speechSynthesis.speak(utterance);
    }
    
    // Enhanced AI response speech with progress tracking
    speakAIResponse(text) {
        if (!this.speechSynthesis || !this.currentVoice) {
            this.showVoiceFeedback('Text-to-speech not available', 'error');
            return;
        }
        
        // Cancel any existing speech
        this.speechSynthesis.cancel();
        
        // Clean text for better speech
        const cleanText = this.cleanTextForSpeech(text);
        
        // Split into chunks for better control
        const chunks = this.splitTextIntoChunks(cleanText);
        this.currentChunkIndex = 0;
        this.speechChunks = chunks;
        this.isPaused = false;
        
        // Show speech controls
        this.showAISpeechControls();
        
        // Start speaking
        this.speakNextChunk();
    }
    
    // Clean text for better speech synthesis
    cleanTextForSpeech(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
            .replace(/#{1,6}\s?/g, '') // Remove headers
            .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
            .replace(/\n/g, ' ') // Replace single newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
    
    // Split text into manageable chunks
    splitTextIntoChunks(text, maxLength = 200) {
        const chunks = [];
        const sentences = text.split(/[.!?]+/);
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            if (currentChunk.length + trimmedSentence.length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
            }
            
            currentChunk += trimmedSentence + '. ';
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }
    
    // Speak next chunk
    speakNextChunk() {
        if (this.isPaused || this.currentChunkIndex >= this.speechChunks.length) {
            if (this.currentChunkIndex >= this.speechChunks.length) {
                this.onAISpeechComplete();
            }
            return;
        }
        
        const chunk = this.speechChunks[this.currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        utterance.voice = this.currentVoice;
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        
        // Event handlers
        utterance.onstart = () => {
            this.updateAISpeechProgress();
        };
        
        utterance.onend = () => {
            this.currentChunkIndex++;
            setTimeout(() => this.speakNextChunk(), 100);
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.showVoiceFeedback('Speech error occurred', 'error');
            this.hideAISpeechControls();
        };
        
        this.speechSynthesis.speak(utterance);
    }
    
    // Pause AI speech
    pauseAISpeech() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.pause();
            this.isPaused = true;
            this.updateAISpeechControls('paused');
        } else if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
            this.isPaused = false;
            this.updateAISpeechControls('speaking');
        }
    }
    
    // Stop AI speech
    stopAISpeech() {
        this.speechSynthesis.cancel();
        this.isPaused = false;
        this.currentChunkIndex = 0;
        this.speechChunks = [];
        this.hideAISpeechControls();
    }
    
    // Show AI speech controls
    showAISpeechControls() {
        const speakBtn = document.getElementById('ai-speak-btn');
        const pauseBtn = document.getElementById('ai-pause-btn');
        const stopBtn = document.getElementById('ai-stop-btn');
        const progressDiv = document.getElementById('ai-speech-progress');
        
        if (speakBtn) speakBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'inline-block';
        if (progressDiv) progressDiv.style.display = 'block';
        
        this.updateAISpeechControls('speaking');
    }
    
    // Hide AI speech controls
    hideAISpeechControls() {
        const speakBtn = document.getElementById('ai-speak-btn');
        const pauseBtn = document.getElementById('ai-pause-btn');
        const stopBtn = document.getElementById('ai-stop-btn');
        const progressDiv = document.getElementById('ai-speech-progress');
        
        if (speakBtn) speakBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
        if (progressDiv) progressDiv.style.display = 'none';
    }
    
    // Update AI speech controls
    updateAISpeechControls(state) {
        const pauseBtn = document.getElementById('ai-pause-btn');
        const statusDiv = document.getElementById('speech-status');
        
        if (pauseBtn) {
            if (state === 'paused') {
                pauseBtn.innerHTML = '▶️';
                pauseBtn.title = 'Resume speech';
            } else {
                pauseBtn.innerHTML = '⏸️';
                pauseBtn.title = 'Pause speech';
            }
        }
        
        if (statusDiv) {
            statusDiv.textContent = state === 'paused' ? 'Paused' : 'Speaking...';
        }
    }
    
    // Update AI speech progress
    updateAISpeechProgress() {
        const progressFill = document.getElementById('speech-progress-fill');
        
        if (progressFill && this.speechChunks.length > 0) {
            const progress = (this.currentChunkIndex / this.speechChunks.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }
    
    // Handle AI speech completion
    onAISpeechComplete() {
        this.hideAISpeechControls();
        this.showVoiceFeedback('Speech completed', 'success');
        
        // Update voice mode status
        if (this.voiceMode) {
            this.updateVoiceModeStatus('Speech completed', 'success');
        }
        
        // If auto-advance is enabled, move to next slide
        if (this.voiceSettings.autoAdvance) {
            this.updateVoiceModeStatus('Auto-advancing...', 'info');
            setTimeout(() => {
                this.nextSlide();
            }, 2000);
        }
    }
    
    // Show voice feedback
    showVoiceFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `voice-feedback ${type}`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }
    
    // Auto-narrate slide content
    autoNarrateSlide(slide) {
        if (!this.voiceMode || !this.voiceSettings.autoNarrate) return;
        
        const narrateText = `${slide.title}. ${slide.content}`;
        
        // Add delay to allow visual animations to complete
        setTimeout(() => {
            this.speakResponse(narrateText);
        }, 1500);
    }
    
    // Enhanced voice settings with TTS options
    createVoiceSettingsPanel() {
        return `
            <div class="voice-settings-panel">
                <h4>Voice Settings</h4>
                
                <div class="voice-setting">
                    <label>Language:</label>
                    <select id="voice-language">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                    </select>
                </div>
                
                <div class="voice-setting">
                    <label>Voice:</label>
                    <select id="voice-selection">
                        ${this.getVoiceOptions()}
                    </select>
                </div>
                
                <div class="voice-setting">
                    <label>Rate: <span id="rate-value">${this.voiceSettings.rate}</span></label>
                    <input type="range" id="speech-rate" min="0.1" max="3" step="0.1" value="${this.voiceSettings.rate}">
                </div>
                
                <div class="voice-setting">
                    <label>Pitch: <span id="pitch-value">${this.voiceSettings.pitch}</span></label>
                    <input type="range" id="speech-pitch" min="0" max="2" step="0.1" value="${this.voiceSettings.pitch}">
                </div>
                
                <div class="voice-setting">
                    <label>Volume: <span id="volume-value">${this.voiceSettings.volume}</span></label>
                    <input type="range" id="speech-volume" min="0" max="1" step="0.1" value="${this.voiceSettings.volume}">
                </div>
                
                <div class="voice-setting">
                    <label>
                        <input type="checkbox" id="auto-submit" ${this.voiceSettings.autoSubmit ? 'checked' : ''}>
                        Auto-submit voice input
                    </label>
                </div>
                
                <div class="voice-setting">
                    <label>
                        <input type="checkbox" id="auto-speak" ${this.voiceSettings.autoSpeak ? 'checked' : ''}>
                        Auto-speak AI responses
                    </label>
                </div>
                
                <div class="voice-setting">
                    <label>
                        <input type="checkbox" id="auto-narrate" ${this.voiceSettings.autoNarrate ? 'checked' : ''}>
                        Auto-narrate slide content
                    </label>
                </div>
                
                <div class="voice-setting">
                    <label>
                        <input type="checkbox" id="auto-advance" ${this.voiceSettings.autoAdvance ? 'checked' : ''}>
                        Auto-advance after speech
                    </label>
                </div>
                
                <button id="test-voice" class="secondary-button">Test Voice</button>
                <button id="voice-help" class="secondary-button">Voice Commands</button>
            </div>
        `;
    }
    
    // Adjust volume
    adjustVolume(delta) {
        this.voiceSettings.volume = Math.max(0, Math.min(1, this.voiceSettings.volume + delta));
        this.speakResponse(`Volume adjusted to ${Math.round(this.voiceSettings.volume * 100)}%`);
    }
    
    // Adjust speech rate
    adjustSpeechRate(delta) {
        this.voiceSettings.rate = Math.max(0.1, Math.min(3, this.voiceSettings.rate + delta));
        this.speakResponse(`Speech rate adjusted to ${Math.round(this.voiceSettings.rate * 100)}%`);
    }
    
    // Repeat current slide
    repeatCurrentSlide() {
        const currentSlide = this.presentationScript[this.currentSlideIndex];
        if (currentSlide) {
            this.speakResponse(currentSlide.content);
        }
    }
    
    // Get voice settings panel
    createVoiceSettingsPanel() {
        return `
            <div class="voice-settings-panel">
                <h4>Voice Settings</h4>
                
                <div class="voice-setting">
                    <label>Language:</label>
                    <select id="voice-language">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                    </select>
                </div>
                
                <div class="voice-setting">
                    <label>Voice:</label>
                    <select id="voice-selection">
                        ${this.getVoiceOptions()}
                    </select>
                </div>
                
                <div class="voice-setting">
                    <label>Rate: <span id="rate-value">${this.voiceSettings.rate}</span></label>
                    <input type="range" id="speech-rate" min="0.1" max="3" step="0.1" value="${this.voiceSettings.rate}">
                </div>
                
                <div class="voice-setting">
                    <label>Pitch: <span id="pitch-value">${this.voiceSettings.pitch}</span></label>
                    <input type="range" id="speech-pitch" min="0" max="2" step="0.1" value="${this.voiceSettings.pitch}">
                </div>
                
                <div class="voice-setting">
                    <label>Volume: <span id="volume-value">${this.voiceSettings.volume}</span></label>
                    <input type="range" id="speech-volume" min="0" max="1" step="0.1" value="${this.voiceSettings.volume}">
                </div>
                
                <div class="voice-setting">
                    <label>
                        <input type="checkbox" id="auto-submit" ${this.voiceSettings.autoSubmit ? 'checked' : ''}>
                        Auto-submit voice input
                    </label>
                </div>
                
                <button id="test-voice" class="secondary-button">Test Voice</button>
            </div>
        `;
    }
    
    // Get voice options for select
    getVoiceOptions() {
        const voices = this.speechSynthesis?.getVoices() || [];
        return voices
            .filter(voice => voice.lang.startsWith('en'))
            .map(voice => `<option value="${voice.name}">${voice.name}</option>`)
            .join('');
    }
    
    // Show voice settings
    showVoiceSettings() {
        const overlay = document.getElementById('interactive-overlay');
        overlay.innerHTML = this.createVoiceSettingsPanel();
        overlay.classList.add('active');
        
        // Setup event listeners
        this.setupVoiceSettingsListeners();
    }
    
    // Setup voice settings listeners
    setupVoiceSettingsListeners() {
        document.getElementById('voice-language')?.addEventListener('change', (e) => {
            this.voiceLanguage = e.target.value;
            if (this.speechRecognition) {
                this.speechRecognition.lang = this.voiceLanguage;
            }
        });
        
        document.getElementById('voice-selection')?.addEventListener('change', (e) => {
            const voices = this.speechSynthesis.getVoices();
            this.currentVoice = voices.find(voice => voice.name === e.target.value);
        });
        
        document.getElementById('speech-rate')?.addEventListener('input', (e) => {
            this.voiceSettings.rate = parseFloat(e.target.value);
            document.getElementById('rate-value').textContent = this.voiceSettings.rate;
        });
        
        document.getElementById('speech-pitch')?.addEventListener('input', (e) => {
            this.voiceSettings.pitch = parseFloat(e.target.value);
            document.getElementById('pitch-value').textContent = this.voiceSettings.pitch;
        });
        
        document.getElementById('speech-volume')?.addEventListener('input', (e) => {
            this.voiceSettings.volume = parseFloat(e.target.value);
            document.getElementById('volume-value').textContent = this.voiceSettings.volume;
        });
        
        document.getElementById('auto-submit')?.addEventListener('change', (e) => {
            this.voiceSettings.autoSubmit = e.target.checked;
        });
        
        document.getElementById('auto-speak')?.addEventListener('change', (e) => {
            this.voiceSettings.autoSpeak = e.target.checked;
        });
        
        document.getElementById('auto-narrate')?.addEventListener('change', (e) => {
            this.voiceSettings.autoNarrate = e.target.checked;
        });
        
        document.getElementById('auto-advance')?.addEventListener('change', (e) => {
            this.voiceSettings.autoAdvance = e.target.checked;
        });
        
        document.getElementById('voice-help')?.addEventListener('click', () => {
            this.showVoiceHelp();
        });
        
        document.getElementById('test-voice')?.addEventListener('click', () => {
            this.speakResponse('This is a test of the voice synthesis system. How does it sound?');
        });
    }
    
    // Show voice help
    showVoiceHelp() {
        const overlay = document.getElementById('interactive-overlay');
        overlay.innerHTML = `
            <div class="voice-help-panel">
                <h4>Voice Commands & Features</h4>
                
                <div class="voice-commands-list">
                    <div class="voice-command-group">
                        <h5>Navigation</h5>
                        <ul>
                            <li><strong>"Next slide"</strong> - Move to next slide</li>
                            <li><strong>"Previous slide"</strong> - Go back one slide</li>
                            <li><strong>"Go back"</strong> - Same as previous</li>
                            <li><strong>"Continue"</strong> - Move forward</li>
                        </ul>
                    </div>
                    
                    <div class="voice-command-group">
                        <h5>Presentation Control</h5>
                        <ul>
                            <li><strong>"Start slideshow"</strong> - Auto-advance mode</li>
                            <li><strong>"End slideshow"</strong> - Stop auto-advance</li>
                            <li><strong>"Repeat"</strong> - Re-read current slide</li>
                            <li><strong>"Stop"</strong> - Stop current speech</li>
                        </ul>
                    </div>
                    
                    <div class="voice-command-group">
                        <h5>Audio Control</h5>
                        <ul>
                            <li><strong>"Louder"</strong> - Increase volume</li>
                            <li><strong>"Quieter"</strong> - Decrease volume</li>
                            <li><strong>"Faster"</strong> - Speed up speech</li>
                            <li><strong>"Slower"</strong> - Slow down speech</li>
                        </ul>
                    </div>
                    
                    <div class="voice-command-group">
                        <h5>Features</h5>
                        <ul>
                            <li><strong>Auto-speak</strong> - AI responses read aloud</li>
                            <li><strong>Auto-narrate</strong> - Slide content narrated</li>
                            <li><strong>Auto-advance</strong> - Move to next slide after speech</li>
                            <li><strong>Voice input</strong> - Ask questions by speaking</li>
                        </ul>
                    </div>
                </div>
                
                <div class="voice-help-tips">
                    <h5>Tips for Better Voice Recognition:</h5>
                    <ul>
                        <li>Speak clearly and at a normal pace</li>
                        <li>Use a quiet environment for best results</li>
                        <li>Hold the microphone button or click once to start</li>
                        <li>Wait for the blue indicator before speaking</li>
                        <li>Voice commands work during any slide</li>
                    </ul>
                </div>
                
                <button id="voice-help-close" class="secondary-button">Close</button>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('voice-help-close').addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }
    
    exportSession() {
        // TODO: Implement session export
        console.log('Export session requested');
    }

    updateVisual(visualName, animationType = 'fade-in', visualType = 'image', visualConfig = {}) {
        const visualContent = document.getElementById('visual-content');
        
        // Clear previous content with exit animation
        if (visualContent.children.length > 0) {
            this.animateVisualExit(visualContent.children[0]).then(() => {
                visualContent.innerHTML = '';
                this.createVisualElement(visualContent, visualName, animationType, visualType, visualConfig);
            });
        } else {
            this.createVisualElement(visualContent, visualName, animationType, visualType, visualConfig);
        }
    }
    
    // Animate visual exit
    animateVisualExit(element) {
        return new Promise((resolve) => {
            element.style.animation = 'slideOutLeft 0.5s ease-in forwards';
            setTimeout(resolve, 500);
        });
    }
    
    // Create visual element with proper type handling
    createVisualElement(container, visualName, animationType, visualType, visualConfig = {}) {
        let element;
        
        switch (visualType) {
            case 'video':
                element = this.createVideoElement(visualName, visualConfig);
                break;
                
            case 'table':
                element = this.createTableElement(visualName, visualConfig);
                break;
                
            case 'chart':
                element = this.createChartElement(visualName, visualConfig);
                break;
                
            case 'iframe':
                element = this.createIframeElement(visualName, visualConfig);
                break;
                
            case 'interactive':
                element = this.createInteractiveElement(visualName, visualConfig);
                break;
                
            case 'gallery':
                element = this.createGalleryElement(visualName, visualConfig);
                break;
                
            case 'document':
                element = this.createDocumentElement(visualName, visualConfig);
                break;
                
            case 'image':
            default:
                element = this.createImageElement(visualName, visualConfig);
                break;
        }
        
        // Set initial state
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(animationType);
        
        container.appendChild(element);
        
        // Trigger animation after element is added to DOM
        requestAnimationFrame(() => {
            this.animateVisualEntrance(element, animationType);
        });
    }
    
    // Create image element
    createImageElement(visualName, config) {
        const element = document.createElement('img');
        element.src = `/images/${visualName}`;
        element.alt = config.alt || 'Presentation Visual';
        
        if (config.clickable) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => this.handleImageClick(visualName, config));
        }
        
        return element;
    }
    
    // Create video element
    createVideoElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'video-container';
        
        const video = document.createElement('video');
        video.src = `/images/${visualName}`;
        video.controls = config.controls !== false;
        video.autoplay = config.autoplay || false;
        video.muted = config.muted !== false;
        video.loop = config.loop || false;
        video.playsInline = true;
        
        // Add video event listeners
        video.addEventListener('loadedmetadata', () => {
            if (config.startTime) {
                video.currentTime = config.startTime;
            }
        });
        
        video.addEventListener('ended', () => {
            if (config.onEnd) {
                config.onEnd();
            }
        });
        
        container.appendChild(video);
        
        // Add captions if provided
        if (config.captions) {
            const captionDiv = document.createElement('div');
            captionDiv.className = 'video-captions';
            captionDiv.textContent = config.captions;
            container.appendChild(captionDiv);
        }
        
        return container;
    }
    
    // Create table element
    createTableElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'table-container';
        
        // Load table data
        if (config.data) {
            const table = this.buildTableFromData(config.data, config.options);
            container.appendChild(table);
        } else {
            // Load from external source
            this.loadTableData(visualName).then(data => {
                const table = this.buildTableFromData(data, config.options);
                container.appendChild(table);
            });
        }
        
        return container;
    }
    
    // Create chart element
    createChartElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.id = `chart-${Date.now()}`;
        
        // Load chart data and render
        this.loadChartData(visualName).then(data => {
            this.renderChart(container.id, data, config);
        });
        
        return container;
    }
    
    // Create iframe element
    createIframeElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'iframe-container';
        
        const iframe = document.createElement('iframe');
        iframe.src = config.src || `/embeds/${visualName}`;
        iframe.width = config.width || '100%';
        iframe.height = config.height || '400px';
        iframe.frameBorder = '0';
        iframe.allowFullscreen = config.allowFullscreen || false;
        
        // Security attributes
        iframe.sandbox = config.sandbox || 'allow-scripts allow-same-origin';
        
        container.appendChild(iframe);
        
        return container;
    }
    
    // Create interactive element
    createInteractiveElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'interactive-container';
        
        switch (config.type) {
            case 'quiz':
                container.appendChild(this.createQuizElement(config));
                break;
            case 'poll':
                container.appendChild(this.createPollElement(config));
                break;
            case 'demo':
                container.appendChild(this.createDemoElement(config));
                break;
            case 'calculator':
                container.appendChild(this.createCalculatorElement(config));
                break;
            default:
                container.appendChild(this.createGenericInteractiveElement(config));
        }
        
        return container;
    }
    
    // Create gallery element
    createGalleryElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'gallery-container';
        
        const gallery = document.createElement('div');
        gallery.className = 'gallery-grid';
        
        config.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = `/images/${image.src}`;
            img.alt = image.alt || `Gallery image ${index + 1}`;
            img.addEventListener('click', () => this.openImageModal(image, index));
            
            item.appendChild(img);
            
            if (image.caption) {
                const caption = document.createElement('div');
                caption.className = 'gallery-caption';
                caption.textContent = image.caption;
                item.appendChild(caption);
            }
            
            gallery.appendChild(item);
        });
        
        container.appendChild(gallery);
        
        return container;
    }
    
    // Create document element
    createDocumentElement(visualName, config) {
        const container = document.createElement('div');
        container.className = 'document-container';
        
        const docViewer = document.createElement('div');
        docViewer.className = 'document-viewer';
        
        if (config.type === 'pdf') {
            // PDF viewer
            const pdfObject = document.createElement('object');
            pdfObject.data = `/documents/${visualName}`;
            pdfObject.type = 'application/pdf';
            pdfObject.width = '100%';
            pdfObject.height = '600px';
            docViewer.appendChild(pdfObject);
        } else if (config.type === 'text') {
            // Text document
            this.loadTextDocument(visualName).then(content => {
                const pre = document.createElement('pre');
                pre.className = 'document-text';
                pre.textContent = content;
                docViewer.appendChild(pre);
            });
        }
        
        container.appendChild(docViewer);
        
        return container;
    }
    
    // Build table from data
    buildTableFromData(data, options = {}) {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create header
        if (data.headers) {
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            data.headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }
        
        // Create body
        const tbody = document.createElement('tbody');
        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Add sorting if requested
        if (options.sortable) {
            this.makeTableSortable(table);
        }
        
        return table;
    }
    
    // Load table data
    async loadTableData(visualName) {
        try {
            const response = await fetch(`/api/data/${visualName}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading table data:', error);
            return { headers: ['Error'], rows: [['Failed to load data']] };
        }
    }
    
    // Load chart data
    async loadChartData(visualName) {
        try {
            const response = await fetch(`/api/charts/${visualName}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading chart data:', error);
            return { labels: ['Error'], datasets: [{ data: [0], label: 'No data' }] };
        }
    }
    
    // Load text document
    async loadTextDocument(visualName) {
        try {
            const response = await fetch(`/documents/${visualName}`);
            return await response.text();
        } catch (error) {
            console.error('Error loading document:', error);
            return 'Error loading document';
        }
    }
    
    // Render chart (placeholder for Chart.js integration)
    renderChart(containerId, data, config) {
        // This would integrate with Chart.js or similar library
        const container = document.getElementById(containerId);
        const placeholder = document.createElement('div');
        placeholder.className = 'chart-placeholder';
        placeholder.innerHTML = `
            <h3>Chart: ${config.title || 'Data Visualization'}</h3>
            <p>Chart rendering would be implemented here with Chart.js or similar library</p>
            <div class="chart-data-preview">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        container.appendChild(placeholder);
    }
    
    // Handle image click
    handleImageClick(imageName, config) {
        if (config.action === 'zoom') {
            this.openImageModal({ src: imageName, alt: config.alt });
        } else if (config.action === 'link') {
            window.open(config.url, '_blank');
        } else if (config.action === 'next') {
            this.nextSlide();
        }
    }
    
    // Open image modal
    openImageModal(image, index = 0) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <span class="image-modal-close">&times;</span>
                <img src="/images/${image.src}" alt="${image.alt}">
                <div class="image-modal-caption">${image.caption || ''}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('image-modal-close')) {
                modal.remove();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }
    
    // Make table sortable
    makeTableSortable(table) {
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sortTable(table, index));
        });
    }
    
    // Sort table
    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent.trim();
            const bText = b.cells[columnIndex].textContent.trim();
            
            // Try to parse as numbers
            const aNum = parseFloat(aText);
            const bNum = parseFloat(bText);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            return aText.localeCompare(bText);
        });
        
        // Re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));
    }
    
    // Create quiz element
    createQuizElement(config) {
        const quiz = document.createElement('div');
        quiz.className = 'quiz-element';
        quiz.innerHTML = `
            <h3>${config.question}</h3>
            <div class="quiz-options">
                ${config.options.map((option, index) => `
                    <button class="quiz-option" data-index="${index}">${option}</button>
                `).join('')}
            </div>
            <div class="quiz-result" style="display: none;"></div>
        `;
        
        // Add event listeners
        quiz.querySelectorAll('.quiz-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleQuizAnswer(e.target.dataset.index, config, quiz);
            });
        });
        
        return quiz;
    }
    
    // Handle quiz answer
    handleQuizAnswer(answerIndex, config, quizElement) {
        const result = quizElement.querySelector('.quiz-result');
        const isCorrect = answerIndex == config.correctAnswer;
        
        result.style.display = 'block';
        result.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
        result.textContent = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${config.options[config.correctAnswer]}`;
        
        // Disable all options
        quizElement.querySelectorAll('.quiz-option').forEach(button => {
            button.disabled = true;
            if (button.dataset.index == config.correctAnswer) {
                button.classList.add('correct');
            } else if (button.dataset.index == answerIndex && !isCorrect) {
                button.classList.add('incorrect');
            }
        });
    }
    
    // Create poll element
    createPollElement(config) {
        const poll = document.createElement('div');
        poll.className = 'poll-element';
        poll.innerHTML = `
            <h3>${config.question}</h3>
            <div class="poll-options">
                ${config.options.map((option, index) => `
                    <button class="poll-option" data-index="${index}">${option}</button>
                `).join('')}
            </div>
            <div class="poll-results" style="display: none;"></div>
        `;
        
        // Add event listeners
        poll.querySelectorAll('.poll-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handlePollVote(e.target.dataset.index, config, poll);
            });
        });
        
        return poll;
    }
    
    // Handle poll vote
    handlePollVote(optionIndex, config, pollElement) {
        // This would send vote to backend and get results
        const resultsDiv = pollElement.querySelector('.poll-results');
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <h4>Poll Results:</h4>
            <div class="poll-result-bar">
                <div class="poll-result-fill" style="width: 65%;">Option 1: 65%</div>
            </div>
            <div class="poll-result-bar">
                <div class="poll-result-fill" style="width: 35%;">Option 2: 35%</div>
            </div>
        `;
        
        // Disable voting
        pollElement.querySelectorAll('.poll-option').forEach(button => {
            button.disabled = true;
        });
    }
    
    // Create demo element
    createDemoElement(config) {
        const demo = document.createElement('div');
        demo.className = 'demo-element';
        demo.innerHTML = `
            <h3>${config.title}</h3>
            <div class="demo-content">
                <p>${config.description}</p>
                <button class="demo-button" data-action="${config.action}">${config.buttonText}</button>
            </div>
        `;
        
        demo.querySelector('.demo-button').addEventListener('click', (e) => {
            this.handleDemoAction(e.target.dataset.action, config);
        });
        
        return demo;
    }
    
    // Handle demo action
    handleDemoAction(action, config) {
        switch (action) {
            case 'api_call':
                this.showApiDemo(config);
                break;
            case 'feature_demo':
                this.showFeatureDemo(config);
                break;
            case 'simulation':
                this.showSimulation(config);
                break;
            default:
                console.log('Demo action:', action);
        }
    }
    
    // Show API demo
    showApiDemo(config) {
        const overlay = document.getElementById('interactive-overlay');
        overlay.innerHTML = `
            <div class="api-demo">
                <h3>API Demo: ${config.title}</h3>
                <div class="api-request">
                    <h4>Request:</h4>
                    <pre>${JSON.stringify(config.sampleRequest, null, 2)}</pre>
                </div>
                <div class="api-response">
                    <h4>Response:</h4>
                    <pre>${JSON.stringify(config.sampleResponse, null, 2)}</pre>
                </div>
                <button id="api-demo-close" class="secondary-button">Close</button>
            </div>
        `;
        
        overlay.classList.add('active');
        
        document.getElementById('api-demo-close').addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }
    
    // Generic interactive element
    createGenericInteractiveElement(config) {
        const element = document.createElement('div');
        element.className = 'generic-interactive';
        element.innerHTML = config.html || '<p>Interactive element</p>';
        return element;
    }
    
    // Get initial transform for animation
    getInitialTransform(animationType) {
        switch (animationType) {
            case 'slide-in-left':
                return 'translateX(-100px)';
            case 'slide-in-right':
                return 'translateX(100px)';
            case 'slide-in-up':
                return 'translateY(100px)';
            case 'slide-in-down':
                return 'translateY(-100px)';
            case 'zoom-in':
                return 'scale(0.8)';
            case 'zoom-out':
                return 'scale(1.2)';
            case 'rotate-in':
                return 'rotate(-10deg) scale(0.8)';
            case 'flip-in':
                return 'rotateY(-90deg)';
            default:
                return 'translateY(20px)';
        }
    }
    
    // Animate visual entrance
    animateVisualEntrance(element, animationType) {
        const duration = this.getAnimationDuration(animationType);
        const easing = this.getAnimationEasing(animationType);
        
        element.style.transition = `all ${duration}ms ${easing}`;
        element.style.opacity = '1';
        element.style.transform = 'translateX(0) translateY(0) scale(1) rotate(0deg) rotateY(0deg)';
        
        // Add special effects for certain animations
        if (animationType === 'bounce-in') {
            element.style.animation = 'bounceIn 0.8s ease-out';
        } else if (animationType === 'elastic-in') {
            element.style.animation = 'elasticIn 1s ease-out';
        }
    }
    
    // Get animation duration based on type
    getAnimationDuration(animationType) {
        switch (animationType) {
            case 'zoom-in':
            case 'zoom-out':
                return 600;
            case 'slide-in-left':
            case 'slide-in-right':
            case 'slide-in-up':
            case 'slide-in-down':
                return 800;
            case 'rotate-in':
            case 'flip-in':
                return 700;
            case 'bounce-in':
                return 800;
            case 'elastic-in':
                return 1000;
            default:
                return 500;
        }
    }
    
    // Get animation easing based on type
    getAnimationEasing(animationType) {
        switch (animationType) {
            case 'zoom-in':
            case 'zoom-out':
                return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            case 'slide-in-left':
            case 'slide-in-right':
            case 'slide-in-up':
            case 'slide-in-down':
                return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            case 'rotate-in':
            case 'flip-in':
                return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            case 'bounce-in':
                return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            case 'elastic-in':
                return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            default:
                return 'ease-out';
        }
    }

    updateSlideContent(slide) {
        const slideTitle = document.getElementById('slide-title');
        const slideText = document.getElementById('slide-text');
        const slideSpeaker = document.getElementById('slide-speaker');
        
        // Animate content exit
        this.animateContentExit([slideTitle, slideText, slideSpeaker]).then(() => {
            // Update content
            slideTitle.textContent = slide.title;
            slideText.textContent = slide.content;
            slideSpeaker.textContent = `— ${slide.speaker}`;
            
            // Animate content entrance
            this.animateContentEntrance([slideTitle, slideText, slideSpeaker]);
        });
    }
    
    // Animate content exit
    animateContentExit(elements) {
        return new Promise((resolve) => {
            elements.forEach((element, index) => {
                element.style.animation = `slideOutRight 0.4s ease-in ${index * 0.1}s forwards`;
            });
            setTimeout(resolve, 400 + (elements.length * 100));
        });
    }
    
    // Animate content entrance
    animateContentEntrance(elements) {
        elements.forEach((element, index) => {
            element.style.animation = `slideInLeft 0.6s ease-out ${index * 0.2}s both`;
        });
    }
    
    // Advanced slide transition with multiple animation types
    async animateSlideTransition(slide, slideIndex, transitionType = 'default') {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlideIndex = slideIndex;
        
        const slideContainer = document.getElementById('slide-container');
        const visualSection = document.getElementById('slide-visual');
        const contentSection = document.getElementById('slide-content');
        
        // Apply transition-specific animations
        switch (transitionType) {
            case 'slide-left':
                await this.slideTransition(slideContainer, 'left', slide);
                break;
            case 'slide-right':
                await this.slideTransition(slideContainer, 'right', slide);
                break;
            case 'fade':
                await this.fadeTransition(slideContainer, slide);
                break;
            case 'zoom':
                await this.zoomTransition(slideContainer, slide);
                break;
            case 'flip':
                await this.flipTransition(slideContainer, slide);
                break;
            default:
                await this.defaultTransition(visualSection, contentSection, slide);
        }
        
        // Update UI elements
        this.updateSlideIndicator();
        this.updateNavigationButtons();
        this.updateProgressBar();
        
        // Setup interactive elements
        setTimeout(() => {
            this.setupInteractiveElements(slide);
            this.isAnimating = false;
            
            // Auto-narrate if enabled
            this.autoNarrateSlide(slide);
        }, 1000);
    }
    
    // Slide transition animation
    async slideTransition(container, direction, slide) {
        const translateX = direction === 'left' ? '-100%' : '100%';
        
        // Slide out current content
        container.style.transform = `translateX(${translateX})`;
        container.style.transition = 'transform 0.5s ease-in-out';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update content
        this.updateVisual(slide.visual.src, slide.visual.animation, slide.visual.type);
        this.updateSlideContent(slide);
        
        // Slide in new content from opposite direction
        container.style.transform = `translateX(${direction === 'left' ? '100%' : '-100%'})`;
        container.style.transition = 'none';
        
        requestAnimationFrame(() => {
            container.style.transform = 'translateX(0)';
            container.style.transition = 'transform 0.5s ease-in-out';
        });
    }
    
    // Fade transition animation
    async fadeTransition(container, slide) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.4s ease-in-out';
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Update content
        this.updateVisual(slide.visual.src, slide.visual.animation, slide.visual.type);
        this.updateSlideContent(slide);
        
        container.style.opacity = '1';
    }
    
    // Zoom transition animation
    async zoomTransition(container, slide) {
        container.style.transform = 'scale(0.8)';
        container.style.opacity = '0';
        container.style.transition = 'all 0.4s ease-in-out';
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Update content
        this.updateVisual(slide.visual.src, slide.visual.animation, slide.visual.type);
        this.updateSlideContent(slide);
        
        container.style.transform = 'scale(1)';
        container.style.opacity = '1';
    }
    
    // Flip transition animation
    async flipTransition(container, slide) {
        container.style.transform = 'rotateY(90deg)';
        container.style.transition = 'transform 0.3s ease-in-out';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update content
        this.updateVisual(slide.visual.src, slide.visual.animation, slide.visual.type);
        this.updateSlideContent(slide);
        
        container.style.transform = 'rotateY(-90deg)';
        
        requestAnimationFrame(() => {
            container.style.transform = 'rotateY(0deg)';
        });
    }
    
    // Default transition animation
    async defaultTransition(visualSection, contentSection, slide) {
        // Fade out current content
        visualSection.style.opacity = '0';
        contentSection.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update content
        this.updateVisual(slide.visual.src, slide.visual.animation, slide.visual.type);
        this.updateSlideContent(slide);
        
        // Fade in new content
        setTimeout(() => {
            visualSection.style.opacity = '1';
            contentSection.style.opacity = '1';
        }, 100);
    }
    
    // Add particle effects for special transitions
    addParticleEffect(type = 'sparkle') {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particleContainer.appendChild(particle);
        }
        
        document.getElementById('slide-container').appendChild(particleContainer);
        
        // Remove particles after animation
        setTimeout(() => {
            particleContainer.remove();
        }, 3000);
    }

    showPage(pageId) {
        console.log(`Showing page: ${pageId}`);
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    showDemo() {
        window.location.href = '/deck/demo';
    }
    
    // NDA methods are omitted for brevity, but would be included in a real application
    signNda() {
        console.log('NDA signed');
    }

    // Slide Navigation Methods
    nextSlide() {
        if (this.currentSlideIndex < this.totalSlides - 1) {
            this.goToSlide(this.currentSlideIndex + 1);
        }
    }

    prevSlide() {
        if (this.currentSlideIndex > 0) {
            this.goToSlide(this.currentSlideIndex - 1);
        }
    }

    goToSlide(slideIndex) {
        if (slideIndex < 0 || slideIndex >= this.totalSlides || this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlideIndex = slideIndex;
        
        const slide = this.presentationScript[this.currentSlideIndex];
        
        // Update visual with animation
        this.updateVisual(slide.visual, 'zoomIn');
        
        // Update content with animation
        setTimeout(() => {
            this.updateSlideContent(slide);
        }, 500);
        
        // Update UI indicators
        this.updateSlideIndicator();
        this.updateNavigationButtons();
        this.updateTableOfContents();
        this.updateProgressBar();
        
        // Handle interactive elements
        setTimeout(() => {
            this.setupInteractiveElements(slide);
            this.isAnimating = false;
        }, 1000);
        
        // If in slideshow mode, reset the timer
        if (this.slideshowMode) {
            this.autoAdvanceSlides();
        }
    }

    updateSlideIndicator() {
        document.getElementById('current-slide').textContent = this.currentSlideIndex + 1;
        document.getElementById('total-slides').textContent = this.totalSlides;
    }
    
    updateProgressBar() {
        const progressFill = document.getElementById('progress-fill');
        const progress = ((this.currentSlideIndex + 1) / this.totalSlides) * 100;
        progressFill.style.width = `${progress}%`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        if (prevBtn) prevBtn.disabled = this.currentSlideIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentSlideIndex === this.totalSlides - 1;
    }

    populateTableOfContents() {
        const tocList = document.getElementById('toc-list');
        if (!tocList) return;
        
        tocList.innerHTML = '';
        
        this.presentationScript.forEach((slide, index) => {
            const tocItem = document.createElement('li');
            tocItem.className = 'toc-item';
            tocItem.dataset.topic = slide.topic;
            tocItem.textContent = `${index + 1}. ${slide.title}`;
            tocItem.addEventListener('click', () => this.goToSlide(index));
            tocList.appendChild(tocItem);
        });
    }
    
    updateTableOfContents() {
        document.querySelectorAll('.toc-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentSlideIndex);
        });
    }

    setupInteractiveElements(slide) {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        
        // Clear previous interactive elements
        interactiveOverlay.innerHTML = '';
        interactiveOverlay.classList.remove('active');
        
        // Show interactive elements if slide has them
        if (slide.topic === 'qna') {
            this.showQAInterface();
        } else {
            this.showChoiceButtons(slide.topic);
        }
    }
    
    showChoiceButtons(topic) {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'choice-buttons';
        
        // Add topic-specific choices
        const choices = this.getChoicesForTopic(topic);
        choices.forEach(choice => {
            const choiceBtn = document.createElement('div');
            choiceBtn.className = 'choice-btn';
            choiceBtn.innerHTML = `
                <h4>${choice.title}</h4>
                <p>${choice.description}</p>
            `;
            choiceBtn.addEventListener('click', () => choice.action());
            choiceContainer.appendChild(choiceBtn);
        });
        
        interactiveOverlay.appendChild(choiceContainer);
        
        // Show overlay after content loads
        setTimeout(() => {
            interactiveOverlay.classList.add('active');
        }, 2000);
    }
    
    getChoicesForTopic(topic) {
        const baseChoices = [
            {
                title: 'Continue →',
                description: 'Continue with the presentation',
                action: () => this.nextSlide(),
                choiceId: 'continue_presentation'
            },
            {
                title: 'Ask Question',
                description: 'Ask me anything about this topic',
                action: () => this.showQAInterface(),
                choiceId: 'open_qa'
            }
        ];
        
        switch (topic) {
            case 'intro':
                return [
                    {
                        title: 'Show Market Opportunity',
                        description: 'Jump to our $1.5T market analysis',
                        action: () => this.handleBranchingChoice('market_deep_dive'),
                        choiceId: 'market_deep_dive'
                    },
                    {
                        title: 'Explore Platforms',
                        description: 'See our 7 revolutionary platforms',
                        action: () => this.handleBranchingChoice('platform_overview'),
                        choiceId: 'platform_overview'
                    },
                    {
                        title: 'Technology Deep Dive',
                        description: 'Learn about our AI and technical architecture',
                        action: () => this.handleBranchingChoice('technology_branch'),
                        choiceId: 'technology_branch'
                    },
                    ...baseChoices
                ];
            case 'overview':
                return [
                    {
                        title: 'Entertainment Revolution',
                        description: 'Blank Wars, Block Loader, AdventureBlocks',
                        action: () => this.handleBranchingChoice('entertainment_branch'),
                        choiceId: 'entertainment_branch'
                    },
                    {
                        title: 'AI Training Ecosystem',
                        description: 'Our advanced AI development platform',
                        action: () => this.handleBranchingChoice('ai_training_branch'),
                        choiceId: 'ai_training_branch'
                    },
                    {
                        title: 'Business Model Deep Dive',
                        description: 'Revenue streams and monetization strategy',
                        action: () => this.handleBranchingChoice('business_model_branch'),
                        choiceId: 'business_model_branch'
                    },
                    ...baseChoices
                ];
            case 'talkdeck':
                return [
                    {
                        title: 'See Technical Architecture',
                        description: 'How TalkDeck works under the hood',
                        action: () => this.handleBranchingChoice('talkdeck_tech_branch'),
                        choiceId: 'talkdeck_tech_branch'
                    },
                    {
                        title: 'Market Opportunity',
                        description: 'TalkDeck\'s market potential and competition',
                        action: () => this.handleBranchingChoice('talkdeck_market_branch'),
                        choiceId: 'talkdeck_market_branch'
                    },
                    ...baseChoices
                ];
            default:
                return baseChoices;
        }
    }
    
    showQAInterface() {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        interactiveOverlay.innerHTML = `
            <div class="qa-interface">
                <h3>Ask Falcon Miller Anything</h3>
                <div class="qa-input-container">
                    <textarea id="qa-input" placeholder="What would you like to know about our platforms, strategy, or technology?" rows="3"></textarea>
                    <button id="qa-submit" class="send-btn">Ask Question</button>
                </div>
                <button id="qa-close" class="secondary-button">Close</button>
            </div>
        `;
        
        interactiveOverlay.classList.add('active');
        
        // Setup event listeners
        document.getElementById('qa-submit').addEventListener('click', () => this.handleQASubmit());
        document.getElementById('qa-close').addEventListener('click', () => this.hideInteractiveOverlay());
    }
    
    handleQASubmit() {
        const qaInput = document.getElementById('qa-input');
        const question = qaInput.value.trim();
        
        if (question) {
            this.showInteractiveResponse(question);
            qaInput.value = '';
        }
    }
    
    showInteractiveResponse(message) {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        interactiveOverlay.innerHTML = `
            <div class="response-container">
                <h4>Your Question:</h4>
                <p class="user-message">${message}</p>
                <h4>Falcon Miller:</h4>
                <p class="ai-response">Thank you for your question. I'm processing your inquiry and will provide a detailed response shortly. This is where the AI would respond with contextual information about our platforms and strategy.</p>
                <button id="response-close" class="secondary-button">Continue</button>
            </div>
        `;
        
        document.getElementById('response-close').addEventListener('click', () => this.hideInteractiveOverlay());
    }
    
    hideInteractiveOverlay() {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        interactiveOverlay.classList.remove('active');
    }
    
    // Handle branching choice selection
    async handleBranchingChoice(choiceId) {
        try {
            // Stop slideshow if active
            if (this.slideshowMode) {
                this.stopSlideshow();
            }
            
            // Show loading state
            this.showLoadingState('Processing your choice...');
            
            // Send choice to backend
            const response = await fetch('/api/presentation/choice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    choiceId: choiceId,
                    context: {
                        currentSlide: this.currentSlideIndex,
                        timestamp: new Date().toISOString()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to process choice');
            }
            
            const data = await response.json();
            
            // Hide loading state
            this.hideLoadingState();
            
            // Handle the result
            await this.processBranchingResult(data.result);
            
        } catch (error) {
            console.error('Error handling branching choice:', error);
            this.hideLoadingState();
            this.showError('Failed to process your choice. Please try again.');
        }
    }
    
    // Process the result of a branching choice
    async processBranchingResult(result) {
        switch (result.type) {
            case 'slide_change':
                // Simple navigation to another slide
                await this.animateSlideTransition(result.slide, result.slideIndex);
                break;
                
            case 'content_injection':
                // Inject additional content into current slide
                this.injectAdditionalContent(result.content);
                break;
                
            case 'branch_created':
                // User entered a new branch
                await this.handleBranchCreation(result);
                break;
                
            case 'ai_response':
                // Show AI-generated response
                this.showAIResponse(result.response, result.suggestedActions);
                break;
                
            case 'deep_dive':
                // Start deep dive experience
                await this.startDeepDive(result);
                break;
                
            default:
                console.warn('Unknown branching result type:', result.type);
        }
    }
    
    // Handle branch creation
    async handleBranchCreation(result) {
        // Update breadcrumb navigation
        this.updateBreadcrumb(result.breadcrumb);
        
        // Show branch indicator
        this.showBranchIndicator(result.branchId);
        
        // Navigate to first slide of branch
        await this.animateSlideTransition(result.firstSlide, result.slideIndex);
        
        // Update presentation state
        this.totalSlides = result.totalSlides || this.totalSlides;
        this.currentSlideIndex = result.slideIndex;
        this.updateSlideIndicator();
        this.updateNavigationButtons();
        this.updateProgressBar();
    }
    
    // Enhanced slide transition with transition effects
    async animateSlideTransition(slide, slideIndex, transitionType = 'default') {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlideIndex = slideIndex;
        
        // Add special effects for milestone slides
        if (slide.metadata?.special) {
            this.addParticleEffect('sparkle');
        }
        
        // Use appropriate transition based on slide type or user preference
        const transition = transitionType || this.getTransitionType(slide);
        
        await this.animateSlideTransition(slide, slideIndex, transition);
    }
    
    // Determine transition type based on slide
    getTransitionType(slide) {
        if (slide.type === 'deep_dive') return 'zoom';
        if (slide.visual?.animation === 'dramatic') return 'flip';
        if (slide.metadata?.category === 'technology') return 'slide-left';
        return 'fade';
    }
    
    // Inject additional content
    injectAdditionalContent(content) {
        const slideText = document.getElementById('slide-text');
        const additionalContent = document.createElement('div');
        additionalContent.className = 'additional-content';
        additionalContent.innerHTML = content;
        additionalContent.style.animation = 'fadeIn 0.8s ease-out';
        
        slideText.appendChild(additionalContent);
    }
    
    // Show AI response
    showAIResponse(response, suggestedActions) {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        
        let actionsHTML = '';
        if (suggestedActions && suggestedActions.length > 0) {
            actionsHTML = `
                <div class="suggested-actions">
                    <h4>What would you like to do next?</h4>
                    <div class="action-buttons">
                        ${suggestedActions.map(action => `
                            <button class="action-btn" data-action="${JSON.stringify(action.action).replace(/"/g, '&quot;')}">
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        interactiveOverlay.innerHTML = `
            <div class="ai-response-container">
                <div class="ai-avatar">
                    <span class="avatar-icon">🤖</span>
                    <span class="speaker-name">Falcon Miller</span>
                    <div class="ai-voice-controls">
                        <button id="ai-speak-btn" class="voice-control-btn" title="Read aloud">
                            🔊
                        </button>
                        <button id="ai-pause-btn" class="voice-control-btn" title="Pause/Resume" style="display: none;">
                            ⏸️
                        </button>
                        <button id="ai-stop-btn" class="voice-control-btn" title="Stop speech" style="display: none;">
                            ⏹️
                        </button>
                    </div>
                </div>
                <div class="ai-response-text" id="ai-response-text">${response}</div>
                <div class="ai-speech-progress" id="ai-speech-progress" style="display: none;">
                    <div class="speech-progress-bar">
                        <div class="speech-progress-fill" id="speech-progress-fill"></div>
                    </div>
                    <div class="speech-status" id="speech-status">Speaking...</div>
                </div>
                ${actionsHTML}
                <button id="ai-response-close" class="secondary-button">Continue</button>
            </div>
        `;
        
        interactiveOverlay.classList.add('active');
        
        // Setup event listeners
        document.getElementById('ai-response-close').addEventListener('click', () => {
            this.stopAISpeech();
            this.hideInteractiveOverlay();
        });
        
        // Voice control listeners
        document.getElementById('ai-speak-btn').addEventListener('click', () => {
            this.speakAIResponse(response);
        });
        
        document.getElementById('ai-pause-btn').addEventListener('click', () => {
            this.pauseAISpeech();
        });
        
        document.getElementById('ai-stop-btn').addEventListener('click', () => {
            this.stopAISpeech();
        });
        
        // Handle suggested actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = JSON.parse(e.target.dataset.action);
                this.handleSuggestedAction(action);
            });
        });
        
        // Auto-speak if voice mode is enabled
        if (this.voiceMode && this.voiceSettings.autoSpeak) {
            setTimeout(() => {
                this.speakAIResponse(response);
            }, 500);
        }
    }
    
    // Handle suggested action
    async handleSuggestedAction(action) {
        this.hideInteractiveOverlay();
        
        switch (action.type) {
            case 'navigate':
                if (action.target === 'next') {
                    this.nextSlide();
                } else if (action.target === 'prev') {
                    this.prevSlide();
                } else if (typeof action.target === 'number') {
                    this.goToSlide(action.target);
                }
                break;
                
            case 'deep_dive':
                await this.handleBranchingChoice(`deep_dive_${action.topic}`);
                break;
                
            case 'open_qa':
                this.showQAInterface();
                break;
                
            default:
                console.warn('Unknown suggested action:', action);
        }
    }
    
    // Update breadcrumb navigation
    updateBreadcrumb(breadcrumb) {
        const breadcrumbContainer = document.querySelector('.breadcrumb-nav');
        
        if (!breadcrumbContainer) {
            // Create breadcrumb container if it doesn't exist
            const header = document.querySelector('.presentation-header');
            const breadcrumbNav = document.createElement('div');
            breadcrumbNav.className = 'breadcrumb-nav';
            header.appendChild(breadcrumbNav);
        }
        
        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        breadcrumbNav.innerHTML = breadcrumb.map((item, index) => `
            <span class="breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}" 
                  data-slide="${item.slideIndex}">
                ${item.title}
            </span>
        `).join('<span class="breadcrumb-separator">→</span>');
        
        // Add click handlers for breadcrumb navigation
        breadcrumbNav.querySelectorAll('.breadcrumb-item:not(.active)').forEach(item => {
            item.addEventListener('click', () => {
                const slideIndex = parseInt(item.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });
    }
    
    // Show branch indicator
    showBranchIndicator(branchId) {
        const indicator = document.querySelector('.branch-indicator') || document.createElement('div');
        indicator.className = 'branch-indicator';
        indicator.innerHTML = `
            <span class="branch-icon">🌿</span>
            <span class="branch-text">Exploring: ${branchId.replace(/_/g, ' ')}</span>
        `;
        
        if (!document.querySelector('.branch-indicator')) {
            document.querySelector('.presentation-header').appendChild(indicator);
        }
    }
    
    // Show loading state
    showLoadingState(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = loadingOverlay.querySelector('p');
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }
    
    // Hide loading state
    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = 'none';
    }
    
    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1001;
            animation: fadeIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    // Add loading animation for interactive elements
    showInteractiveLoading() {
        const overlay = document.getElementById('interactive-overlay');
        overlay.innerHTML = `
            <div class="loading-interactive">
                <div class="loading-spinner-interactive"></div>
                <p>Loading interactive content...</p>
            </div>
        `;
        overlay.classList.add('active');
    }
    
    // Animate choice buttons appearance
    animateChoiceButtons(buttons) {
        buttons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                button.style.transition = 'all 0.4s ease-out';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }
    
    // Enhanced setupInteractiveElements with animations
    setupInteractiveElements(slide) {
        const interactiveOverlay = document.getElementById('interactive-overlay');
        
        // Clear previous interactive elements
        interactiveOverlay.innerHTML = '';
        interactiveOverlay.classList.remove('active');
        
        // Show interactive elements if slide has them
        if (slide.topic === 'qna') {
            this.showQAInterface();
        } else {
            this.showChoiceButtons(slide.topic);
        }
        
        // Animate interactive elements appearance
        setTimeout(() => {
            const choiceButtons = interactiveOverlay.querySelectorAll('.choice-btn');
            if (choiceButtons.length > 0) {
                this.animateChoiceButtons(choiceButtons);
            }
        }, 2000);
    }
    
    // Handle legacy choice buttons
    handleChoiceClick(button) {
        console.log('Choice clicked:', button.textContent);
    }

    // Legacy method - keeping for compatibility
    addQuickResponseButton(container, message, text) {
        const button = document.createElement('button');
        button.classList.add('quick-btn');
        button.dataset.message = message;
        button.textContent = text;
        container.appendChild(button);
    }
}

document.addEventListener('DOMContentLoaded', () => new TalkDeck());
