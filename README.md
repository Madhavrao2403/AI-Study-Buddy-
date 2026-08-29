# AI Study Buddy

> **"Most AI study tools answer questions. AI Study Buddy learns from your performance and continuously changes how it teaches you."**

An AI-powered personalized learning platform that acts as an intelligent study companion. The system measures what you know, teaches what you don't, tests your understanding, identifies weaknesses, and adapts the learning plan based on real performance — not a static chatbot.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8+
- OpenAI API key (or compatible local model)

### 1. Clone and Configure

```bash
git clone https://github.com/your-username/study-buddy-ai.git
cd study-buddy-ai

# Copy environment template
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/ai_study_buddy
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
# Optional: use a local LLM proxy
# OPENAI_BASE_URL=http://127.0.0.1:31415/v1
```

### 2. Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

# Create the database
mysql -u root -p -e "CREATE DATABASE ai_study_buddy;"

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### 4. Docker (all-in-one)

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_MODEL` | ✅ | Model name (e.g. `gpt-4o-mini`) |
| `OPENAI_EMBEDDING_MODEL` | ✅ | Embedding model |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `CORS_ORIGINS` | ✅ | Allowed frontend origin |
| `OPENAI_BASE_URL` | ❌ | Custom LLM endpoint (local models) |

---

## 🧪 Testing

```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 📁 Project Structure

```
study-buddy-ai/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── ai/               # AI agents, prompts, RAG
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── core/             # Config, DB, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Business logic layer
│   ├── alembic/              # Database migrations
│   ├── tests/                # pytest test suite
│   └── requirements.txt
├── frontend/                 # React + TypeScript frontend
│   └── src/
│       ├── pages/            # All page components
│       ├── components/       # Reusable UI components
│       ├── services/         # API client
│       ├── context/          # Auth context
│       └── types/            # TypeScript interfaces
├── docker-compose.yml
├── .env.example
└── DOCUMENTATION.md          # Full technical documentation
```

---

## ✨ Key Features

- 🧠 **AI Course Analyzer** — Extracts topics, subtopics, prerequisites from uploaded documents
- 📊 **Diagnostic Assessment** — Measures existing knowledge before teaching
- 🗺️ **Personalized Study Plan** — Dynamic schedule based on mastery + exam deadline
- 🤖 **AI Tutor with RAG** — Answers from your own uploaded material
- 🧪 **Adaptive Quiz Engine** — Difficulty auto-adjusts based on real mastery
- 🔄 **Adaptive Learning Loop** — Core innovation: plan changes when performance changes
- ❌ **Mistake Review** — Tracks errors, detects repeated patterns
- 📈 **Progress Analytics** — Mastery trends, quiz history, weakness radar

---

## 📖 Full Documentation

See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the complete technical and product documentation.
