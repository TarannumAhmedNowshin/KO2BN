# KO2BN Translation Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**A Unified AI Communication Platform for Korean-Bangla-English Collaboration**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Screenshots](#screenshots)

</div>

---

## 📖 Overview

**KO2BN** is a comprehensive, cloud-native translation platform designed to eliminate language barriers across Korean, Bengali (Bangla), and English. Built with modern web technologies, it provides seamless, reliable, and secure bi-directional translation for text documents, real-time meetings, and archived content management.

### 🎯 Vision
Building a **Single Bridge for Korean-Bangla Collaboration** — a unified platform that handles every stage of professional partnerships, from document translation to real-time physical meetings, all under one management console.

### 🌟 Key Highlights
- **Free & Reliable**: Uses Google Translate via deep-translator (no API key required)
- **Real-Time Translation**: Live speech-to-text with Web Speech API
- **Document Processing**: Upload and translate PDF/DOCX files instantly
- **Meeting Sessions**: Real-time multilingual meetings with QR code sharing
- **Smart Archive**: Search across all translations with advanced filters
- **Admin Dashboard**: Complete user, project, and analytics management

---

## ✨ Features

### 🌐 **Three Service Modules**

#### **Module A: Asynchronous Translation** ✅
- **Text Translation**: Instant translation between Korean ↔ Bengali ↔ English
- **Document Upload**: Process PDF and DOCX files with text extraction
- **Translation History**: View and reload past translations
- **Download Options**: Export translations as .txt files
- **Smart Glossary**: Project-specific terminology management with auto-replacement

#### **Module B: Physical Meeting Translator** ✅
- **Real-Time Sessions**: Create meetings with unique 6-digit codes
- **QR Code Sharing**: Easy session joining via QR scan
- **Speech Recognition**: Browser-based speech-to-text (Web Speech API)
- **Live Subtitles**: Three-column display (Korean | Bengali | English)
- **Audio Playback**: Text-to-speech for all languages (gTTS)
- **Multi-User Support**: WebSocket broadcasting for all participants
- **Transcript Archive**: All conversations saved with timestamps

#### **Module C: Virtual Meeting Bot** 🔜
- Zoom/Teams integration (planned for Phase 6)
- Low-latency streaming with Voice Activity Detection
- Automated bot joining via meeting URL

### 📊 **Management & Analytics**

#### **Admin Panel** ✅
- **User Management**: Complete CRUD operations for users
- **Role Control**: Admin, Manager, and Team Member roles
- **Project Management**: Create projects and assign team members
- **Access Control**: Role-based permissions

#### **Analytics Dashboard** ✅
- **Overview Stats**: Total translations, documents, users, and active meetings
- **Visual Charts**: 
  - Weekly activity trends (Bar chart)
  - Usage distribution (Pie chart)
  - Language pair statistics
- **Top Users**: Leaderboard by translation count
- **Daily Trends**: Last 7 days activity tracking

#### **Document Management** ✅
- **File Storage**: Organized folder structure by user
- **Document Library**: View all uploaded documents in card layout
- **Search & Filter**: Find documents quickly by filename
- **Download & Delete**: Full management of uploaded files
- **Statistics**: Track total documents, storage, and translation status

#### **Unified Archive** ✅
- **Global Search**: Search across text translations, documents, and meeting transcripts
- **Advanced Filters**: 
  - By project
  - By module type (text/document/meeting)
  - By language pair
  - By date range
- **Keyword Highlighting**: Visual emphasis on matched terms
- **Full Record View**: Detailed modal for complete content

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast Python web framework
- **Database**: SQLAlchemy + SQLite (easily upgradable to PostgreSQL)
- **Authentication**: JWT tokens with python-jose
- **Real-Time**: WebSockets for live communication
- **File Processing**: PyPDF2 (PDF) + python-docx (DOCX)

### **Frontend**
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts for data visualization
- **QR Codes**: qrcode.react
- **Styling**: Custom CSS with modern design patterns

### **AI Services**
| Service | Technology | Status |
|---------|-----------|--------|
| **Translation** | Deep Translator (Free Google Translate) | ✅ Active |
| **Speech-to-Text** | Web Speech API (Browser-native) | ✅ Active |
| **Text-to-Speech** | gTTS (Google Text-to-Speech) | ✅ Active |

