# GUIDE ME - FINAL

> **Enterprise Multimodal Mental Wellness, Digital Balance, and Personal Guidance Platform**  
> *An eco-friendly, privacy-first, scientifically-grounded clinical companion for holistic vitality.*

---

## 1. GUIDE ME Concept

**GUIDE ME** is an enterprise-grade multimodal wellness and personal guidance ecosystem. It integrates physiological signals, digital screen exposure, cognitive thought patterns, and scientifically validated psychometrics into personalized, explainable, and responsible guidance.

Unlike conventional wellness applications that impose generic population ideals or violate user privacy through dark biometric storage, GUIDE ME adheres to the principle:

```
COLLECT → VALIDATE → NORMALIZE → UNDERSTAND → ANALYZE → ESTIMATE → EXPLAIN → PERSONALIZE → GUIDE
```

---

## 2. Product Objectives

1. **Holistic Vitality**: Bridge emotional well-being, autonomic recovery, and conscious digital engagement into a unified dashboard.
2. **Personal Baseline Sovereignty**: Evaluate stress and mood against the user's historical rolling norms ($z$-score deviation) rather than arbitrary population averages.
3. **Privacy-First In-Memory Processing**: Analyze camera-based facial landmarks and typing dynamics in volatile RAM with zero raw biometric storage.
4. **Cognitive Clarity**: Equip users with automated natural language reflection tools that identify cognitive distortions (such as catastrophizing and all-or-nothing thinking) and offer evidence-based re-framing.
5. **Psychometric Career Alignment**: Map Big Five (OCEAN) personality traits to low-friction career and mastery pathways.
6. **Eco-Friendly Calm Interface**: Provide a peaceful sandstone, sage, and forest palette with dark and light modes, accessible contrast, and low cognitive overhead.

---

## 3. Comprehensive Feature Suite

- **Eco-Friendly Calm UI**: Muted sage green, sandstone, and forest slate palette; dark/light theme toggle; responsive design.
- **AI Wellness Companion**: Empathetic conversational companion with clinical guardrails, context assembly, and transparent long-term memory inspection and deletion.
- **Camera-Based Facial Signals**: Live browser camera integration (`navigator.mediaDevices.getUserMedia()`), in-memory frame analysis, and probabilistic indicators.
- **Big Five (OCEAN) Personality Inventory**: 50-item IPIP assessment, interactive radar/bar charts, and career strength mapping.
- **Cognitive Journaling**: NLP emotion classification, continuous sentiment scoring, cognitive distortion detection, and constructive re-framing.
- **Multimodal Stress & Distress Monitor**: Multi-signal composite scoring, personal baseline deviation tracking, and acute distress event logging with immediate crisis escalation.
- **Wearable Hub & Autonomic Sync**: Heart rate variability (HRV), sleep architecture, resting heart rate, and step count sync supporting BioSensor Simulator, Apple HealthKit, Fitbit, and Google Health Connect.
- **Digital Wellbeing Center**: Screen exposure analytics, deep focus tracking, notification impact, and evening wind-down curfews.
- **Intentional Goals & Milestones**: Interactive habit checklists with real-time progress calculations.
- **Safety Center**: International emergency crisis resources (US/Canada 988, UK 116 123, EU 112, Global findahelpline.com), emergency contacts, and one-click SOS support.
- **Privacy & Sovereignty Center**: Full JSON data export (portability), granular consent toggles, and permanent account erasure.

---

## 4. System Architecture

GUIDE ME is architected as a **modular monolith** with clean service and repository boundaries designed for seamless future microservice extraction:

