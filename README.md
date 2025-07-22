# TalkDeck 

> Interactive pitch presentations that talk back

TalkDeck revolutionizes pitch presentations by making them interactive and intelligent. Instead of static slides, investors get an AI-powered assistant that can answer any question about your business in real-time.

## Features

- 🤖 **AI-Powered Assistant**: Smart, engaging AI that knows your pitch inside and out
- 🔒 **NDA Protection**: Secure your sensitive information with digital NDA signing
- 📱 **Mobile Friendly**: Perfect experience on any device, anywhere
- 📊 **Analytics & Tracking**: See who's viewing and engaging with your deck
- ⚡ **JIT Content Bank**: Dynamic, modular content delivery system
- 🎨 **Interactive Chat UI**: Clean, scrollable format with supporting visuals
- 📧 **Easy Sharing**: Email/SMS distribution with tracking capabilities

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key (for AI functionality)

### Installation

1. **Clone and setup the project:**
   ```bash
   cd talkdeck
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Set up demo data:**
   ```bash
   npm run setup-demo
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Visit the application:**
   Open http://localhost:3000 in your browser

## Environment Configuration

Create a `.env` file with the following variables:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database.sqlite
OPENAI_API_KEY=your-openai-api-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
APP_URL=http://localhost:3000
```

## API Documentation

### NDA Endpoints

- `GET /api/nda/:deckId` - Get NDA for a deck
- `POST /api/nda/:deckId/sign` - Sign NDA and get access token
- `POST /api/nda/:deckId/verify` - Verify access token

### Chat Endpoints

- `POST /api/chat/start` - Start a new chat session
- `POST /api/chat/:sessionId/message` - Send a message
- `GET /api/chat/:sessionId/history` - Get chat history
- `POST /api/chat/:sessionId/end` - End chat session

### Content Endpoints

- `GET /api/content/:deckId/categories` - Get content categories
- `GET /api/content/:deckId/category/:category` - Get content by category
- `GET /api/content/:deckId/search` - Search content

### Session Endpoints

- `GET /api/session/:sessionId` - Get session details
- `GET /api/session/user/sessions` - Get user sessions
- `GET /api/session/:sessionId/export` - Export session data

### Share Endpoints

- `POST /api/share/:deckId/link` - Create share link
- `POST /api/share/:deckId/email` - Send via email
- `POST /api/share/:deckId/click/:shareId` - Track share click
- `GET /api/share/:deckId/analytics` - Get share analytics

## Architecture

### Backend Stack
- **Express.js**: Web framework
- **SQLite**: Database for development (PostgreSQL for production)
- **OpenAI**: AI-powered chat responses
- **JWT**: Authentication and session management
- **Nodemailer**: Email functionality

### Frontend Stack
- **Vanilla JavaScript**: Client-side functionality
- **CSS3**: Responsive styling with mobile-first design
- **HTML5 Canvas**: Digital signature capability
- **WebSocket**: Real-time chat functionality

### Key Components

1. **JIT Content Bank**: Dynamic content loading system that provides relevant information based on user queries
2. **NDA Gating**: Digital signature workflow with legal compliance
3. **AI Agent**: Contextual assistant with personality and domain knowledge
4. **Analytics Engine**: Comprehensive tracking and reporting
5. **Share System**: Multi-channel distribution with engagement tracking

## Demo

Visit the demo at http://localhost:3000/deck/demo to experience TalkDeck's features:

1. **Landing Page**: Overview of features and benefits
2. **NDA Signing**: Experience the digital signature workflow
3. **Interactive Chat**: Ask questions about TalkDeck itself
4. **Analytics**: See engagement tracking in action

## Deployment

### Production Environment

1. **Set up production database** (PostgreSQL recommended)
2. **Configure environment variables** for production
3. **Set up SSL certificates** for HTTPS
4. **Configure email service** (SendGrid, AWS SES, etc.)
5. **Deploy to cloud platform** (AWS, Heroku, DigitalOcean, etc.)

### Docker Deployment

```bash
# Build image
docker build -t talkdeck .

# Run container
docker run -p 3000:3000 --env-file .env talkdeck
```

## Security Features

- **End-to-end encryption** for sensitive data
- **JWT-based authentication** with expiration
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS protection** and security headers
- **Audit trail** for all NDA signatures
- **IP and user agent tracking** for security

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@talkdeck.com or create an issue in this repository.

## Roadmap

See our [Product Roadmap](docs/ROADMAP.md) for upcoming features and improvements.

---

Built with ❤️ by the TalkDeck team