### **Key Dependencies**
```bash
# Backend
fastapi==0.115.6
sqlalchemy==2.0.36
deep-translator
gtts==2.5.0
PyPDF2==3.0.1
python-docx==1.1.2
python-jose[cryptography]==3.3.0
websockets==12.0

# Frontend
react==19.2.0
react-router-dom==7.11.0
axios==1.13.2
recharts==3.6.0
qrcode.react==4.2.0
```

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- Modern web browser with Web Speech API support (Chrome, Edge recommended)

### **Installation**

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd korean_translation_project
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Create .env file (optional - uses defaults)
echo "SECRET_KEY=your_secret_key_here" > .env
echo "DATABASE_URL=sqlite:///./korean.db" >> .env

# Run database migrations (automatic on first run)
# Database tables will be created automatically
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# No additional configuration needed
```

### **Running the Application**

#### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:5173`

#### Option 2: Using VS Code Terminals (Recommended)
1. Open two terminals in VS Code
2. Run backend in Terminal 1: `cd backend && uvicorn main:app --reload`
3. Run frontend in Terminal 2: `cd frontend && npm run dev`

---

## 📱 Usage Guide

### **First Time Setup**

1. **Create Admin Account**
   - Navigate to `http://localhost:5173/signup`
   - Create your first account
   - To make yourself admin, use one of these methods:
     ```python
     # Method 1: Python shell
     from backend.database import SessionLocal
     from backend.models.user import User
     db = SessionLocal()
     user = db.query(User).filter(User.username == "your_username").first()
     user.role = "admin"
     db.commit()
     ```
     ```bash
     # Method 2: API (if you have an existing admin)
     curl -X POST "http://localhost:8000/api/admin/users" \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -d '{"username": "new_admin", "role": "admin", ...}'
     ```

2. **Access Dashboard**
   - Login at `http://localhost:5173/login`
   - You'll see the main dashboard with analytics

### **Features Walkthrough**

#### **Text Translation**
1. Click **Translation** in sidebar
2. Select **Text Mode**
3. Choose source and target languages
4. Enter or paste text
5. Click **Translate**
6. View result and download if needed
7. Check **History** sidebar for past translations

#### **Document Translation**
1. Go to **Translation** page
2. Select **Document Mode**
3. Drag & drop or click to upload PDF/DOCX
4. Wait for processing (shows progress)
5. View extracted and translated text
6. Download translation as .txt file
7. Access documents later from **Documents** page

#### **Glossary Management**
1. Navigate to **Glossary** page
2. Create or select a project
3. Click **Add Term** button
4. Enter source term, target term, and languages
5. Save - terms will auto-apply in translations
6. Edit or delete terms as needed

#### **Physical Meeting**
1. Click **Create Meeting** in sidebar
2. Share QR code or 6-digit session code
3. Participants click **Join Meeting** and enter code
4. Enter your name as speaker
5. Click the **Speak** button
6. Start speaking (browser will ask for mic permission)
7. Click **Stop** when done
8. View real-time subtitles in all 3 languages
9. Audio plays automatically for translations
10. All transcripts saved to archive

#### **Archive & Search**
1. Go to **Archive** page
2. Enter keywords in search bar
3. Apply filters (project, module, language, date)
4. Browse results with keyword highlighting
5. Click **View Full Record** for complete details
6. Clear filters to see all content

#### **Admin Functions** (Admin role only)
1. Navigate to **Admin Dashboard**
2. View all users in table
3. Click **Add User** to create new accounts
4. Edit roles (admin/manager/team_member)
5. Delete users with confirmation
6. Manage project memberships

---

## 📂 Project Structure

```
korean_translation_project/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Environment configuration
│   ├── database.py             # SQLAlchemy setup
│   ├── api/                    # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── translation.py     # Translation endpoints
│   │   ├── documents.py       # Document management
│   │   ├── glossary.py        # Glossary CRUD
│   │   ├── projects.py        # Project management
│   │   ├── admin.py           # Admin user management
│   │   ├── analytics.py       # Analytics data
│   │   ├── sessions.py        # Meeting sessions
│   │   ├── archive.py         # Archive search
│   │   └── websocket.py       # WebSocket handler
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── translation.py
│   │   ├── document.py
│   │   ├── glossary.py
│   │   ├── session.py
│   │   └── transcript.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── translation.py
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── translation_service.py
│   │   ├── document_service.py
│   │   ├── stt_service.py
│   │   └── tts_service.py
│   ├── uploads/                # User uploaded files
│   └── database/               # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Main app component with routes
│   │   ├── api/
│   │   │   └── client.js      # Axios configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx
│   │   └── pages/             # Page components
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── TranslationPage.jsx
│   │       ├── DocumentsPage.jsx
│   │       ├── GlossaryPage.jsx
│   │       ├── AdminPanel.jsx
│   │       ├── ArchivePage.jsx
│   │       ├── CreateSession.jsx
│   │       ├── JoinSession.jsx
│   │       └── PhysicalMeetingPage.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── requirements.txt           # Python dependencies
├── PROJECT_PLAN.md           # Detailed development roadmap
└── README.md                 # This file
```