```
GUIDE ME - FINAL/
├── frontend/                  # React 18 + TypeScript + Vite + Tailwind CSS + Recharts
├── backend/                   # Python 3.13 + FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── app/
│   │   ├── api/v1/            # Versioned domain routers (/auth, /profile, /assessments, etc.)
│   │   ├── core/              # Security, JWT tokens, dual-database manager, config
│   │   ├── models/            # 22+ SQLAlchemy ORM entities
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── repositories/      # Strict IDOR-guarded database queries
│   │   ├── services/          # Business logic layer
│   │   ├── ml/                # Embedded psychometric, NLP, stress & facial engines
│   │   ├── ai/                # AI Companion provider abstraction & safety layer
│   │   └── integrations/      # Wearable provider abstraction (Mock, Apple, Fitbit, Google)
│   └── tests/                 # Automated pytest test suite (Auth, IDOR, ML, Safety)
├── ml/                        # Standalone ML training & normalization pipelines
├── scripts/                   # Git Bash automation scripts (setup, start, test, seed)
├── infrastructure/            # Dockerfiles, Nginx config, docker-compose.yml
├── docs/                      # Extensive architecture, API, security, and research documentation
├── requirements.txt           # Verified root Python dependencies (NO virtualenv)
└── .env.example               # Configuration template
```

---

## 5. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React, Recharts, HTML5 MediaStream & Canvas APIs.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Native Bcrypt, Python-Jose (JWT), Structlog.
- **Database**: PostgreSQL (Production) with automatic SQLite local fallback for zero-friction evaluation.
- **Data Science & ML**: NumPy, Pandas, Scikit-Learn, SciPy, Pillow, OpenCV Headless.
- **DevOps**: Docker, Docker Compose, Nginx Alpine, GitHub Actions CI/CD.

---

## 6. Prerequisites & Environment

- **Operating System**: Windows 10/11 with **Git Bash**.
- **Python**: Python 3.10+ (tested on Python 3.13.15).
- **Node.js**: Node.js v18+ and npm (tested on Node v24.20.0).
- **PostgreSQL (Optional)**: If PostgreSQL is not installed or offline, the system automatically initializes a local SQLite database (`guideme_local.db`).

---

## 7. Mandatory Environment Rule: NO Virtual Environment

> [!IMPORTANT]
> **No Virtual Environment Required or Allowed**:
> As mandated by project requirements, **do NOT create a `venv/`, `.venv/`, or `env/` virtual environment**.
> Dependencies install directly against your existing host Python installation.

Install dependencies directly with:
```bash
pip install -r requirements.txt
```

---

## 8. Quick Start Guide (Windows + Git Bash)

Open **Git Bash** in the project directory:

```bash
cd "GUIDE ME - FINAL"
```

### Step 1: Install Dependencies & Seed Database
```bash
# Run the automated Git Bash setup script:
./scripts/setup.sh
$ git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Vxnavi71/GUIDE-ME---FINAL.git
git push -u origin main
```
*This command verifies Python & Node, installs `requirements.txt`, installs frontend packages, and seeds the database with the Jordan Chen demo archetype.*

### Step 2: Start All Application Services
```bash
./scripts/start_all.sh
```
*This starts both the FastAPI backend and the Vite frontend concurrently in Git Bash.*

Alternatively, start services individually in separate Git Bash tabs:
```bash
# Terminal 1: Backend
./scripts/start_backend.sh

# Terminal 2: Frontend
./scripts/start_frontend.sh
```

### Step 3: Access the Application
- **Web Application**: `http://127.0.0.1:5173`
- **FastAPI Interactive Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc API Documentation**: `http://127.0.0.1:8000/redoc`
- **Health Probe**: `http://127.0.0.1:8000/health`

---

## 9. Demo Account Credentials

You can instantly log in or click **"Load Demo Account (Jordan Chen)"** on the login page:

| Field | Value |
|---|---|
| **Email** | `demo@guideme.com` |
| **Password** | `DemoUser123!` |
| **User Profile** | Jordan Chen (Systems Engineer & Design Thinker) |
| **Pre-Seeded Data** | OCEAN Big Five profile, 7 days of mood & stress observations, sample journals with NLP analyses, goals, and emergency contacts. |

---

## 10. Camera Permission Flow & Facial Analysis

