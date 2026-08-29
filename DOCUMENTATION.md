# AI Adaptive Study Buddy — Complete Technical Documentation

> Version 1.0 | Full-Stack AI Adaptive Learning Platform

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Product Idea & Solution Approach](#2-product-idea--solution-approach)
3. [Core Innovation — The Adaptive Loop](#3-core-innovation--the-adaptive-loop)
4. [Architecture Overview](#4-architecture-overview)
5. [AI Agent Architecture](#5-ai-agent-architecture)
6. [RAG System (Retrieval-Augmented Generation)](#6-rag-system)
7. [Database Design](#7-database-design)
8. [Backend Implementation](#8-backend-implementation)
9. [Frontend Implementation](#9-frontend-implementation)
10. [Authentication & Security](#10-authentication--security)
11. [Mastery Calculation System](#11-mastery-calculation-system)
12. [Adaptive Learning Engine](#12-adaptive-learning-engine)
13. [API Reference](#13-api-reference)
14. [Testing](#14-testing)
15. [Deployment](#15-deployment)
16. [Known Limitations](#16-known-limitations)
17. [Future Roadmap](#17-future-roadmap)
18. [Tech Stack Summary](#18-tech-stack-summary)

---

## 1. Problem Statement

### The One-Size-Fits-All Learning Crisis

Traditional study systems — textbooks, video courses, even most edtech platforms — deliver the same content to every student in the same order at the same pace. This model fundamentally ignores four critical realities:

**Students differ in what they already know.**
A student who already understands Object-Oriented Programming should not spend three days on it. A student who struggles with recursion needs it explained multiple ways — not just once — before moving on.

**Students differ in how fast they learn.**
Some students need two exposures to a concept to master it. Others need ten. A rigid curriculum cannot accommodate this.

**Students differ in where their specific weaknesses lie.**
Two students can score 60% on the same exam but have completely different weak topics. Recommending the same revision material to both is inefficient.

**Students differ in their constraints.**
Exam in three days vs. three months. Thirty minutes per day vs. four hours. These constraints must shape the study plan, not be ignored by it.

### The Result

Students waste enormous time reviewing material they already know, while their actual knowledge gaps remain unaddressed. They finish a course, feel like they studied, and still fail the exam — because the system never measured what they individually needed.

---

## 2. Product Idea & Solution Approach

### The Concept

Build an AI-powered study companion that behaves like an intelligent personal teacher — one that:

1. **Understands** what the student needs to learn (from uploaded material)
2. **Measures** what the student already knows (diagnostic assessment)
3. **Personalizes** the learning path (adaptive study plan)
4. **Teaches** at the right level (AI tutor with explanation modes)
5. **Tests** understanding (adaptive quizzes)
6. **Evaluates** results (mastery engine)
7. **Identifies weaknesses** (weakness detection)
8. **Adapts** the plan (adaptive agent)
9. **Repeats** the cycle

### The Student Journey

```
Register → Create Course → Upload Syllabus/Notes
→ AI Analyzes Material → Topics Generated
→ Take Diagnostic Assessment → AI Identifies Knowledge Gaps
→ Personalized Study Plan Created
→ Open Topic → Use AI Tutor → Ask Questions
→ Generate Practice Quiz → Submit Answers
→ Receive Results + Explanations
→ Mistakes Stored → Mastery Updated
→ Weakness Detected → Adaptive Agent Makes Decision
→ Study Plan Changes → Student Performs Recommended Activity
→ Take Another Quiz → Mastery Changes → Continue
```

Every step in this journey is real and functional. No hardcoded responses, no fake analytics, no static recommendations.

---

## 3. Core Innovation — The Adaptive Loop

This is what differentiates AI Study Buddy from a regular AI chatbot.

### The Adaptive Intelligence Loop

```
Student Performance
        ↓
Mastery Engine (deterministic calculation)
  - Quiz score contribution
  - Topic-level performance
  - Recent vs old scores (recency weighting)
  - Mistake frequency penalty
        ↓
Weakness Detection (AI analysis)
  - Identifies patterns in mistakes
  - Ranks topics by urgency
  - Classifies: critical / needs_attention / developing
        ↓
Adaptive Agent (AI decision)
  - Receives full student context
  - Returns structured action recommendation
  - Actions: RETEACH, PRACTICE, REVISE, REVIEW_MISTAKES,
             INCREASE_DIFFICULTY, DECREASE_DIFFICULTY,
             MOVE_TO_NEXT_TOPIC, TAKE_ASSESSMENT
        ↓
Study Plan Update (backend applies it)
  - New tasks injected into the plan
  - Priority of weak topics increased
  - Difficulty of future quizzes adjusted
  - Historical tasks preserved
        ↓
Student follows the updated path
```

### Why This Matters

**The study plan actually changes based on your performance.** If you fail three quizzes on recursion, the system:
- Detects the pattern
- Classifies it as "critical"
- Recommends "RETEACH"
- Adds easier practice tasks to your plan
- Schedules a follow-up quiz
- Reduces difficulty until mastery improves

This is not a simulation. The database records change. The displayed plan changes. Future quizzes adjust.

### Hybrid Architecture Principle

A critical design decision: **the LLM interprets, the backend calculates.**

| Responsibility | Who Does It |
|---|---|
| Calculate quiz score percentage | Backend (deterministic math) |
| Calculate mastery score | Backend (weighted formula) |
| Identify which topics are weak | Backend (threshold comparison) |
| Decide *why* the student is struggling | AI (pattern interpretation) |
| Decide *what* should happen next | AI (adaptive agent) |
| Apply the decision to the database | Backend (validates + executes) |

The LLM never directly writes to the database. The backend always validates AI output with Pydantic schemas before applying it.

---

## 4. Architecture Overview

```
Browser (React + TypeScript)
          |
          | HTTP (JSON)
          ↓
FastAPI (Python 3.11)
    |          |
    |          ↓
    |      OpenAI API
    |      (AI Agents + Embeddings)
    |          |
    |          ↓
    |      RAG Retrieval
    |      (cosine similarity)
    |
    ↓
MySQL 8 (primary database)
  - All relational data
  - Document chunks + embeddings (JSON)
  - Mastery history
  - Conversations
```

### Service Layer Architecture

```
HTTP Request
    ↓
Route Handler (FastAPI)
    ↓
Service Layer (business logic)
    ↓
Repository / ORM (SQLAlchemy)
    ↓
MySQL Database

AI Requests:
Service Layer
    ↓
AI Agent
    ↓
OpenAI Service (centralized client)
    ↓
OpenAI API
```

---

## 5. AI Agent Architecture

The system uses six specialized AI agents, each with a focused responsibility. This prevents any single prompt from becoming bloated and unmaintainable.

### Agent 1: Course Analyzer (`course_analyzer.py`)

**Input:** Raw text extracted from uploaded documents (PDF/TXT/DOCX)

**Output:** Structured course outline with:
- Main topics
- Subtopics per topic
- Difficulty level (easy/medium/hard)
- Prerequisites (which topics must come first)
- Learning objectives
- Key concepts

**Why it matters:** Topics are not hardcoded. The AI extracts them from the student's actual material. A Python course and a History course will produce completely different topic structures.

**Validation:** Output validated with Pydantic `CourseAnalysisResult` schema. If the AI returns malformed data, the error is caught and the course is marked as `error` status.

---

### Agent 2: Assessment Agent (`assessment_agent.py`)

**Input:** List of course topics with descriptions

**Output:** A set of diagnostic questions (MCQ, True/False, Short Answer) covering all topics at mixed difficulty levels.

**Why it matters:** The initial assessment determines the starting point for every student. Two students starting the same course can have completely different initial mastery profiles.

**Question types generated:**
- `mcq` — 4 options, one correct, with explanation
- `true_false` — Boolean with explanation
- `short_answer` — Open answer, evaluated by AI

---

### Agent 3: Study Planner Agent (`study_planner.py`)

**Input:**
- Student profile (exam date, daily time, learning goal, skill level)
- Course topics with current mastery scores
- Assessment results
- Weak topic list

**Output:** A complete study plan with dated tasks, priorities, durations, and activity types.

**Why it matters:** Weak topics get more tasks. Strong topics get fewer. Topics with prerequisites are scheduled after their dependencies. The exam date determines how aggressive the pace is.

**Task types generated:**
- `learn` — First exposure to a topic
- `practice` — Active practice after learning
- `quiz` — Formal assessment
- `revise` — Revisit previously learned material
- `review_mistakes` — Go through past errors

---

### Agent 4: AI Tutor Agent (`tutor_agent.py`)

**Input:**
- Student question
- Student profile (learning goal, skill level, preferences)
- Course name and current topic
- Explanation mode selected
- Relevant document chunks (from RAG)
- Recent topic mastery
- Conversation history

**Output:** A contextual, personalized explanation

**Explanation modes:**
| Mode | Behavior |
|---|---|
| `simple` | Very simple language, analogies, no jargon |
| `beginner` | Assumes limited prior knowledge, builds from basics |
| `detailed` | Technical, comprehensive explanation |
| `exam` | Focus on exam-relevant points, common mistakes |
| `interview` | Interview-style framing |
| `examples` | Teach through practical code or real-world examples |

**RAG integration:** When relevant document chunks are found, they are injected into the prompt. The tutor is instructed to prioritize them and clearly note if an answer uses general knowledge instead.

---

### Agent 5: Quiz Agent (`quiz_agent.py`)

**Input:**
- Topic name
- Target difficulty
- Student's current mastery score
- Question types requested
- Number of questions
- Course context (from RAG)

**Output:** Validated list of quiz questions with correct answers and explanations

**Short-answer evaluation:** Uses a separate AI call to evaluate open-ended answers. Returns:
- Score (0.0 – 1.0)
- Missing concepts
- Feedback
- Improvement suggestion

---

### Agent 6: Adaptive Agent (`adaptive_agent.py`)

**Input:**
- Full student context
- Current topic
- Current mastery score
- Recent quiz results
- Mistake patterns
- Study history
- Exam deadline

**Output:** Structured recommendation:
```json
{
  "action": "RETEACH",
  "topic": "Recursion",
  "reason": "Student has repeated errors in recursive base cases.",
  "difficulty": "easy",
  "recommended_duration": 20,
  "specific_focus": "Base case identification"
}
```

**Actions available:**
| Action | Trigger Condition |
|---|---|
| `RETEACH` | Mastery < 30% or 3+ mistakes on same concept |
| `PRACTICE` | Mastery 30–50%, no consistent mistakes |
| `REVISE` | Mastery 50–70%, hasn't studied recently |
| `REVIEW_MISTAKES` | Multiple unresolved mistakes |
| `INCREASE_DIFFICULTY` | Mastery > 70%, recent quizzes all correct |
| `DECREASE_DIFFICULTY` | Quiz score consistently low |
| `MOVE_TO_NEXT_TOPIC` | Mastery > 85% |
| `TAKE_ASSESSMENT` | Completed study plan cycle |

---

## 6. RAG System

Retrieval-Augmented Generation allows the AI tutor to answer questions based on the student's own uploaded material.

### Pipeline

```
1. Document Upload
   → Validate (type, size, content)
   → Store file on disk

2. Text Extraction
   → PDF: PyPDF2 page-by-page
   → TXT: direct read
   → DOCX: python-docx

3. Chunking
   → Split by ~800 character windows
   → 100 character overlap between chunks
   → Token count estimation

4. Embedding Generation
   → Each chunk → OpenAI text-embedding-3-small
   → Returns 1536-dimension float vector
   → Stored as JSON string in MySQL

5. At Query Time
   → Query embedded with same model
   → Cosine similarity computed in Python (numpy)
   → Top-K most similar chunks retrieved
   → Injected into AI tutor context
```

### Retrieval Service (`retrieval.py`)

The `RetrievalService` class is fully isolated from the rest of the system. To replace cosine similarity with a dedicated vector database (Pinecone, Weaviate, pgvector), only this file needs to change.

### Source Attribution

The tutor prompt explicitly instructs the AI to:
1. Prioritize retrieved course chunks over general knowledge
2. Note when it is using the student's material
3. Clearly state when it is using general knowledge
4. Never invent citations or pretend information came from documents

---

## 7. Database Design

**Primary database: MySQL 8+**
**ORM: SQLAlchemy**
**Migrations: Alembic**

### Entity Relationship Summary

```
users (1) ──── (1) student_profiles
users (1) ──── (N) courses

courses (1) ──── (N) documents
documents (1) ──── (N) document_chunks

courses (1) ──── (N) topics
topics (1) ──── (N) subtopics

courses (1) ──── (N) assessments
assessments (1) ──── (N) questions (assessment_questions)

courses (1) ──── (N) quizzes
quizzes (1) ──── (N) questions (quiz_questions)

courses (1) ──── (N) quiz_attempts
quiz_attempts (1) ──── (N) answers

courses (1) ──── (N) study_plans
study_plans (1) ──── (N) study_tasks

courses (1) ──── (N) topic_masteries
topic_masteries (1) ──── (N) mastery_history

courses (1) ──── (N) mistakes
courses (1) ──── (N) study_sessions
courses (1) ──── (N) ai_conversations
ai_conversations (1) ──── (N) ai_messages
```

### Key Design Decisions

**All course-owned entities use `CASCADE DELETE`** — when a course is deleted, all its documents, topics, quizzes, mastery records, conversations, and mistakes are automatically removed. Files on disk are also cleaned up.

**Mastery history is preserved** — when mastery updates, the old value is stored in `mastery_history`. This enables trend analysis and improvement tracking.

**Embeddings stored as JSON text in MySQL** — This avoids the need for a separate vector database while remaining functional. The retrieval layer is modular and can be upgraded to pgvector or a dedicated vector DB.

**Conversation context is limited** — Only the last N messages are sent to OpenAI. The full history is stored in MySQL but not all of it is sent per request, controlling costs.

---

## 8. Backend Implementation

### Technology

| Component | Technology |
|---|---|
| Web framework | FastAPI 0.115 |
| ASGI server | Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database driver | PyMySQL |
| Validation | Pydantic v2 |
| AI SDK | OpenAI Python SDK |
| PDF processing | PyPDF2 |
| DOCX processing | python-docx |
| Password hashing | bcrypt 4.0.1 + passlib |
| Authentication | python-jose (JWT) |

### Project Structure

```
backend/app/
├── main.py              # FastAPI app, CORS, router registration
├── core/
│   ├── config.py        # Environment variables (Pydantic Settings)
│   ├── database.py      # SQLAlchemy engine + session factory
│   ├── security.py      # JWT creation/verification, bcrypt hashing
│   └── deps.py          # FastAPI dependency injection (get_current_user)
├── models/              # 13 SQLAlchemy ORM models
├── schemas/             # Pydantic request/response schemas
├── services/            # Business logic (9 service classes)
├── api/routes/          # 11 FastAPI route modules
├── ai/
│   ├── openai_service.py    # Centralized OpenAI client
│   ├── agents/              # 6 AI agent classes
│   ├── prompts/             # All prompt templates
│   └── rag/                 # RetrievalService
└── utils/
    └── document_processor.py  # PDF/TXT/DOCX text extraction
```

### OpenAI Service

All OpenAI calls are routed through a single `OpenAIService` class:

```python
class OpenAIService:
    def chat_completion(messages, temperature) -> str
    def chat_completion_json(messages, temperature) -> dict
    def create_embedding(text) -> list[float]
```

This centralizes:
- Error handling (timeout, rate limit, API errors)
- Retry logic
- Cost control (context length limits)
- Configuration (model, base URL)

**No OpenAI calls are made directly from route handlers.**

### AI Prompt Management

All prompts live in `app/ai/prompts/__init__.py` as module-level string constants. They use Python's `.format()` for variable injection. JSON template sections use `{{` and `}}` to escape literal braces.

This design:
- Makes prompts easy to find and update
- Keeps prompts separate from business logic
- Allows systematic prompt versioning

---

## 9. Frontend Implementation

### Technology

| Component | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Routing | React Router v7 |
| HTTP client | Axios |
| Charts | Recharts |
| PostCSS | @tailwindcss/postcss |

### Design System

All design tokens are CSS custom properties defined in `index.css`:

```css
:root {
  --bg-primary: #0a0f1e;
  --bg-secondary: #0f1629;
  --bg-card: #131d35;
  --accent-blue: #4f8ef7;
  --accent-purple: #8b5cf6;
  --accent-cyan: #22d3ee;
  --accent-green: #10b981;
  --text-primary: #f0f4ff;
  --text-secondary: #8899bb;
  /* ... */
}
```

Components use inline styles referencing these variables. This approach:
- Works reliably with Tailwind v4's new compiler
- Avoids class name conflicts
- Keeps the dark theme consistent everywhere

### Key Components

| Component | Description |
|---|---|
| `Layout.tsx` | Sidebar navigation, user section, mobile bottom nav |
| `LandingPage.tsx` | Marketing landing page (public route) |
| `DashboardPage.tsx` | Overview with stats, AI recommendation, today's tasks |
| `CourseDetailPage.tsx` | Documents, actions, topic list |
| `AssessmentPage.tsx` | Diagnostic quiz with MCQ/TF/short-answer |
| `TutorPage.tsx` | Chat interface with RAG source indicator, markdown rendering |
| `QuizPage.tsx` | Adaptive quiz + AI Learning Status result card |
| `StudyPlanPage.tsx` | Task list with color-coded activities |
| `ProgressPage.tsx` | Mastery bars, quiz history chart, radar chart |
| `MistakesPage.tsx` | Error review with answer comparison |
| `ProfilePage.tsx` | Account settings (name/password) + learning preferences |

### Markdown Rendering

The AI tutor responses include markdown formatting. The `parseMarkdown()` utility in `utils/helpers.ts` converts:
- `**bold**` → `<strong>` (rendered blue)
- `` `code` `` → `<code>` (styled monospace)
- ```` ```code block``` ```` → `<pre><code>` (dark background)
- `- list items` → `<ul><li>`
- `### headers` → `<h3>`

This gives structured, readable AI responses without a heavy markdown library dependency.

---

## 10. Authentication & Security

### Registration / Login

1. User registers with email, password (min 6 chars), full name
2. Password hashed with bcrypt (cost factor 12, via passlib)
3. JWT token issued (configurable expiry, default 7 days)
4. Token stored in `localStorage` on the client

### Authorization

Every protected endpoint:
```python
@router.get("/endpoint")
def handler(current_user: User = Depends(get_current_user)):
    # current_user is always the authenticated user
    # All queries are filtered by current_user.id
```

A user cannot access another user's courses, documents, quizzes, or data — ownership is checked at the service layer, not just the route.

### File Security

Uploaded files:
- Extension whitelist: `.pdf`, `.txt`, `.docx`
- Max size: 20MB
- Filename sanitized (UUID-based storage name, original name stored in DB)
- Stored under `uploads/{course_id}/{uuid}.ext`
- Deleted when course is deleted

---

## 11. Mastery Calculation System

Mastery scores (0–100) are calculated deterministically by the `MasteryService`. The LLM does not set mastery scores.

### Calculation Formula

```python
def calculate_mastery(topic_id, user_id, db):
    # 1. Get all quiz attempts for this topic
    recent_scores = get_recent_quiz_scores(topic_id, user_id)

    # 2. Apply recency weighting (recent attempts matter more)
    weighted_score = weighted_average(recent_scores, decay=0.8)

    # 3. Apply assessment contribution
    assessment_score = get_assessment_score_for_topic(topic_id)

    # 4. Calculate mistake penalty
    mistake_freq = get_mistake_frequency(topic_id, user_id)
    penalty = min(mistake_freq * 3, 15)  # max 15 point penalty

    # 5. Combined score
    mastery = (weighted_score * 0.7) + (assessment_score * 0.3) - penalty
    return clamp(mastery, 0, 100)
```

### Mastery Levels

| Range | Level | Adaptive Action |
|---|---|---|
| 0–30 | Critical | RETEACH |
| 31–50 | Needs Attention | PRACTICE or REVIEW_MISTAKES |
| 51–70 | Developing | PRACTICE or REVISE |
| 71–85 | Good | INCREASE_DIFFICULTY |
| 86–100 | Mastered | MOVE_TO_NEXT_TOPIC |

### Course Overall Mastery

Calculated as the average of all topic mastery scores for that course, weighted by topic difficulty.

---

## 12. Adaptive Learning Engine

### Trigger Points

The adaptive engine is triggered:
1. After every quiz submission
2. After assessment completion
3. When the student requests a recommendation
4. When generating/regenerating a study plan

### Study Plan Update Logic

When the adaptive agent returns `RETEACH` for Topic X:

1. New `learn` task added with priority 1 (highest) for Topic X
2. New `practice` tasks added with `easy` difficulty
3. Existing future `quiz` tasks for Topic X have difficulty downgraded to `easy`
4. New `review_mistakes` task added if unresolved mistakes exist
5. Historical tasks (completed, in_progress) are never deleted

When the adaptive agent returns `INCREASE_DIFFICULTY`:
1. Future quiz tasks for Topic X have difficulty upgraded
2. Next topic's `learn` task is scheduled sooner

### Recommendation Cards

The dashboard shows a personalized recommendation generated by the `RecommendationAgent`. The recommendation:
- Reads current mastery, recent quiz scores, study history
- Returns a title, description, action type, topic, urgency
- Is cached until performance data changes (no regeneration on every page load)

---

## 13. API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update name / password |
| GET | `/api/users/me/profile` | Get learning preferences |
| PUT | `/api/users/me/profile` | Update learning preferences |

### Courses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List user's courses |
| POST | `/api/courses` | Create course |
| GET | `/api/courses/{id}` | Get course detail |
| PUT | `/api/courses/{id}` | Update course |
| DELETE | `/api/courses/{id}` | Delete course + all data |
| POST | `/api/courses/{id}/analyze` | Run AI course analysis |
| GET | `/api/courses/{id}/topics` | Get topics |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/courses/{id}/documents` | Upload document |
| GET | `/api/courses/{id}/documents` | List documents |
| DELETE | `/api/courses/documents/{id}` | Delete document |

### Assessment
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses/{id}/assessment` | Get existing assessment |
| POST | `/api/courses/{id}/assessment` | Create diagnostic assessment |
| POST | `/api/courses/{id}/assessment/{aid}/submit` | Submit answers |

### Quizzes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quizzes/generate` | Generate adaptive quiz |
| GET | `/api/quizzes/{id}` | Get quiz |
| POST | `/api/quizzes/{id}/submit` | Submit quiz answers |

### AI Tutor
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tutor/chat` | Send message, get AI response |
| GET | `/api/tutor/conversations` | List conversations |

### Study Plan
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/study-plan/{course_id}` | Get study plan |
| POST | `/api/study-plan/{course_id}/generate` | Generate/regenerate plan |
| PATCH | `/api/study-plan/tasks/{id}` | Update task status |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress/{course_id}` | Get full progress data |
| GET | `/api/courses/{id}/mastery` | Get topic mastery scores |

### Mistakes & Adaptive
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/mistakes/{course_id}` | List mistakes |
| PATCH | `/api/mistakes/{id}/resolve` | Mark resolved |
| POST | `/api/adaptive/recommend` | Get AI recommendation |
| POST | `/api/adaptive/apply` | Apply recommendation to plan |

---

## 14. Testing

### Test Stack

- **Framework:** pytest
- **Database:** SQLite (in-memory, no MySQL required for tests)
- **AI mocking:** `unittest.mock.patch` on `OpenAIService`
- **HTTP testing:** FastAPI `TestClient`

### Test Coverage

| File | What It Tests |
|---|---|
| `test_auth.py` | Register, login, duplicate email, invalid credentials |
| `test_courses.py` | Create, list, get, delete, unauthorized access |
| `test_mastery.py` | Mastery calculation, quiz score contribution, mistake penalty |

### Running Tests

```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

### Test Design Principles

- All AI calls are mocked — tests never hit the OpenAI API
- Each test creates its own isolated user and course
- Tests verify authorization: user A cannot see user B's data
- Mastery tests verify the deterministic calculation independently of AI

---

## 15. Deployment

### Docker Compose

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ai_study_buddy
      MYSQL_ROOT_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend
    depends_on: [mysql]
    environment:
      DATABASE_URL: mysql+pymysql://root:${MYSQL_PASSWORD}@mysql:3306/ai_study_buddy
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on: [backend]
```

### Production Considerations

- Run Alembic migrations on startup: `alembic upgrade head`
- Use a process manager like Supervisor or systemd for Uvicorn
- Set `JWT_SECRET` to a strong random value (min 32 chars)
- Configure CORS to only allow your production frontend domain
- Use environment-specific `.env` files — never commit secrets
- Back up MySQL volumes regularly
- Consider rate limiting on AI endpoints to control OpenAI costs

---

## 16. Known Limitations

### Current Limitations

**Vector Search:** Embeddings are stored as JSON strings in MySQL and similarity is computed in Python. This works for small-to-medium document collections but does not scale to thousands of documents efficiently. A production deployment should use pgvector or a dedicated vector database.

**Short-Answer Grading Accuracy:** AI-based evaluation of short answers is good but imperfect. Edge cases with unusual phrasing or language variations may be scored incorrectly.

**Concurrent Analysis:** Course analysis is synchronous (runs in the request thread). For large documents, this can cause the HTTP request to time out. Background task processing (Celery, FastAPI BackgroundTasks) should be used in production.

**Mobile UI:** The layout is responsive with a mobile bottom nav, but the quiz and tutor pages are optimized for desktop.

**No Email Verification:** The registration flow does not require email verification. In production, this should be added.

---

## 17. Future Roadmap

### Phase 2 — Enhanced Learning Intelligence

- **Spaced Repetition Algorithm (SM-2):** Schedule review tasks based on forgetting curves, not just recency
- **Learning Velocity Tracking:** Detect if a student is improving or declining over time
- **Topic Dependency Graph UI:** Visualize course structure as an interactive knowledge graph
- **Confidence Calibration:** Ask students to rate their confidence before each quiz and track over/under-confidence

### Phase 3 — Content & Format

- **Video Transcript Processing:** Process YouTube lecture transcripts as course material
- **Auto-Generated Flashcards:** Create Anki-style flashcards from key concepts
- **Note Export:** Export study notes, flashcards, and summaries as PDF
- **Live Quiz Mode:** Timed, exam-style assessments with countdown

### Phase 4 — Scale & Social

- **Instructor Dashboard:** Teachers can create courses and monitor class progress
- **Collaborative Learning:** Shared courses with peer comparison (anonymized)
- **Multi-Language Support:** Non-English course material support
- **Mobile App:** React Native version

### Phase 5 — Infrastructure

- **Dedicated Vector Database:** Migrate from MySQL JSON embeddings to Pinecone or Weaviate
- **Background Processing:** Celery workers for document processing and AI analysis
- **Streaming AI Responses:** Stream tutor responses token-by-token for better UX
- **Usage Analytics:** Track AI token consumption per user for billing/limiting
- **Multi-Model Support:** Allow users to choose their AI model

---

## 18. Tech Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 18 | UI |
| Frontend Language | TypeScript | 5 | Type safety |
| Build Tool | Vite | 8 | Fast HMR + bundling |
| CSS | Tailwind CSS | 4 | Utility classes |
| Router | React Router | 7 | SPA routing |
| Charts | Recharts | 2 | Data visualization |
| HTTP Client | Axios | 1.x | API requests |
| Backend Framework | FastAPI | 0.115 | REST API |
| Backend Language | Python | 3.11+ | Server logic |
| ASGI Server | Uvicorn | 0.30 | HTTP server |
| ORM | SQLAlchemy | 2.0 | Database access |
| Migrations | Alembic | 1.13 | Schema versioning |
| Database | MySQL | 8.0+ | Primary data store |
| DB Driver | PyMySQL | 1.1 | MySQL connector |
| AI SDK | OpenAI | 1.x | LLM + embeddings |
| Auth | python-jose | 3.3 | JWT tokens |
| Passwords | passlib + bcrypt | 4.0.1 | Password hashing |
| PDF | PyPDF2 | 3.x | Text extraction |
| DOCX | python-docx | 1.x | Word doc parsing |
| Testing | pytest | 8.x | Test runner |
| Containers | Docker + Compose | 24+ | Deployment |

---

## License

MIT License — see `LICENSE` file for details.

---

*Built as a hackathon project demonstrating the full potential of AI-adaptive learning systems.*