---

## 🗄️ Database Schema

### **Core Tables**

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (admin/manager/team_member) |
| `projects` | Project groupings for translations and glossaries |
| `project_users` | Many-to-many relationship between projects and users |
| `translations` | Text translation history with source/target languages |
| `documents` | Uploaded document metadata and file paths |
| `glossary` | Custom terminology per project with auto-replacement |
| `meeting_sessions` | Physical meeting sessions with codes and status |
| `transcripts` | Meeting transcripts in all 3 languages |
| `activity_logs` | User action tracking for analytics |

### **Relationships**
- Users can have multiple projects (many-to-many via `project_users`)
- Projects contain translations, documents, glossary terms, and sessions
- Sessions have multiple transcripts
- Documents link to translations
- All entities track user ownership and timestamps

---

## 📊 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### **Key Endpoints**

#### **Authentication**
```
POST   /api/auth/signup       - Create new account
POST   /api/auth/login        - Login and get JWT token
GET    /api/auth/me           - Get current user info
```

#### **Translation**
```
POST   /api/translate/        - Translate text
POST   /api/translate/document - Upload and translate document
GET    /api/translate/history - Get user's translation history
```

#### **Documents**
```
GET    /api/documents/        - List user's documents
GET    /api/documents/{id}    - Get document details
GET    /api/documents/{id}/download - Download original file
DELETE /api/documents/{id}    - Delete document
GET    /api/documents/stats   - Get document statistics
```

#### **Glossary**
```
GET    /api/glossary/project/{id}     - List project glossary
POST   /api/glossary/                 - Create new term
PUT    /api/glossary/{id}             - Update term
DELETE /api/glossary/{id}             - Delete term
```

#### **Projects**
```
GET    /api/projects/                 - List user's projects
POST   /api/projects/                 - Create project
DELETE /api/projects/{id}             - Delete project
GET    /api/projects/{id}/members     - List project members
POST   /api/projects/{id}/members/{user_id} - Add member
DELETE /api/projects/{id}/members/{user_id} - Remove member
```

#### **Sessions (Physical Meetings)**
```
POST   /api/sessions/create           - Create new session
GET    /api/sessions/{code}           - Get session details
POST   /api/sessions/{code}/join      - Join session
POST   /api/sessions/{code}/end       - End session
GET    /api/sessions/{code}/transcripts - Get all transcripts
WS     /ws/session/{code}             - WebSocket for real-time
```

#### **Admin**
```
GET    /api/admin/users               - List all users (admin only)
POST   /api/admin/users               - Create user (admin only)
PUT    /api/admin/users/{id}          - Update user (admin only)
DELETE /api/admin/users/{id}          - Delete user (admin only)
```

#### **Analytics**
```
GET    /api/analytics/overview        - Platform-wide statistics
GET    /api/analytics/project/{id}    - Project-specific analytics
```

#### **Archive**
```
GET    /api/archive/search            - Search all content with filters
```

---

## 🎨 UI/UX Features

### **Design Philosophy**
- **Professional Desktop-First**: Sharp, clean design optimized for productivity
- **Dark Theme**: Reduces eye strain during extended use
- **Responsive Charts**: Interactive data visualization with Recharts
- **Intuitive Navigation**: Sidebar with clear icons and active state indicators
- **Real-Time Feedback**: Loading states, progress bars, and status indicators
- **Accessible**: Keyboard navigation and screen reader friendly

### **Color Scheme**
```css
Primary:   #00BCD4 (Cyan) - Main actions and highlights
Secondary: #2196F3 (Blue) - Secondary actions
Accent:    #E91E63 (Pink) - Important alerts
Success:   #4CAF50 (Green) - Positive feedback
Warning:   #FFC107 (Amber) - Warnings
Error:     #F44336 (Red) - Errors
Background: #0d0d0d (Dark) - Main background
Surface:   #1a1a1a (Dark Gray) - Card backgrounds
```