### How It Works
1. Navigate to **Facial Signals** in the sidebar.
2. Click **Enable Camera**. The browser displays a permission prompt via `navigator.mediaDevices.getUserMedia({ video: true })`.
3. The video viewfinder renders a live preview.
4. Frames are captured via HTML5 Canvas in RAM and submitted as Base64 payloads to `/api/v1/facial-analysis/process-frame`.
5. The backend analyzes facial landmark contrast proxies (smile ratio, brow furrow index, eye aperture, head stability) using OpenCV/Pillow.

### Privacy & Biometric Guarantees
- **No Video Recording**: No video feeds or frames are ever written to disk or database tables.
- **Ephemeral RAM Processing**: The frame payload is discarded immediately after landmark metrics are extracted.
- **Revoking Permission**: Click **Stop Camera** anytime, or revoke camera permission in your browser address bar.
- **Probabilistic Wording**: The platform states: *"Facial expression signals are superficial muscular proxies and do not prove internal emotional states or clinical conditions."*

---

## 11. Multimodal Stress & Personal Baseline Engine

Instead of comparing the user against generic population distributions, GUIDE ME computes personal rolling averages ($z$-scores):

$$z = \frac{X - \mu_{14}}{\sigma_{14}}$$

Where:
- $X$ is the composite multimodal stress score (combining self-reported mood, HRV, sleep deficit, screen time, and text sentiment).
- $\mu_{14}$ and $\sigma_{14}$ are the user's personal 14-day rolling mean and standard deviation.

Risk bands are calibrated:
- **Low**: 0 – 29
- **Moderate**: 30 – 59
- **Elevated**: 60 – 79
- **Critical**: 80 – 100

---

## 12. AI Companion & Memory Transparency

1. **Context Fusion**: The companion synthesizes user profile data, Big Five traits, today's mood, active goals, and user-consented memories into a personalized prompt.
2. **Provider Abstraction**: Operates offline out-of-the-box via `MockLLMProvider` (clinical heuristic agent). If `OPENAI_API_KEY` is provided in `.env`, it seamlessly delegates to OpenAI GPT-4o models.
3. **Memory Inspector**: Switch to the **Memories** tab to inspect every fact or preference the AI has remembered, along with confidence scores. Users can permanently delete individual memories anytime.
4. **Clinical Safety Guardrail**: If acute crisis keywords (e.g. self-harm or suicidal ideation) are detected, the system immediately suspends normal dialogue and provides 24/7 crisis lifelines (988 Lifeline, Crisis Text Line 741741, and international helpline directories).

---

## 13. Running Automated Tests

Run the full automated test suite using Git Bash:

```bash
./scripts/test.sh
```

This script executes:
1. **Backend Tests (`pytest`)**: Verifies health endpoints, password hashing, Big Five OCEAN scoring, NLP sentiment and distortion detection, stress calculation, safety guardrails, and IDOR resource protection.
2. **Frontend Build (`tsc -b && vite build`)**: Verifies TypeScript compilation and creates the production distribution.

---

## 14. Docker Deployment (Optional)

GUIDE ME can also be run inside isolated Docker containers:

```bash
# Build and start PostgreSQL, Backend, and Frontend containers:
docker-compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 15. Security & IDOR Defense

- **Strict User Scoping**: Repositories filter every query by `user_id == current_user.id`. Users cannot view or modify each other's journal entries, memories, or wellness logs.
- **Zero Hash Leakage**: Password hashes are stripped from all API responses via Pydantic model configurations.
- **Audit Trails**: All authentication events, consent adjustments, and safety triggers are immutably logged in the `audit_logs` table.

---

## 16. Research & Clinical Disclaimers

> [!NOTE]
> **Responsible AI Notice**:
> GUIDE ME is designed for educational self-awareness, lifestyle balance, and preventative mindfulness. It is **not a diagnostic medical device** and does not provide psychiatric diagnoses or medical treatments. If you are experiencing a mental health emergency, please contact 988 (US/Canada), 116 123 (UK), 112 (EU), or visit [findahelpline.com](https://findahelpline.com).

---

## 17. License

Distributed under the **MIT License**. See `LICENSE` for details.
