# 🚀 Standup Sync

A comprehensive daily standup management system with AI-powered chatbot integration, automated email notifications, and MCP server support for Augment Code integration.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Configuration](#️-configuration)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Additional Documentation](#-additional-documentation)
- [Quick Start Guide](#-quick-start-guide)
- [Key Features in Detail](#-key-features-in-detail)
- [Security Notes](#-security-notes)

---

## 🎯 Overview

**Standup Sync** is a full-stack application designed to streamline daily standup meetings by:
- Allowing team members to submit their daily updates (Done, Doing, Blockers)
- Providing an AI chatbot for natural language interaction with standup data
- Automatically sending daily blocker summary emails to managers
- Supporting MCP (Model Context Protocol) for Augment Code integration
- Offering real-time dashboard updates and advanced filtering

---

## 🏗️ Architecture

The application consists of **4 main components**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                     http://localhost:5173                       │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────┐      ┌────────────────────────────────┐
│  Backend (Rails API)   │      │  Chatbot Server (Node.js)     │
│  http://localhost:3000 │◄─────┤  http://localhost:3002         │
│  - API Endpoints       │      │  - OpenAI Integration          │
│  - Database (Postgres) │      │  - Natural Language Processing │
│  - GoodJob Scheduler   │      │  - Auto-refresh Events         │
│  - Email Service       │      └────────────────────────────────┘
└────────────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  MCP Server (Node.js)          │
│  http://localhost:3001         │
│  - Augment Code Integration    │
│  - Tool-based API Access       │
└────────────────────────────────┘
```

---

## ✨ Features

### Core Functionality
- ✅ **Standup Management**: Create, read, update, delete daily standups
- ✅ **User Authentication**: Secure login/signup with Devise
- ✅ **Advanced Filtering**: Sort by date, search by user, filter by content
- ✅ **Real-time Updates**: Auto-refresh dashboard after chatbot operations

### AI Chatbot
- ✅ **Natural Language Interface**: Interact with standups using plain English
- ✅ **Smart Intent Detection**: Understands dates like "today", "yesterday", "this week"
- ✅ **OpenAI Integration**: Powered by GPT-4o-mini for intelligent responses
- ✅ **Multi-tool Support**: Search, create, update, delete, and analyze standups

### Automated Emails
- ✅ **Daily Blocker Summary**: Scheduled emails with all blockers
- ✅ **Timezone Support**: Runs in Asia/Kolkata (IST) timezone
- ✅ **Beautiful HTML Templates**: Professional email design
- ✅ **GoodJob Dashboard**: Monitor scheduled jobs at `/good_job`

### MCP Integration
- ✅ **Augment Code Support**: Use standup tools directly in Augment
- ✅ **RESTful MCP Server**: Standard MCP protocol implementation
- ✅ **Tool Discovery**: Automatic tool listing and execution

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.4
- **Routing**: React Router DOM 7.13
- **Styling**: Bootstrap 5.3 + Custom CSS
- **HTTP Client**: Axios 1.13
- **Testing**: Jest + Playwright

### Backend
- **Framework**: Ruby on Rails 8.1.2
- **Ruby Version**: 3.4.8
- **Database**: PostgreSQL
- **API Framework**: Grape (REST API)
- **Background Jobs**: GoodJob 4.6 (Postgres-based)
- **Authentication**: Devise
- **Testing**: RSpec

### Chatbot Server
- **Runtime**: Node.js
- **Framework**: Express 5.2
- **AI Provider**: OpenAI (gpt-4o-mini)
- **Dependencies**: Axios, CORS, dotenv

### MCP Server
- **Runtime**: Node.js
- **Framework**: Express 4.18
- **Protocol**: Model Context Protocol (MCP)

---

## 📦 Prerequisites

Before installation, ensure you have:

- **Ruby**: 3.4.8 (use `rbenv` or `asdf`)
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 8.x or higher
- **Git**: Latest version

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Standup-Sync_Rails_app
```

### 2. Backend Setup (Rails)

```bash
cd backend

# Install Ruby gems
bundle install

# Create database
rails db:create

# Run migrations
rails db:migrate

# Seed database (optional - creates test users)
rails db:seed

# Install GoodJob (background job processor)
rails good_job:install
rails db:migrate
```

### 3. Frontend Setup (React)

```bash
cd frontend

# Install npm packages
npm install

# Build the application (optional)
npm run build
```

### 4. Chatbot Server Setup

```bash
cd chatbot-server

# Install npm packages
npm install

# Create .env file (see Configuration section below)
touch .env
```

### 5. MCP Server Setup

```bash
cd mcp-server

# Install npm packages
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Manager email for daily blocker summaries
MANAGER_EMAIL=your-email@example.com

# Redis URL (for caching - optional)
REDIS_URL=redis://localhost:6379/0

# Gmail SMTP credentials for sending emails
GMAIL_USERNAME=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Production SMTP settings (optional)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=gmail.com
```

**📧 How to get Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"

### Chatbot Server Environment Variables

Create `chatbot-server/.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_URL=https://api.openai.com/v1

# Rails Backend URL
RAILS_API_URL=http://localhost:3000/api

# Server Port (optional)
PORT=3002
```

### Database Configuration

Edit `backend/config/database.yml` if needed (default settings work for local development):

```yaml
development:
  adapter: postgresql
  encoding: unicode
  database: standup_sync_development
  pool: 5
```

### GoodJob Configuration

The scheduled email job is configured in `backend/config/initializers/good_job.rb`:

```ruby
config.good_job.cron = {
  daily_blocker_email: {
    cron: "05 15 * * *",  # 3:05 PM IST daily
    class: "DailyBlockerJob",
    set: { time_zone: "Asia/Kolkata" }
  }
}
```

**Change schedule time:**
- Format: `"minute hour day month day_of_week"`
- Example: `"0 9 * * *"` = 9:00 AM daily
- Example: `"30 17 * * 1-5"` = 5:30 PM Monday-Friday

---

## 🎮 Running the Application

You need to run **3 servers** in separate terminals:

### Terminal 1: Rails Backend

```bash
cd backend
rails server
```

✅ Backend runs at: **http://localhost:3000**
- API Endpoint: `http://localhost:3000/api`
- GoodJob Dashboard: `http://localhost:3000/good_job`

### Terminal 2: React Frontend

```bash
cd frontend
npm start
```

✅ Frontend runs at: **http://localhost:5173**

### Terminal 3: Chatbot Server

```bash
cd chatbot-server
npm start
```

✅ Chatbot runs at: **http://localhost:3002**

### Terminal 4 (Optional): MCP Server

```bash
cd mcp-server
npm start
```

✅ MCP Server runs at: **http://localhost:3001**

---

## 🧪 Testing

### Backend (RSpec)

```bash
cd backend

# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run with coverage
bundle exec rspec --format documentation
```

### Frontend Tests

#### Unit Tests (Jest)
```bash
cd frontend

# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage
```

#### E2E Tests (Playwright)
```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

**Available E2E Tests:**
- `auth.spec.js` - Login/signup flows
- `standup-crud.spec.js` - Create/update/delete standups
- `filter-sort.spec.js` - Filtering and sorting functionality

### Manual Testing

#### Test Email Functionality

```bash
cd backend

# Send test email immediately
rails test:mailer

# Check cron schedule
rails test:cron

# Or from Rails console
rails console
> DailyBlockerJob.perform_now
```

#### Test Chatbot

Visit `http://localhost:5173`, login, and click the chatbot icon. Try:
- "Show my standups for today"
- "What did I do yesterday?"
- "Create a standup for today"
- "Show all blockers this week"

---

## 🚢 Deployment

### Using Kamal (Docker)

The backend includes Kamal configuration for deployment:

```bash
cd backend

# Set up Kamal secrets
bin/kamal setup

# Deploy application
bin/kamal deploy

# Check status
bin/kamal app logs
```

Edit `backend/config/deploy.yml` to configure your servers.

### Manual Deployment

#### Backend (Rails)

```bash
# Set environment to production
export RAILS_ENV=production

# Precompile assets
rails assets:precompile

# Run migrations
rails db:migrate

# Start server with Puma
bundle exec puma -C config/puma.rb
```

#### Frontend (React)

```bash
# Build for production
npm run build

# Serve with any static file server
# Example with nginx or serve the `build` directory
```

#### Chatbot & MCP Servers

```bash
# Use PM2 or systemd to run as services
pm2 start server.js --name chatbot-server
pm2 start server.js --name mcp-server

# Or use Docker
docker build -t chatbot-server .
docker run -p 3002:3002 chatbot-server
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All API requests require `authenticated_user_id` parameter.

### Endpoints

#### **GET** `/api/v1/standups`
Get all standups with optional filters.

**Query Parameters:**
- `authenticated_user_id` (required)
- `search_name` - Filter by user name
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)
- `q` - Search in done/doing/blockers

**Example:**
```bash
curl "http://localhost:3000/api/v1/standups?authenticated_user_id=1&start_date=2026-03-01"
```

#### **POST** `/api/v1/standups`
Create a new standup.

**Body:**
```json
{
  "user_id": 1,
  "done": "Completed feature X",
  "doing": "Working on feature Y",
  "blockers": "None",
  "standup_date": "2026-03-27",
  "authenticated_user_id": 1
}
```

#### **PUT** `/api/v1/standups/:id`
Update an existing standup.

#### **DELETE** `/api/v1/standups/:id`
Delete a standup.

### Chatbot API

#### **POST** `/api/chatbot/message`
Send a message to the chatbot.

**Body:**
```json
{
  "message": "Show my standups for today",
  "sessionId": "unique-session-id",
  "user_id": 1
}
```

**Response:**
```json
{
  "reply": "Here are your standups for today...",
  "data": { ... },
  "requiresAuth": false,
  "shouldRefresh": false
}
```

### MCP API

#### **GET** `/mcp/tools/list`
List all available MCP tools.

#### **POST** `/mcp/tools/call`
Execute an MCP tool.

**Body:**
```json
{
  "name": "search_standups",
  "arguments": {
    "days": 7
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Database Connection Error**

```bash
# Check if Postgres is running
pg_isready

# Start Postgres (macOS)
brew services start postgresql@14

# Create database if missing
cd backend && rails db:create
```

#### 2. **Bundler Version Mismatch**

```bash
# Update bundler
gem install bundler

# Or install specific version
gem install bundler:4.0.9
```

#### 3. **GoodJob Tables Missing**

```bash
cd backend
rails good_job:install
rails db:migrate
```

#### 4. **Port Already in Use**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 rails server
```

#### 5. **Email Not Sending**

```bash
# Test SMTP settings
cd backend
rails test:mailer

# Check logs
tail -f log/development.log

# Verify Gmail App Password
# Make sure 2FA is enabled and app password is correct
```

#### 6. **Chatbot Not Responding**

- ✅ Check `chatbot-server/.env` has valid `OPENAI_API_KEY`
- ✅ Verify chatbot server is running on port 3002
- ✅ Check browser console for CORS errors
- ✅ Ensure Rails backend is running

#### 7. **Redis Connection Errors**

Redis is optional for this setup. If you see Redis errors:

```bash
# Remove Redis dependency if not using
# Comment out redis-related gems in Gemfile
# Or start Redis
redis-server
```

#### 8. **Frontend Not Loading**

```bash
cd frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
npm start -- --reset-cache
```

---

## 📖 Additional Documentation

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **Chatbot Testing Guide**: `chatbot-server/TESTING_GUIDE.md`
- **Auto-refresh Feature**: `chatbot-server/AUTO_REFRESH_FEATURE.md`

---

## 🎯 Quick Start Guide

For first-time setup, follow these steps in order:

### 1️⃣ **Database Setup**
```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails good_job:install
rails db:migrate
```

### 2️⃣ **Environment Variables**
Create `.env` files:
- `backend/.env` - Add Gmail credentials and manager email
- `chatbot-server/.env` - Add OpenAI API key

### 3️⃣ **Install Dependencies**
```bash
# Frontend
cd frontend && npm install

# Chatbot
cd chatbot-server && npm install

# MCP (optional)
cd mcp-server && npm install
```

### 4️⃣ **Start All Servers**
Open 3 terminals and run:

```bash
# Terminal 1
cd backend && rails server

# Terminal 2
cd frontend && npm start

# Terminal 3
cd chatbot-server && npm start
```

### 5️⃣ **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- GoodJob Dashboard: http://localhost:3000/good_job

### 6️⃣ **Login**
Use the test account (created by seeds):
- **Email**: `siri@rc.com`
- **Password**: `password123`

---

## 🌟 Key Features in Detail

### 1. **Chatbot Capabilities**

The AI chatbot understands natural language and can:

**Search Operations:**
- "Show my standups"
- "What did I do yesterday?"
- "Show standups from last week"
- "Who has blockers?"

**Create Operations:**
- "Create a standup for today"
- "Add standup: done X, doing Y, blockers Z"

**Update Operations:**
- "Update today's standup"
- "Change my blockers to X"

**Delete Operations:**
- "Delete today's standup"
- "Remove my standup from March 20"

**Analysis:**
- "Show my productivity stats"
- "How many blockers did I have this month?"

### 2. **Email Notifications**

The system automatically sends daily blocker summaries:

**Schedule:** 3:05 PM IST (configurable)
**Recipient:** Defined in `MANAGER_EMAIL` env variable
**Content:**
- Total blocker count
- Each team member with blockers
- Done and Doing tasks for context
- Beautiful HTML formatting

**Customize schedule:**
Edit `backend/config/initializers/good_job.rb`

### 3. **MCP Integration for Augment Code**

Use Standup Sync tools directly in Augment:

**Setup:**
1. Copy `mcp-server/augment-mcp-config.json` to Augment config directory
2. Start MCP server: `cd mcp-server && npm start`
3. Restart Augment Code

**Available Tools:**
- `search_standups` - Search all standups
- `create_standup` - Create new standup
- `update_standup` - Update existing standup
- `delete_standup` - Delete standup
- `get_user_insights` - Get productivity metrics

### 4. **Auto-refresh Feature**

The dashboard automatically refreshes when the chatbot:
- Creates a new standup
- Updates an existing standup
- Deletes a standup

This uses custom browser events for real-time synchronization.

### 5. **Advanced Filtering**

The dashboard supports:
- **Date Range**: Filter by start and end date
- **User Search**: Find standups by team member name
- **Content Search**: Search in done/doing/blockers
- **Sort Order**: Newest or oldest first
- **Quick Filters**: Today, Yesterday, This Week, This Month

---

## 🔐 Security Notes

### Production Checklist

- [ ] Change default passwords
- [ ] Use strong `SECRET_KEY_BASE` (Rails)
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up proper database backups
- [ ] Configure firewall rules
- [ ] Use separate production OpenAI key with limits
- [ ] Review GoodJob dashboard access controls

### Environment Variables to Secure

**Never commit these to Git:**
- `OPENAI_API_KEY`
- `GMAIL_APP_PASSWORD`
- `SECRET_KEY_BASE`
- `DATABASE_PASSWORD`
- Any API keys or tokens

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit pull request

### Code Style

- **Ruby**: Follow Rails conventions
- **JavaScript**: Use ES6+ features
- **React**: Functional components with hooks
- **Naming**: Clear, descriptive variable names

---

## 📝 License

[Add your license here]

---

## 👥 Team

[Add team members or contributors]

---

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Check existing documentation
- Review logs in `backend/log/development.log`

---

## 🎉 Acknowledgments

- **Rails 8** - Modern full-stack framework
- **React** - Frontend library
- **OpenAI** - AI chatbot capabilities
- **GoodJob** - Background job processing
- **Bootstrap** - UI components
- **Playwright** - E2E testing

---

## 📊 Project Status

✅ **Production Ready Features:**
- User authentication
- Standup CRUD operations
- AI chatbot with OpenAI
- Scheduled email notifications
- MCP server integration
- E2E and unit tests

🚧 **In Development:**
- Mobile app
- Slack integration
- Analytics dashboard
- Team performance metrics

---

**Made with ❤️ for better standups**