### **Key UI Components**
- **Stat Cards**: Overview metrics with trend indicators
- **Charts**: Bar, Line, and Pie charts for data visualization
- **Modals**: Add/Edit dialogs with form validation
- **Tables**: Sortable tables with action buttons
- **File Upload**: Drag-drop area with progress indicators
- **WebSocket Status**: Connection indicator with auto-reconnect

---

## 🔐 Security Features

### **Authentication**
- JWT token-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh mechanism
- Protected routes with role-based access

### **Authorization**
- Three-tier role system (Admin, Manager, Team Member)
- Admin-only endpoints for user management
- Project-level access control
- User-scoped data queries

### **Data Protection**
- Input validation with Pydantic schemas
- SQL injection prevention via SQLAlchemy ORM
- File upload validation (type and size)
- Secure file storage with user isolation

### **Best Practices**
- Environment variables for sensitive data
- CORS configuration for allowed origins
- Secure WebSocket connections
- Session management with unique codes

---

## 📈 Development Status

### ✅ **Completed Features** (Phases 0-5)
- [x] Backend API with FastAPI
- [x] Frontend with React + Vite
- [x] User authentication and authorization
- [x] Text translation (Korean ↔ Bengali ↔ English)
- [x] Document translation (PDF/DOCX)
- [x] Document management system
- [x] Translation history and archive
- [x] Glossary management with auto-replacement
- [x] Project management
- [x] Physical meeting sessions
- [x] Real-time WebSocket translation
- [x] Speech-to-text (Web Speech API)
- [x] Text-to-speech (gTTS)
- [x] Admin panel with user management
- [x] Analytics dashboard with charts
- [x] Global search and filtering
- [x] QR code sharing

### 🔜 **Planned Features** (Phases 6-8)
- [ ] Virtual meeting bot (Zoom/Teams integration)
- [ ] Voice Activity Detection for latency optimization
- [ ] Advanced AI insights and sentiment analysis
- [ ] Turn-taking analysis
- [ ] Quality metrics and confidence scoring
- [ ] Full-text search with SQLite FTS
- [ ] Bulk export to PDF
- [ ] Redis caching
- [ ] Production deployment with Docker
- [ ] CI/CD pipeline

---

## 🧪 Testing

### **Manual Testing**
```bash
# Backend health check
curl http://localhost:8000/health

# Test translation endpoint
curl -X POST "http://localhost:8000/api/translate/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "안녕하세요",
    "source_lang": "ko",
    "target_lang": "bn"
  }'
```

### **API Testing**
- Use Swagger UI at `http://localhost:8000/docs`
- Test WebSocket with any WebSocket client
- Use Postman collection (create one for team sharing)

### **Browser Testing**
- Chrome/Edge (recommended for Web Speech API)
- Firefox (limited speech recognition support)
- Safari (limited support)

---

## 🚢 Deployment

### **Development Mode**
Already configured! Just run:
```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend
cd frontend && npm run dev
```

### **Production (Coming Soon)**
Planned deployment options:
- **Docker**: Containerized deployment with docker-compose
- **Railway/Render**: One-click deployment
- **AWS/GCP**: Cloud-native deployment
- **Self-hosted**: VPS with Nginx reverse proxy

### **Environment Variables**
Create `.env` file in backend folder:
```env
SECRET_KEY=your_super_secret_jwt_key_change_this
DATABASE_URL=sqlite:///./korean.db
APP_NAME=KO2BN Translation Platform
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Code Style**
- **Backend**: Follow PEP 8 for Python
- **Frontend**: Use ESLint configuration provided
- **Comments**: Write clear, concise comments for complex logic
- **Commits**: Use conventional commit messages

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - *Initial work*

---

## 🙏 Acknowledgments

- **Deep Translator** - Free Google Translate integration
- **FastAPI** - Modern Python web framework
- **React** - User interface library
- **Web Speech API** - Browser-native speech recognition
- **gTTS** - Google Text-to-Speech library
- **Recharts** - Charting library for React

---

## 📞 Support

For questions, issues, or feature requests:
- **GitHub Issues**: [Create an issue](#)
- **Email**: your.email@example.com
- **Documentation**: See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed development roadmap

---

## 📊 Project Stats

- **Total Files**: 50+
- **Lines of Code**: ~10,000+
- **Languages**: Python, JavaScript, CSS
- **Development Time**: 9 weeks (Phases 0-5)
- **Status**: ✅ Production-ready core features

---

<div align="center">

**Built with ❤️ for Korean-Bangla-English collaboration**

⭐ Star this repo if you find it useful!

[Back to Top](#ko2bn-translation-platform)

</div>
