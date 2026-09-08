# COMPLETE TECHNICAL CONTEXT & SYSTEM ARCHITECTURE DOCUMENT
# PROJECT: GUIDE ME (ENTERPRISE MULTIMODAL MENTAL WELLNESS PLATFORM)

> **Document Classification**: Definitive System Architecture, Codebase Audit & AI Pair-Programming Context  
> **Source Repository**: `GUIDE ME - FINAL`  
> **Generation Timestamp**: 2026-09-07  
> **Verification Status**: Codebase Verified (Tests passing: 9/9 backend core tests, 5/5 AI companion tests; Frontend production build verified: Vite 8 + React 19)  
> **Accuracy Rule**: Code is the sole source of truth. All documented behaviors, endpoints, schemas, and configurations reflect actual source code. Discrepancies with legacy documentation or README claims are explicitly identified.

---

## 1. PROJECT OVERVIEW

### 1.1 Project Identity & Purpose
- **Project Name**: GUIDE ME (`GUIDE ME - FINAL`)
- **Core Mission**: An enterprise-grade, privacy-first, multimodal mental wellness, autonomic recovery, and personalized career guidance platform.
- **Problem Statement**:
  1. Conventional mental wellness applications compare individual biometrics and emotional fluctuations to arbitrary population averages rather than an individual's personal rolling historical baseline.
  2. Mainstream platforms frequently harvest, serialize, and monetize sensitive biometric data (such as facial video streams, voice samples, and typing cadences).
  3. Digital overload, prolonged screen exposure, and fragmented sleep architecture are rarely unified with cognitive thought distortion analysis and actionable habit tracking.
  4. Mental health advice in generative AI companions often lacks clinical safety guardrails, transparent memory governance, or explicit confirmation barriers for destructive actions.
- **Architectural Paradigm**:
  $$\text{COLLECT} \rightarrow \text{VALIDATE} \rightarrow \text{NORMALIZE} \rightarrow \text{UNDERSTAND} \rightarrow \text{ANALYZE} \rightarrow \text{ESTIMATE} \rightarrow \text{EXPLAIN} \rightarrow \text{PERSONALIZE} \rightarrow \text{GUIDE}$$

### 1.2 Target Users & Primary Use Cases
- **Target Audience**: Individuals seeking mindful digital balance, cognitive thought reflection, stress self-regulation, sleep optimization, and psychometrically-aligned career trajectory planning.
- **Primary Use Cases**:
  1. **Daily Cognitive Journaling**: Writing reflections analyzed in real-time for emotional valence and 5 clinical cognitive distortions (Catastrophizing, All-or-Nothing thinking, Emotional Reasoning, Overgeneralization, Should/Must statements).
  2. **Personal Baseline Stress Tracking**: Evaluating composite autonomic stress (0–100) and $z$-score deviation ($\sigma$) against the user's personal 14-day rolling historical norm.
  3. **AI Wellness Companion with Tool Execution**: Chatting with an AI companion capable of creating goals, completing habits, querying wellness telemetry, and pausing for destructive action confirmation (e.g., deleting goals/habits).
  4. **Big Five (OCEAN) Psychometrics**: Completing a 50-item IPIP personality inventory to discover trait facets and mapped professional strength trajectories.
  5. **In-Memory Facial Signal Proxying**: Live camera landmark analysis (smile ratio, brow furrow index, eye aperture, head stability) processed strictly in volatile RAM without saving video or image bytes.
  6. **Digital Wellbeing & Curfew Tracking**: Monitoring screen time, notification counts, pickup frequencies, and focus sessions against configurable daily targets.
  7. **Safety & Crisis De-escalation**: Immediate one-click SOS panic trigger connecting to verified 24/7 crisis helplines (Tele-MANAS, KIRAN, Vandrevala, AASRA, NIMHANS, 112).
  8. **Data Sovereignty & Portability**: Granular sensor consent toggling, complete JSON personal data archive export, and permanent zero-residual account erasure.

### 1.3 What the Project Currently Does vs. Planned / Future Scope
| Feature Area | Current Reality (Codebase) | Planned / Future Scope |
|---|---|---|
| **Frontend UI** | Fully implemented responsive React 19 + Tailwind SPA with dark/light themes, Recharts graphs, and mobile navigation drawer. | Additional native mobile gesture controls and offline service workers. |
| **Backend API** | Fully implemented FastAPI async service with 12 domain routers and 36+ endpoints. | Microservice decomposition across domains. |
| **Database** | Fully implemented dual engine: PostgreSQL (production) with automatic zero-config SQLite local fallback (`guideme_local.db`). 28 SQLAlchemy ORM models. | Alembic migration CI/CD deployment pipeline. |
| **AI Companion** | Implemented Google Gemini API provider with SSE token streaming, function tool calling, and local intelligent rule-based `MockLLMProvider` fallback. | Custom fine-tuned local quantized LLM (e.g. Llama-3-8B-Instruct). |
| **Facial Analysis** | Implemented live HTML5 Canvas/MediaStream capture + OpenCV Haar cascade face & feature proxy analysis in RAM. | MediaPipe 468-point 3D mesh landmark pipeline. |
| **Wearable Hub** | Implemented provider abstraction with `MockWearableProvider` simulation; interface stubs for Fitbit, Apple HealthKit, and Google Health Connect. | Production OAuth 2.0 PKCE live token exchange and Webhook sync for Fitbit/Apple/Google. |
| **Digital Wellbeing** | Implemented database tracking, daily trends, manual logging, target limits, and category breakdown. | Native Android `UsageStatsManager` background sync service. |
| **Android APK** | Implemented Capacitor 8 build pipeline (`build-apk.ps1`) generating standalone installable `GuideMe-v1.0.apk` (4.4 MB) with cleartext HTTP & custom server URL configuration modal. | Signed Google Play Store release bundle (AAB). |

---

## 2. COMPLETE PROJECT STRUCTURE

```
GUIDE ME - FINAL/
├── .env.example                     # Root environment configuration template
├── .git/                            # Git version control metadata
├── .github/                         # GitHub repository configuration
├── .gitignore                       # Git ignore definitions
├── .pytest_cache/                   # Pytest cache directory
├── CHANGELOG.md                     # Release log for v1.0.0
├── CONTRIBUTING.md                  # Development guidelines
├── GuideMe-v1.0.apk                 # Standalone compiled Android APK (4.4 MB)
├── LICENSE                          # MIT License file
├── Makefile                         # Automation targets (setup, start, test, seed, clean)
├── README.md                        # Project introductory documentation
├── SECURITY.md                      # Security disclosure policy and STRIDE threat analysis
├── build-apk.ps1                    # Automated PowerShell build script for Android APK
├── cloudflared.exe                  # Cloudflare tunnel executable for public HTTPS exposure
├── docker-compose.yml               # Multi-container orchestration (db, backend, frontend)
├── guideme_local.db                 # Top-level active SQLite database file (557 KB)
├── requirements.txt                 # Root Python 3.13 dependencies (no virtualenv)
│
├── backend/                         # FastAPI Backend Application Root
│   ├── .env                         # Active local backend environment file
│   ├── .env.example                 # Backend environment template
│   ├── guideme_local.db             # Backend active SQLite database file (471 KB)
│   ├── migrations/                  # Alembic migrations directory
│   │   └── versions/                # Empty versions directory (migrations run in code)
│   ├── app/                         # Core Python backend package
│   │   ├── __init__.py              # Package initialization
│   │   ├── main.py                  # FastAPI app factory, lifespan, CORS, security headers
│   │   ├── seed.py                  # Database seeder (Jordan Chen demo archetype)
│   │   ├── core/                    # Infrastructure and security configurations
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Pydantic Settings class loading from .env
│   │   │   ├── database.py          # Dual engine (Async/Sync), session makers, SQLite PRAGMA migrations
│   │   │   └── security.py          # Native Bcrypt hashing, password strength, JWT token generation
│   │   ├── api/                     # REST API layer
│   │   │   ├── deps.py              # Auth dependency: get_current_user, get_current_admin_user
│   │   │   └── v1/                  # API v1 domain routers
│   │   │       ├── __init__.py      # Aggregates and mounts all 12 routers onto api_router
│   │   │       ├── auth.py          # /auth: register, login, refresh, me
│   │   │       ├── users.py         # /profile: profile CRUD, consent toggles, JSON export, account delete
│   │   │       ├── assessments.py   # /assessments: IPIP questions, submission, scoring, latest result
│   │   │       ├── journal.py       # /journal: create, list, get, delete journal entries
│   │   │       ├── mood_stress.py   # /moods, /stress, /distress: logging, multimodal evaluation
│   │   │       ├── companion.py     # /companion: chat, SSE stream, conversations, memories, confirmations
│   │   │       ├── facial.py        # /facial-analysis: process-frame in-memory
│   │   │       ├── wellness.py      # /wellness: metrics, wearables sync, sleep summary, digital wellbeing, dashboard-summary
│   │   │       ├── goals.py         # /goals, /habits: CRUD, milestone toggle, habit toggle
│   │   │       ├── career.py        # /career: career recommendations mapping
│   │   │       ├── safety.py        # /safety: emergency contacts, SOS emergency alert trigger
│   │   │       └── recommendations.py # /recommendations: multimodal rule-based intervention recommendations
│   │   ├── models/                  # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   └── entities.py          # 28 SQLAlchemy declarative models
│   │   ├── schemas/                 # Pydantic validation & serialization schemas
│   │   │   ├── __init__.py
│   │   │   └── schemas.py           # Request/Response schemas for all 12 domains
│   │   ├── repositories/            # Data access layer with strict IDOR enforcement
│   │   │   ├── __init__.py
│   │   │   └── repositories.py      # 10 specialized repositories scoping queries to user_id
│   │   ├── services/                # Business logic orchestrators
│   │   │   ├── __init__.py
│   │   │   └── services.py          # AuthService, JournalService, AssessmentService, CompanionService
│   │   ├── ml/                      # Embedded analytical & psychometric algorithms
│   │   │   ├── __init__.py
│   │   │   ├── ocean_engine.py      # 50-item IPIP scoring & psychometric interpretation
│   │   │   ├── nlp_engine.py        # Lexicon sentiment & cognitive distortion detection
│   │   │   ├── stress_distress_engine.py # Multimodal stress index & z-score baseline calculator
│   │   │   ├── facial_engine.py     # OpenCV Haar landmark contrast proxy analyzer
│   │   │   └── recommendation_engine.py # Cross-domain wellness recommendation generator
│   │   ├── ai/                      # AI Companion providers and safety layers
│   │   │   ├── __init__.py
│   │   │   ├── context_builder.py   # Synthesizes profile, mood, sleep, goals into system prompt
│   │   │   ├── gemini_provider.py   # Google Gemini API client with function calling & streaming
│   │   │   ├── providers.py         # BaseLLMProvider, MockLLMProvider, ExternalLLMProvider (OpenAI)
│   │   │   ├── safety_guardrails.py # Regex clinical crisis & medical inquiry detector
│   │   │   └── tools.py             # Native companion tools & destructive action confirmation queue
│   │   └── integrations/            # Wearable hardware provider abstractions
│   │       ├── __init__.py
│   │       └── wearable_provider.py # MockWearableProvider, Fitbit, Apple, Google stubs
│   └── tests/                       # Automated Pytest test suite
│       ├── conftest.py              # Pytest configuration and fixtures
│       ├── test_backend.py          # 9 integration tests (health, auth, IDOR, ML, safety)
│       └── test_ai_companion.py     # 5 tests (context builder, tools, confirmation, memory, sessions)
│
├── frontend/                        # React Frontend Root
│   ├── index.html                   # HTML entry point (title: GUIDE ME)
│   ├── package.json                 # React 19, Vite 8, Tailwind, Recharts, Capacitor dependencies
│   ├── package-lock.json            # Deterministic lockfile
│   ├── vite.config.ts               # Vite bundler configuration
│   ├── tsconfig.json                # TypeScript project references
│   ├── tsconfig.app.json            # Client TypeScript configuration
│   ├── tsconfig.node.json           # Vite Node TypeScript configuration
│   ├── tailwind.config.js           # Calm eco-palette (earth, sage, forest color tokens)
│   ├── postcss.config.js            # PostCSS with Tailwind and Autoprefixer
│   ├── capacitor.config.ts          # Capacitor Android configuration (appId: com.guideme.app)
│   ├── dist/                        # Production build output generated by vite build
│   ├── public/                      # Static assets
│   ├── android/                     # Capacitor Native Android Studio Gradle project
│   │   ├── app/
│   │   │   ├── build.gradle         # Android app build configuration
│   │   │   └── src/main/
│   │   │       └── AndroidManifest.xml # Android permissions (Camera, Audio, Internet, Cleartext)
│   │   └── gradlew.bat              # Windows Gradle wrapper script
│   └── src/                         # Frontend TypeScript/React source code
│       ├── main.tsx                 # React DOM mount entry point
│       ├── App.tsx                  # BrowserRouter, route hierarchy, ProtectedRoute guard
│       ├── App.css                  # Custom styling rules
│       ├── index.css                # Tailwind directives and base theme definitions
│       ├── assets/                  # SVG and image assets (hero.png, react.svg, vite.svg)
│       ├── components/              # Reusable UI widgets
│       │   ├── ThemeToggle.tsx      # Dark/light mode switcher persisted in localStorage
│       │   ├── CircularProgressRing.tsx # Animated SVG progress ring component
│       │   ├── MarkdownRenderer.tsx # Custom markdown parser (inline code, bold, italics, blocks)
│       │   └── ServerConfigModal.tsx # Cross-device modal for configuring backend IP address
│       ├── layouts/
│       │   └── DashboardLayout.tsx  # Persistent sidebar, mobile responsive drawer, SOS button, Outlet
│       ├── services/
│       │   └── api.ts               # Centralized ApiService with JWT interceptors, base URL config, SSE streaming
│       └── pages/                   # 12 Major Application Screens
│           ├── LoginPage.tsx        # Login with email/password, demo account loader, server modal
│           ├── RegisterPage.tsx     # Registration with password complexity validator
│           ├── DashboardOverview.tsx# Central telemetry hub (4 pulse cards, 7d chart, habits, goals)
│           ├── AICompanionPage.tsx  # Multi-turn chat, SSE streaming, voice recognition, memories, tool confirmations
│           ├── FacialAnalysisPage.tsx # Live camera feed, RAM frame capture, expression proxy gauges
│           ├── JournalPage.tsx      # Journal editor, cognitive distortion analysis, re-framing suggestions
│           ├── PersonalityPage.tsx  # 50-item IPIP test flow, radar chart, career strengths
│           ├── StressDistressPage.tsx # Multimodal stress gauge, baseline deviation, acute distress reporting
│           ├── WearablesPage.tsx    # Wearable synchronization, sleep stages, manual biometric logging
│           ├── DigitalWellbeingPage.tsx # Screen time tracking, focus hours, curfew alerts, category breakdown
│           ├── GoalsPage.tsx        # Goal/milestone management and daily habit streak tracker
│           ├── CareerPage.tsx       # Psychometric career pathway alignment and learning roadmap
│           ├── SafetyCenterPage.tsx # Crisis helplines, SOS trigger, emergency contact manager
│           └── PrivacyCenterPage.tsx# Granular sensor consent toggles, JSON data export, account deletion
│
├── ml/                              # Standalone Experimental ML Scripts (Not used in runtime)
│   ├── datasets/                    # Dataset directory
│   ├── models/
│   │   └── train_sentiment.py       # Toy 10-sample MultinomialNB sentiment training script
│   └── pipelines/
│       └── signal_normalizer.py     # Standalone min-max normalization utility
│
├── infrastructure/                  # Containerization & Deployment
│   ├── docker/
│   │   ├── backend.Dockerfile       # Python 3.13 slim container definition
│   │   └── frontend.Dockerfile      # Nginx Alpine container for compiled React bundle
│   └── nginx/
│       └── nginx.conf               # Nginx reverse proxy configuration
│
├── scripts/                         # Git Bash & Linux Automation Scripts
│   ├── setup.sh                     # Verifies Python/Node, installs packages, seeds DB
│   ├── start_all.sh                 # Starts FastAPI and Vite concurrently with clean signal trapping
│   ├── start_backend.sh             # Starts Uvicorn on 127.0.0.1:8000
│   ├── start_frontend.sh            # Starts Vite on 127.0.0.1:5173
│   ├── seed.sh                      # Runs app.seed directly
│   └── test.sh                      # Runs pytest and tsc -b && vite build
│
└── docs/                            # Formal Platform Documentation
    ├── api/endpoints.md             # High-level API specification
    ├── architecture/overview.md     # Domain architecture & pipeline diagrams
    ├── research/psychometrics_and_clinical_ai.md # Psychometric foundations & citations
    └── security/threat_model.md     # STRIDE security audit & biometric privacy guarantees
```

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend
- **Framework**: React 19 (`19.2.8`) *(Note: README claims React 18; `package.json` installs React 19)*
- **Build Tool / Bundler**: Vite (`8.2.2`)
- **Language**: TypeScript (`~6.0.2`)
- **Routing**: React Router DOM (`7.18.3`) *(Note: README claims v6; `package.json` installs React Router v7)*
- **Styling System**: Tailwind CSS (`3.4.17`) with PostCSS (`8.5.28`) and Autoprefixer (`10.5.5`)
- **Color Scheme**: Sustainable Calm Eco-Palette custom defined in `tailwind.config.js`:
  - `earth`: warm sandstone tokens (`50: #fbfaf8` to `900: #43392e`)
  - `sage`: soothing restorative greens (`50: #f4f7f4` to `900: #233424`)
  - `forest`: deep grounding slate greens (`50: #f2f5f3` to `950: #0d1611`)
- **Icons**: Lucide React (`1.41.0`)
- **Data Visualization / Charts**: Recharts (`3.10.1`) (AreaChart, RadarChart, BarChart)
- **Mobile Packaging**: Capacitor (`8.5.1`) (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
- **Linter**: Oxlint (`1.79.0`)
- **Streaming Client**: Native HTML5 `ReadableStream` & `TextDecoder` for Server-Sent Events (SSE).
- **Media & Hardware APIs**: HTML5 `MediaStream` (`navigator.mediaDevices.getUserMedia()`), HTML5 Canvas (`CanvasRenderingContext2D.drawImage`), Web Speech API (`SpeechRecognition`, `speechSynthesis`).

### 3.2 Backend
- **Language**: Python 3.13 (`Python 3.13.15` tested)
- **Web Framework**: FastAPI (`>=0.115.0`)
- **ASGI Web Server**: Uvicorn (`[standard]>=0.30.0`)
- **Data Validation & Settings**: Pydantic v2 (`>=2.8.0`), `pydantic-settings` (`>=2.4.0`)
- **Multipart Form Support**: `python-multipart` (`>=0.0.12`)
- **ORM**: SQLAlchemy 2.0 (`>=2.0.30`) with async extension (`create_async_engine`, `async_sessionmaker`, `AsyncSession`)
- **Database Drivers**:
  - `asyncpg` (`>=0.29.0`) for asynchronous PostgreSQL
  - `psycopg2-binary` (`>=2.9.9`) for synchronous PostgreSQL connections
  - `aiosqlite` (`>=0.20.0`) for asynchronous SQLite local development fallback
- **Authentication & Cryptography**:
  - `bcrypt` (`>=4.2.0`): Native Bcrypt implementation for 12-round password hashing
  - `passlib[bcrypt]` (`>=1.7.4`): Backward-compatible password utilities
  - `python-jose[cryptography]` (`>=3.3.0`): Cryptographic JWT token generation and validation
- **HTTP Client**: `httpx` (`>=0.27.0`) for external API requests (Gemini, OpenAI) and ASGI test transport
- **Logging**: Python standard logging structured with `structlog` (`>=24.4.0`)
- **Testing**: `pytest` (`>=8.3.0`), `pytest-asyncio` (`>=0.24.0`)

### 3.3 Database
- **Primary Target (Production)**: PostgreSQL 16 (configured via `DATABASE_URL="postgresql+asyncpg://..."`)
- **Automatic Fallback (Development & Evaluation)**: SQLite 3 (`guideme_local.db` via `sqlite+aiosqlite:///./guideme_local.db`).
  - *Mechanism*: `database.py` tests synchronous connection to PostgreSQL with a 2-second timeout. If unreachable, it logs a warning and automatically falls back to the local SQLite database file.
- **In-Code Migrations**: In `init_db_tables()`, SQLite PRAGMA table inspection dynamically executes `ALTER TABLE` to add missing columns (`calories_burned`, `distance_km`, `sleep_stages` on `wellness_metrics`; `target_limit_minutes`, `categories` on `digital_wellbeing_metrics`).

### 3.4 AI / ML Implementation Breakdown
| Component | Engine Class | Underlying Implementation | Dynamic vs. Mocked |
|---|---|---|---|
| **Big Five Personality** | `OceanBigFiveEngine` | Standard 50-item IPIP inventory, Likert scale computation (1–5), reverse scoring ($6 - X$), percentage normalization ($0–100\%$), trait archetype mapping. | **Real / Rule-based Psychometric Computation** |
| **Cognitive Journaling NLP** | `NLPEmotionJournalEngine` | Lexicon-based emotional sentiment scoring, regex cognitive distortion matching, concept extraction, clinical re-framing generator. | **Real / Lexicon-Regex NLP Engine** |
| **Multimodal Stress & Distress** | `StressDistressEngine` & `PersonalBaselineCalculator` | Weighted multi-signal fusion (Mood 0.35, HRV 0.25, Sleep 0.15, Screen 0.15, Sentiment 0.10), NumPy personal 14-day rolling baseline $z$-score calculator. | **Real / Statistical Multimodal Engine** |
| **Facial Landmark Estimation** | `FacialAnalysisEngine` | Decodes base64 frame in RAM, runs OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`), extracts mouth/brow/eye ROI pixel variances. | **Real Computer Vision Proxy (In-Memory)** |
| **AI Companion (Online)** | `GeminiProvider` | Calls Google Gemini API (`https://generativelanguage.googleapis.com/v1beta`), handles native function tool declarations and Server-Sent Events (SSE). | **Real Dynamic LLM (requires GEMINI_API_KEY)** |
| **AI Companion (Offline Fallback)**| `MockLLMProvider` | Context-aware heuristic agent with multi-turn conversation memory, intent extraction, tool execution, and breathing exercise dialogues. | **Dynamic Heuristic Engine (No API key needed)** |
| **Safety & Crisis Guardrails** | `SafetyGuardrailEngine` | Regex detection for self-harm and diagnostic inquiries. Automatically suspends normal LLM generation and injects verified crisis support. | **Real Clinical Safety Guardrail** |
| **Companion Tools & Confirmations** | `ToolDispatcher` | Executes real database queries for goals, habits, moods, journals. Caches destructive calls in `PENDING_DESTRUCTIVE_ACTIONS` for confirmation. | **Real Database-Connected Tool Layer** |
| **Wearables Provider** | `MockWearableProvider` | Generates physiological simulated biometrics; interface stubs exist for Fitbit, Apple HealthKit, Google Health Connect. | **Simulated / Mock Demonstration Data** |
| **Career Recommendations** | `career.py` router | Returns static career templates based on whether a personality result exists. | **Hardcoded Template Data** |
| **Standalone Scripts** | `train_sentiment.py`, `signal_normalizer.py` | Toy 10-sample MultinomialNB script and min-max scaler. | **Standalone Prototypes (Not loaded in app)** |

---

## 4. DEPENDENCIES

### 4.1 Frontend Dependencies (`frontend/package.json`)
| Package | Version | Purpose in GuideMe |
|---|---|---|
| `react` | `^19.2.8` | Core UI library. |
| `react-dom` | `^19.2.8` | DOM rendering for React. |
| `react-router-dom` | `^7.18.3` | Client-side routing (`BrowserRouter`, `Routes`, `Route`, `Navigate`). |
| `recharts` | `^3.10.1` | Renders 7-day trend AreaCharts, OCEAN RadarCharts, and BarCharts. |
| `lucide-react` | `^1.41.0` | Accessible iconography across navigation, cards, and modal components. |
| `clsx` | `^2.1.1` | Conditional CSS class merging utility. |
| `tailwind-merge` | `^3.6.0` | Conflict-free Tailwind class resolution utility. |
| `@capacitor/core` | `^8.5.1` | Native bridge runtime for mobile execution. |
| `@capacitor/cli` | `^8.5.1` | Capacitor command-line tooling for asset syncing. |
| `@capacitor/android`| `^8.5.1` | Android native project runtime. |
| `vite` | `^8.2.2` | Development dev-server and ultra-fast ES module bundler. |
| `@vitejs/plugin-react` | `^6.1.0` | Vite React fast-refresh and JSX transformation plugin. |
| `typescript` | `~6.0.2` | Static type checking and interface validation. |
| `tailwindcss` | `^3.4.17` | Utility-first CSS styling engine. |
| `postcss` | `^8.5.28` | CSS post-processing pipeline. |
| `autoprefixer` | `^10.5.5` | Vendor prefix automation for CSS rules. |
| `oxlint` | `^1.79.0` | High-speed JavaScript/TypeScript linter. |
| `@types/react` | `^19.2.18`| TypeScript type definitions for React. |
| `@types/react-dom`| `^19.2.4` | TypeScript type definitions for React DOM. |
| `@types/node` | `^24.13.3`| TypeScript type definitions for Node.js environments. |

### 4.2 Backend Dependencies (`requirements.txt`)
| Package | Version | Purpose in GuideMe |
|---|---|---|
| `fastapi` | `>=0.115.0` | Asynchronous REST web framework and OpenAPI generator. |
| `uvicorn[standard]` | `>=0.30.0` | Production ASGI web server with event loop optimizations. |
| `pydantic` | `>=2.8.0` | Request payload parsing, model serialization, and data validation. |
| `pydantic-settings` | `>=2.4.0` | Environment variable management via `SettingsConfigDict`. |
| `python-multipart` | `>=0.0.12` | Form-data and file upload parser for FastAPI. |
| `sqlalchemy` | `>=2.0.30` | Declarative ORM and async SQL query constructor. |
| `alembic` | `>=1.13.0` | Database schema migration engine (configured in structure). |
| `psycopg2-binary` | `>=2.9.9` | C-optimized synchronous PostgreSQL driver for migrations/seeding. |
| `asyncpg` | `>=0.29.0` | High-performance asynchronous PostgreSQL driver for API routes. |
| `aiosqlite` | `>=0.20.0` | Asynchronous SQLite driver for zero-config local development. |
| `python-jose[cryptography]` | `>=3.3.0` | JWT signing, decoding, and cryptographic token verification. |
| `passlib[bcrypt]` | `>=1.7.4` | Password hashing framework. |
| `bcrypt` | `>=4.2.0` | 12-round native password hashing implementation. |
| `numpy` | `>=1.26.0` | Array manipulation and statistical baseline calculations ($z$-scores). |
| `pandas` | `>=2.2.0` | Data aggregation and historical observation management. |
| `scikit-learn` | `>=1.5.0` | ML pipeline support (used in `ml/models/train_sentiment.py`). |
| `scipy` | `>=1.13.0` | Scientific computing routines. |
| `opencv-python-headless` | `>=4.10.0` | Server-safe OpenCV for face detection and contrast proxy calculation. |
| `pillow` | `>=10.4.0` | Image processing library for converting base64 streams into pixel arrays. |
| `pytest` | `>=8.3.0` | Automated testing framework. |
| `pytest-asyncio` | `>=0.24.0` | Asynchronous testing runner for FastAPI async endpoints. |
| `httpx` | `>=0.27.0` | HTTP client for Gemini API and ASGI in-process test client. |
| `structlog` | `>=24.4.0` | Structured JSON logging. |

### 4.3 Unused or Standalone Dependencies
- `scikit-learn` & `pandas`: Installed in requirements, but primary runtime engines (`ocean_engine.py`, `nlp_engine.py`, `stress_distress_engine.py`, `facial_engine.py`) rely on lightweight native Python dictionaries, regex, and NumPy. `scikit-learn` is only used in the standalone prototype script `ml/models/train_sentiment.py`.
- `alembic`: Present in `requirements.txt` and `backend/migrations`, but migrations are executed programmatically in `database.py` via `Base.metadata.create_all` and direct SQLite PRAGMA execution.

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Entry Point & Routing
- **Entry Point**: `frontend/src/main.tsx` renders `<App />` wrapped in `React.StrictMode` into `#root`.
- **Root Component**: `frontend/src/App.tsx` configures `<BrowserRouter>` and declares routes:
  - Public Routes: `/login` (`LoginPage`), `/register` (`RegisterPage`)
  - Protected Routes: Wrapped with `<ProtectedRoute>` (checks for `guideme_token` in `localStorage`):
    - `/dashboard` (`DashboardOverview`)
    - `/dashboard/companion` (`AICompanionPage`)
    - `/dashboard/facial-analysis` (`FacialAnalysisPage`)
    - `/dashboard/journal` (`JournalPage`)
    - `/dashboard/personality` (`PersonalityPage`)
    - `/dashboard/stress` (`StressDistressPage`)
    - `/dashboard/wearables` (`WearablesPage`)
    - `/dashboard/digital-wellbeing` (`DigitalWellbeingPage`)
    - `/dashboard/goals` (`GoalsPage`)
    - `/dashboard/career` (`CareerPage`)
    - `/dashboard/safety` (`SafetyCenterPage`)
    - `/dashboard/privacy` (`PrivacyCenterPage`)
  - Fallback: Any unknown route redirects to `/dashboard`.

### 5.2 Layout System (`DashboardLayout.tsx`)
- Provides responsive split layout:
  - **Sidebar (Desktop)**: Fixed 64-width panel with logo, theme toggle, emergency SOS button, 12 domain links with active state indicator, version tag, and sign out button.
  - **Mobile Header & Drawer**: Top bar with hamburger toggle; expandable sliding menu for phone displays.
  - **Main Content Area**: `<Outlet />` wrapped in a maximum width container (`max-w-6xl mx-auto`) with auto scrolling.

### 5.3 State Management & API Integration (`ApiService`)
- Static singleton class `ApiService` in `frontend/src/services/api.ts`.
- Dynamically resolves base URL:
  1. Checks `localStorage.getItem('guideme_custom_api_url')`
  2. Falls back to `import.meta.env.VITE_API_BASE_URL`
  3. Defaults to `http://127.0.0.1:8000/api/v1`
- Handles JWT headers automatically (`Authorization: Bearer <token>`).
- On `401 Unauthorized`, clears local storage tokens and redirects to `/login`.
- Implements SSE streaming through `streamChatMessage()`, decoding incoming chunks and invoking callbacks for tokens, tool executions, and completion events.

### 5.4 Major Page Deep-Dive Audit
```
PAGE NAME: LoginPage
- File: frontend/src/pages/LoginPage.tsx
- Route: /login
- Purpose: User authentication, demo account one-click loading, and backend connection configuration.
- User Inputs: Email input, password input, "Load Demo Account" button, "Server" configuration button.
- API Calls: ApiService.login({ email, password }) -> POST /auth/login
- Data Displayed: Error message banner on failure, brand logo, subtitle.
- Components Used: ThemeToggle, ServerConfigModal, Lucide icons (Mail, Lock, Leaf, ArrowRight, Sparkles, Server).
- Navigation: On success -> /dashboard; link to /register.
- Loading States: "Authenticating..." button text and disabled button state.
- Known Issues: None. Fully functional.

PAGE NAME: RegisterPage
- File: frontend/src/pages/RegisterPage.tsx
- Route: /register
- Purpose: Create a new user account with real-time password strength validation.
- User Inputs: Email, full name, password.
- API Calls: ApiService.register({ email, password, full_name }) -> POST /auth/register
- Components Used: ThemeToggle, ServerConfigModal, Lucide icons.
- Navigation: On success -> /dashboard; link to /login.
- Loading States: "Creating Account..." button text.
- Known Issues: None. Fully functional.

PAGE NAME: DashboardOverview
- File: frontend/src/pages/DashboardOverview.tsx
- Route: /dashboard
- Purpose: Unified holistic vitality summary displaying personal baseline, real trends, and quick actions.
- User Inputs: Habit toggle checkboxes, "Reflect with AI" shortcut, "Facial Signals" shortcut.
- API Calls:
  - ApiService.getDashboardSummary() -> GET /wellness/dashboard-summary
  - ApiService.listGoals() -> GET /goals
  - ApiService.listHabits() -> GET /habits
  - ApiService.getRecommendations() -> GET /recommendations
  - ApiService.toggleHabit(id) -> POST /habits/{id}/toggle
- Data Displayed:
  - Welcome greeting with user's preferred name
  - Mood Pulse card (latest score out of 10, trend label)
  - Stress Index card (composite score out of 100, risk band, z-score deviation)
  - Sleep Recovery card (hours slept vs target, circular progress ring, HRV, resting HR)
  - Digital Balance card (screen hours vs limit, circular progress ring, focus hours, pickups)
  - 7-Day Resilience Trajectory Recharts area chart with dual gradients (Mood vs Stress)
  - Interactive Daily Habits checklist with instant optimistic toggle
  - Active Goals overview with progress percentages
  - AI Recommended Actions list with priority badges
- Loading States: Centered animated spinner with "Synthesizing personal baseline & wellbeing telemetry..."
- Empty States: Explicit dashed indicators ("—") and links to log metrics when telemetry is missing.
- Known Issues: None. Fully connected to real backend endpoints.

PAGE NAME: AICompanionPage
- File: frontend/src/pages/AICompanionPage.tsx
- Route: /dashboard/companion
- Purpose: Conversational clinical AI companion with Server-Sent Events (SSE) streaming, voice I/O, multi-session management, long-term memory inspection, and destructive action confirmation.
- User Inputs: Text input, Send button, Voice microphone button, Multi-session selector, Memory search & filter, Confirm/Cancel buttons for destructive tool calls.
- API Calls:
  - ApiService.listConversations() -> GET /companion/conversations
  - ApiService.createConversation() -> POST /companion/conversations
  - ApiService.getConversationById(id) -> GET /companion/conversations/{id}
  - ApiService.deleteConversation(id) -> DELETE /companion/conversations/{id}
  - ApiService.streamChatMessage() -> POST /companion/chat/stream
  - ApiService.listMemories() -> GET /companion/memories
  - ApiService.createMemory() -> POST /companion/memories
  - ApiService.updateMemory() -> PUT /companion/memories/{id}
  - ApiService.deleteMemory() -> DELETE /companion/memories/{id}
  - ApiService.confirmAction(id) -> POST /companion/actions/{id}/confirm
  - ApiService.cancelAction(id) -> POST /companion/actions/{id}/cancel
- Data Displayed: Message history with role badges, streaming text token-by-token, tool execution notifications, destructive action confirmation prompts, memory cards with confidence scores.
- Components Used: MarkdownRenderer, Lucide icons.
- Loading States: Animated typing indicator while assistant is generating tokens.
- Known Issues: Web Speech API relies on browser implementation (`webkitSpeechRecognition`); unavailable in unsupported browsers without microphone permissions.

PAGE NAME: FacialAnalysisPage
- File: frontend/src/pages/FacialAnalysisPage.tsx
- Route: /dashboard/facial-analysis
- Purpose: Real-time web camera capture and in-memory muscular expression proxy estimation.
- User Inputs: "Enable Camera" / "Stop Camera" button, "Analyze Current Frame" button, "Auto Sample (3s)" toggle.
- API Calls: ApiService.processFacialFrame(base64) -> POST /facial-analysis/process-frame
- Data Displayed: Live `<video>` viewfinder, `<canvas>` snapshot preview, detected expression pill, confidence gauge, 4 biometric proxies (Smile ratio, Brow furrow index, Eye aperture, Head stability), probabilistic non-diagnostic disclaimer.
- Loading States: "Analyzing Frame in Memory..." spinner overlay.
- Error States: Explicit banners when camera permission is denied or no face is detected in the frame.
- Known Issues: None. Zero frames are persisted to disk or database.

PAGE NAME: JournalPage
- File: frontend/src/pages/JournalPage.tsx
- Route: /dashboard/journal
- Purpose: Thought reflection editor with instant NLP cognitive distortion detection and reframing prompts.
- User Inputs: Title input, content textarea, tags input, mood context dropdown, Delete button.
- API Calls:
  - ApiService.listJournals() -> GET /journal
  - ApiService.createJournal(...) -> POST /journal
  - ApiService.deleteJournal(id) -> DELETE /journal/{id}
- Data Displayed: Previous entry sidebar list, active journal card, sentiment score badge, dominant emotion tag, detected cognitive distortion alerts with clinical reframing guidance, recommended micro-action.
- Loading States: Form submit disabled and loading text.
- Known Issues: None.

PAGE NAME: PersonalityPage
- File: frontend/src/pages/PersonalityPage.tsx
- Route: /dashboard/personality
- Purpose: 50-item IPIP Big Five (OCEAN) questionnaire, scoring, radar/bar visualizer, and career strengths.
- User Inputs: 5-point Likert scale buttons (Disagree to Agree) for 50 questions, Submit button, Retake button.
- API Calls:
  - ApiService.getLatestPersonality() -> GET /assessments/ocean/latest
  - ApiService.getOceanQuestions() -> GET /assessments/ocean/questions
  - ApiService.submitOcean(...) -> POST /assessments/ocean/submit
- Data Displayed:
  - Question questionnaire mode with answered count progress
  - Results mode: OCEAN RadarChart, Trait BarChart, Dominant traits badges, Psychometric analysis narrative, Career strengths list.
- Known Issues: None.

PAGE NAME: StressDistressPage
- File: frontend/src/pages/StressDistressPage.tsx
- Route: /dashboard/stress
- Purpose: Multimodal stress monitor, personal rolling baseline z-score deviation, and acute distress event reporting.
- User Inputs: "Re-Evaluate Stress" button, "Log Acute Distress" button, distress trigger input, distress symptom multi-select pills.
- API Calls:
  - ApiService.getLatestStress() -> GET /stress/latest
  - ApiService.evaluateStress() -> POST /stress/evaluate
  - ApiService.reportDistress(...) -> POST /distress/report
- Data Displayed: Circular SVG stress gauge (0–100), risk band badge (Low, Moderate, Elevated, Critical), personal baseline deviation ($z$-score), signal evidence breakdown (mood, HRV, sleep, screen time, sentiment), distress confirmation with Indian helpline numbers.
- Known Issues: None.

PAGE NAME: WearablesPage
- File: frontend/src/pages/WearablesPage.tsx
- Route: /dashboard/wearables
- Purpose: Biometric tracker synchronization and sleep architecture breakdown with manual entry support.
- User Inputs: "Sync Wearable" button, "Log Biometrics Manually" button, manual biometric modal form (sleep hours, quality, resting HR, HRV, steps, active minutes, water, calories).
- API Calls:
  - ApiService.getWellnessMetrics() -> GET /wellness/metrics
  - ApiService.getSleepSummary() -> GET /wellness/sleep/summary
  - ApiService.syncWearables() -> POST /wellness/sync-wearables
  - ApiService.logWellnessMetric(...) -> POST /wellness/metrics
- Data Displayed: 4 provider cards (BioSensor Simulator, Apple HealthKit, Fitbit, Google Health Connect), sleep architecture breakdown (Deep, REM, Light, Awake), 7-day sleep consistency trend, recovery notes.
- Known Issues: Real Fitbit/Apple/Google OAuth syncing is simulated; actual data is generated by `MockWearableProvider` or user manual entry.

PAGE NAME: DigitalWellbeingPage
- File: frontend/src/pages/DigitalWellbeingPage.tsx
- Route: /dashboard/digital-wellbeing
- Purpose: Screen time boundaries, notification load analysis, pickup tracking, and curfew management.
- User Inputs: "Set Screen Limit" button, "Log Screen Time" manual button, target limit slider.
- API Calls:
  - ApiService.getDigitalWellbeing() -> GET /wellness/digital-wellbeing
  - ApiService.updateDigitalWellbeing(...) -> POST /wellness/digital-wellbeing
- Data Displayed: Circular screen time progress ring, total screen hours vs target, focus hours, pickup count, category distribution bar (productive, communication, entertainment, utility), weekly trends list.
- Known Issues: Data is entered manually or seeded via `DigitalWellbeingMetric`. Real-time Android OS usage stats require a native background plugin.

PAGE NAME: GoalsPage
- File: frontend/src/pages/GoalsPage.tsx
- Route: /dashboard/goals
- Purpose: Goal milestone tracking and daily habit streak management.
- User Inputs: Habit check toggle, Goal milestone checkboxes, "Create Goal" modal, "Create Habit" modal, Edit/Delete buttons.
- API Calls:
  - ApiService.listGoals() -> GET /goals
  - ApiService.createGoal(...) -> POST /goals
  - ApiService.updateGoal(...) -> PUT /goals/{id}
  - ApiService.deleteGoal(id) -> DELETE /goals/{id}
  - ApiService.toggleMilestone(id) -> POST /goals/milestones/{id}/toggle
  - ApiService.listHabits() -> GET /habits
  - ApiService.createHabit(...) -> POST /habits
  - ApiService.updateHabit(...) -> PUT /habits/{id}
  - ApiService.deleteHabit(id) -> DELETE /habits/{id}
  - ApiService.toggleHabit(id) -> POST /habits/{id}/toggle
- Data Displayed: Habit streak flame icons, completion checkboxes, goal milestone checklist with dynamic percentage bar calculation.
- Known Issues: None.

PAGE NAME: CareerPage
- File: frontend/src/pages/CareerPage.tsx
- Route: /dashboard/career
- Purpose: Translating Big Five psychometric dimensions into aligned professional pathways.
- User Inputs: Link to /dashboard/personality if test is uncompleted.
- API Calls: ApiService.getCareerRecommendations() -> GET /career/recommendations
- Data Displayed: Career path titles, match percentages, alignment rationale, key strengths list, growth focus areas, learning roadmap checklist.
- Known Issues: Career recommendations returned by backend are static template responses (Systems Architect vs UX AI Research Engineer).

PAGE NAME: SafetyCenterPage
- File: frontend/src/pages/SafetyCenterPage.tsx
- Route: /dashboard/safety
- Purpose: Crisis intervention hub with verified helplines, emergency contacts, and one-click SOS panic trigger.
- User Inputs: "Trigger Urgent SOS Support" button, "Add Emergency Contact" modal form (name, relationship, phone, email).
- API Calls:
  - ApiService.listEmergencyContacts() -> GET /safety/emergency-contacts
  - ApiService.addEmergencyContact(...) -> POST /safety/emergency-contacts
  - ApiService.triggerEmergencyAlert() -> POST /safety/trigger-alert
- Data Displayed:
  - SOS confirmation alert banner with immediate medical directives
  - Verified 24/7 Indian Crisis Helplines (Tele-MANAS 14416 / 1800-891-4416, KIRAN 1800-599-0019, Vandrevala Foundation +91 9999 666 555, National Emergency 112, AASRA +91 98204 66726, NIMHANS 080-46110007)
  - User's personal trusted emergency contacts list
- Known Issues: None. Fully functional.

PAGE NAME: PrivacyCenterPage
- File: frontend/src/pages/PrivacyCenterPage.tsx
- Route: /dashboard/privacy
- Purpose: Granular sensor consent management, complete GDPR/CCPA data export, and permanent account destruction.
- User Inputs: Consent toggles (Camera, Memory, Wearables, Typing Dynamics, Store Facial Data), "Export My Data (JSON)" button, "Permanently Delete Account" button.
- API Calls:
  - ApiService.getConsent() -> GET /profile/consent
  - ApiService.updateConsent(...) -> PUT /profile/consent
  - ApiService.exportData() -> GET /profile/export-data
  - ApiService.deleteAccount() -> DELETE /profile/delete-account
- Data Displayed: Interactive toggle switches with descriptions, save notification banner, export confirmation, deletion warning dialog.
- Known Issues: None. Fully functional.
```

---

## 6. BACKEND ARCHITECTURE

### 6.1 Application Entry Point & Lifecycle (`main.py`)
- **FastAPI Initialization**: Instantiated with title, version, and custom `lifespan` handler.
- **Lifespan Context**: Calls `init_db_tables()` asynchronously on startup, creating all tables and running incremental SQLite column migrations.
- **CORS Middleware**: Configured with `allow_origins=settings.CORS_ORIGINS`, regex matching `^(https?://.*|capacitor://.*)$`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- **Security & Observability HTTP Middleware**:
  - Assigns or propagates `X-Request-ID` (UUID4).
  - Calculates execution latency `X-Process-Time`.
  - Injects defensive HTTP headers:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `X-XSS-Protection: 1; mode=block`
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - Logs every HTTP request with status and execution time.

### 6.2 Request Lifecycle & Architectural Flow
```
Frontend Client (React SPA / Capacitor APK)
       │
       ▼ (HTTP Request with Bearer JWT Header)
FastAPI Middleware (Observability, Security Headers, CORS)
       │
       ▼
Domain Router (e.g., app/api/v1/journal.py)
       │
       ├──► Dependency Injection: app/api/deps.py (get_current_user)
       │        ├── Decodes JWT via app/core/security.py (decode_token)
       │        ├── Queries UserRepository (get_by_id)
       │        └── Returns User entity (or raises 401 Unauthorized)
       │
       ├──► Service Layer (e.g., app/services/services.py - JournalService)
       │        ├── Invokes Analytical Engines (e.g., app/ml/nlp_engine.py)
       │        └── Coordinates Repositories & Auditing
       │
       ├──► Repository Layer (e.g., app/repositories/repositories.py - JournalRepository)
       │        ├── Enforces IDOR: stmt.where(Journal.user_id == current_user.id)
       │        └── Executes async SQLAlchemy statement on AsyncSession
       │
       ▼
Database (PostgreSQL 16 or local SQLite fallback)
       │
       ▼
Pydantic Serialization Schema (e.g., app/schemas/schemas.py - JournalResponse)
       │ (Strips sensitive fields such as password hashes)
       ▼
Frontend Response (JSON / SSE Stream)
```

---

## 7. API DOCUMENTATION

Below is the complete catalog of all 36+ actual API endpoints implemented in `backend/app/api/v1` and `main.py`.

### 7.1 Observability & Root
| Method | URL | Auth? | Purpose | Response Schema |
|---|---|---|---|---|
| `GET` | `/` | No | System status & metadata | `{"name", "version", "status", "docs_url", "api_v1"}` |
| `GET` | `/health` | No | Container health check | `{"status": "healthy", "service", "version", "environment"}` |
| `GET` | `/ready` | No | Readiness check for DB & AI | `{"status": "ready", "database", "ai_provider", "wearable_provider"}` |

### 7.2 Authentication (`/api/v1/auth`) — `auth.py`
| Method | URL | Auth? | Request Body | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | `UserRegister` (`email`, `password`, `full_name`, `preferred_name`, `occupation`) | `TokenResponse` (`access_token`, `refresh_token`, `user_id`, `email`, `role`, `full_name`) | `RegisterPage` |
| `POST` | `/api/v1/auth/login` | No | `UserLogin` (`email`, `password`) | `TokenResponse` | `LoginPage` |
| `POST` | `/api/v1/auth/refresh` | No | `RefreshTokenRequest` (`refresh_token`) | `{"access_token", "refresh_token", "token_type"}` | `ApiService` |
| `GET` | `/api/v1/auth/me` | Yes | None | `UserProfileResponse` | `AICompanionPage`, Header |

### 7.3 User Profile & Privacy (`/api/v1/profile`) — `users.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/profile` | Yes | None | `UserProfileResponse` | Profile components |
| `PUT` | `/api/v1/profile` | Yes | `UserProfileUpdate` (optional bio, name, timezone, occupation, avatar) | `UserProfileResponse` | Profile settings |
| `GET` | `/api/v1/profile/consent` | Yes | None | `UserConsentResponse` | `PrivacyCenterPage` |
| `PUT` | `/api/v1/profile/consent` | Yes | `UserConsentUpdate` (camera, audio, wearable, memory, typing, store_facial) | `UserConsentResponse` | `PrivacyCenterPage` |
| `GET` | `/api/v1/profile/export-data` | Yes | None | JSON payload (User, Profile, Consents, Journals, Moods, Goals) | `PrivacyCenterPage` |
| `DELETE`| `/api/v1/profile/delete-account`| Yes | None | `{"status": "success", "message": "..."}` | `PrivacyCenterPage` |

### 7.4 Personality & Assessments (`/api/v1/assessments`) — `assessments.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/assessments/ocean/questions` | Yes | None | `List[AssessmentQuestionSchema]` (50 items) | `PersonalityPage` |
| `POST` | `/api/v1/assessments/ocean/submit` | Yes | `AssessmentSubmission` (`assessment_id`, `answers: [{question_id, score_value}]`) | `PersonalityResultResponse` | `PersonalityPage` |
| `GET` | `/api/v1/assessments/ocean/latest` | Yes | None | `PersonalityResultResponse` (openness, conscientiousness, extraversion, agreeableness, neuroticism, narrative, careers) | `PersonalityPage`, `DashboardOverview` |

### 7.5 Cognitive Journaling (`/api/v1/journal`) — `journal.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/journal` | Yes | None | `List[JournalResponse]` (with analysis) | `JournalPage` |
| `POST` | `/api/v1/journal` | Yes | `JournalCreate` (`title`, `content`, `tags`, `mood_context`) | `JournalResponse` | `JournalPage` |
| `GET` | `/api/v1/journal/{journal_id}` | Yes | Path: `journal_id` | `JournalResponse` | `JournalPage` |
| `DELETE`| `/api/v1/journal/{journal_id}` | Yes | Path: `journal_id` | `{"status": "success", "message": "..."}` | `JournalPage` |

### 7.6 Mood & Stress Monitoring (`/api/v1`) — `mood_stress.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `POST` | `/api/v1/moods` | Yes | `MoodCreate` (`score: 1-10`, `valence`, `arousal`, `energy_level`, `tags`, `note`) | `MoodResponse` | Mood logging |
| `GET` | `/api/v1/moods` | Yes | None | `List[MoodResponse]` | `DashboardOverview` |
| `POST` | `/api/v1/stress/evaluate` | Yes | None | `StressObservationResponse` (score, confidence, risk_band, evidence, deviation_from_baseline) | `StressDistressPage` |
| `GET` | `/api/v1/stress/latest` | Yes | None | `Optional[StressObservationResponse]` | `DashboardOverview`, `StressDistressPage` |
| `GET` | `/api/v1/stress/history` | Yes | Query: `limit=14` | `List[StressObservationResponse]` | `StressDistressPage` |
| `POST` | `/api/v1/distress/report` | Yes | `DistressEventCreate` (`risk_level`, `triggers`, `symptoms`) | `DistressEventResponse` | `StressDistressPage` |

### 7.7 AI Companion & Memory (`/api/v1/companion`) — `companion.py`
| Method | URL | Auth? | Request Body / Params | Response Format | Frontend Usage |
|---|---|---|---|---|---|
| `POST` | `/api/v1/companion/chat` | Yes | `ChatMessageCreate` (`content`, `conversation_id`, `typing_dynamics`) | `ChatMessageResponse` | Non-streaming clients |
| `POST` | `/api/v1/companion/chat/stream` | Yes | `ChatMessageCreate` | `text/event-stream` (SSE tokens, tool executions, confirmation events) | `AICompanionPage` |
| `GET` | `/api/v1/companion/conversations` | Yes | None | `List[ConversationSummary]` | `AICompanionPage` |
| `POST` | `/api/v1/companion/conversations` | Yes | `ConversationCreate` (`title`) | `ConversationResponse` | `AICompanionPage` |
| `GET` | `/api/v1/companion/conversations/{id}` | Yes | Path: `conversation_id` | `ConversationResponse` | `AICompanionPage` |
| `DELETE`| `/api/v1/companion/conversations/{id}` | Yes | Path: `conversation_id` | `{"status": "success"}` | `AICompanionPage` |
| `GET` | `/api/v1/companion/conversation` | Yes | None | `ConversationResponse` (default active session) | `AICompanionPage` |
| `POST` | `/api/v1/companion/clear` | Yes | None | `{"status": "success"}` | `AICompanionPage` |
| `POST` | `/api/v1/companion/actions/{id}/confirm`| Yes | Path: `action_id` | `ActionConfirmationResponse` | `AICompanionPage` |
| `POST` | `/api/v1/companion/actions/{id}/cancel` | Yes | Path: `action_id` | `{"status": "cancelled"}` | `AICompanionPage` |
| `GET` | `/api/v1/companion/memories` | Yes | None | `List[MemoryItemResponse]` | `AICompanionPage` |
| `POST` | `/api/v1/companion/memories` | Yes | `MemoryCreate` (`key`, `content`, `memory_type`, `confidence`) | `MemoryItemResponse` | `AICompanionPage` |
| `PUT` | `/api/v1/companion/memories/{id}` | Yes | Path: `memory_id`, Body: `MemoryUpdate` | `MemoryItemResponse` | `AICompanionPage` |
| `DELETE`| `/api/v1/companion/memories/{id}` | Yes | Path: `memory_id` | `{"status": "success"}` | `AICompanionPage` |

### 7.8 Facial Analysis (`/api/v1/facial-analysis`) — `facial.py`
| Method | URL | Auth? | Request Body | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `POST` | `/api/v1/facial-analysis/process-frame` | Yes | `FacialFramePayload` (`image_base64`, `client_timestamp`) | `FacialAnalysisResponse` (smile_ratio, brow_furrow, eye_aperture, stability) | `FacialAnalysisPage` |

### 7.9 Wellness, Wearables & Digital Wellbeing (`/api/v1/wellness`) — `wellness.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/wellness/metrics` | Yes | None | `List[WellnessMetricResponse]` | `WearablesPage` |
| `POST` | `/api/v1/wellness/metrics` | Yes | `WellnessMetricCreate` | `WellnessMetricResponse` | `WearablesPage` |
| `POST` | `/api/v1/wellness/sync-wearables` | Yes | None | `WellnessMetricResponse` (from mock provider) | `WearablesPage` |
| `GET` | `/api/v1/wellness/sleep/summary` | Yes | None | `SleepSummaryResponse` (hours, target, quality, stages, trend_7d) | `WearablesPage` |
| `GET` | `/api/v1/wellness/digital-wellbeing` | Yes | None | `DigitalWellbeingResponse` (screen minutes, focus, pickups, weekly_trends) | `DigitalWellbeingPage` |
| `POST` | `/api/v1/wellness/digital-wellbeing` | Yes | `DigitalWellbeingUpdate` | `DigitalWellbeingResponse` | `DigitalWellbeingPage` |
| `GET` | `/api/v1/wellness/dashboard-summary`| Yes | None | `DashboardSummaryResponse` (all pulse telemetry, habits, trends) | `DashboardOverview` |

### 7.10 Goals & Habits (`/api/v1`) — `goals.py`
| Method | URL | Auth? | Request Body / Params | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/goals` | Yes | None | `List[GoalResponse]` | `GoalsPage`, `DashboardOverview` |
| `POST` | `/api/v1/goals` | Yes | `GoalCreate` (`title`, `description`, `category`, `milestones`) | `GoalResponse` | `GoalsPage` |
| `PUT` | `/api/v1/goals/{goal_id}` | Yes | Path: `goal_id`, Body: `GoalUpdate` | `GoalResponse` | `GoalsPage` |
| `DELETE`| `/api/v1/goals/{goal_id}` | Yes | Path: `goal_id` | `{"message", "id"}` | `GoalsPage` |
| `POST` | `/api/v1/goals/milestones/{id}/toggle` | Yes | Path: `milestone_id` | `GoalResponse` | `GoalsPage` |
| `GET` | `/api/v1/habits` | Yes | Query: `date` (YYYY-MM-DD) | `List[HabitResponse]` | `GoalsPage`, `DashboardOverview` |
| `POST` | `/api/v1/habits` | Yes | `HabitCreate` (`title`, `description`, `category`, `target_frequency`) | `HabitResponse` | `GoalsPage` |
| `PUT` | `/api/v1/habits/{habit_id}` | Yes | Path: `habit_id`, Body: `HabitUpdate` | `HabitResponse` | `GoalsPage` |
| `DELETE`| `/api/v1/habits/{habit_id}` | Yes | Path: `habit_id` | `{"message", "id"}` | `GoalsPage` |
| `POST` | `/api/v1/habits/{habit_id}/toggle` | Yes | Path: `habit_id`, Query: `date` | `HabitResponse` | `GoalsPage`, `DashboardOverview` |

### 7.11 Career Guidance (`/api/v1/career`) — `career.py`
| Method | URL | Auth? | Request Body | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/career/recommendations` | Yes | None | `List[CareerRecommendationResponse]` | `CareerPage` |

### 7.12 Safety Center (`/api/v1/safety`) — `safety.py`
| Method | URL | Auth? | Request Body | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/safety/emergency-contacts` | Yes | None | `List[EmergencyContactResponse]` | `SafetyCenterPage` |
| `POST` | `/api/v1/safety/emergency-contacts` | Yes | `EmergencyContactCreate` (`name`, `relationship`, `phone_number`, `email`) | `EmergencyContactResponse` | `SafetyCenterPage` |
| `POST` | `/api/v1/safety/trigger-alert` | Yes | None | `{"status", "escalation_status", "emergency_hotlines", "immediate_action"}` | `SafetyCenterPage` |

### 7.13 Recommendations (`/api/v1/recommendations`) — `recommendations.py`
| Method | URL | Auth? | Request Body | Response Schema | Frontend Usage |
|---|---|---|---|---|---|
| `GET` | `/api/v1/recommendations` | Yes | None | `List[RecommendationResponse]` | `DashboardOverview` |

---

## 8. AUTHENTICATION & AUTHORIZATION

### 8.1 Complete Login & Token Flow
```
1. User enters Email and Password in LoginPage.tsx
       ↓
2. ApiService.login() issues POST /api/v1/auth/login
       ↓
3. FastAPI Router invokes AuthService.login(email, password)
       ↓
4. UserRepository queries database: SELECT * FROM users WHERE email = :email
       ↓
5. Native Bcrypt verifies password: bcrypt.checkpw(pwd[:72], user.hashed_password)
       ↓
6. AuditRepository logs action "LOGIN" in audit_logs table
       ↓
7. Security module generates signed JWTs:
   - Access Token: HS256 signed, 60 minutes expiry, payload contains {sub: user_id, role, exp, type: "access"}
   - Refresh Token: HS256 signed, 7 days expiry, payload contains {sub: user_id, exp, type: "refresh"}
       ↓
8. FastAPI returns TokenResponse to Frontend
       ↓
9. Frontend stores tokens:
   - localStorage.setItem('guideme_token', access_token)
   - localStorage.setItem('guideme_refresh_token', refresh_token)
   - localStorage.setItem('guideme_user', JSON.stringify(res))
       ↓
10. Subsequent requests include Authorization: Bearer <token> header
       ↓
11. Backend get_current_user dependency validates signature, expiration, and active account status
```

### 8.2 Security Protections & Defenses
- **Strict IDOR Mitigation**: Every domain repository (`JournalRepository`, `GoalRepository`, `HabitRepository`, `ConversationRepository`, `MoodStressRepository`, `WellnessRepository`, `SafetyRepository`) strictly appends `WHERE entity.user_id == current_user.id`. A user cannot view, edit, or delete another user's records.
- **Hash Sanitization**: Password hashes are stripped from all API outputs via Pydantic model response configurations.
- **Complexity Enforcement**: Minimum 8 characters, at least one uppercase, one lowercase, and one numeric character.

### 8.3 Security Weaknesses Identified
1. **Frontend Token Storage**: Tokens are stored in browser `localStorage`. While standard for SPAs and Capacitor native apps, `localStorage` is vulnerable to Cross-Site Scripting (XSS) compared to `HttpOnly` cookies.
2. **CORS Configuration**: `backend/app/core/config.py` contains `*` in the `CORS_ORIGINS` default list alongside `allow_credentials=True`. Although FastAPI's middleware regex restricts origins, having `*` in the origins list can trigger configuration warnings in certain browser engines.
3. **Rate Limiting**: `RATE_LIMIT_PER_MINUTE=120` is defined in `config.py`, but no rate-limiting middleware (such as `slowapi` or Redis token bucket) is actively mounted in `main.py`.

---

## 9. DATABASE ARCHITECTURE

### 9.1 Database Type & Dual Connection Management
- **Target Engine**: PostgreSQL 16 (Production) / SQLite 3 (Automatic Fallback).
- **Asynchronous Driver**: `asyncpg` for Postgres, `aiosqlite` for SQLite.
- **Synchronous Driver**: `psycopg2` for Postgres, `sqlite3` for SQLite.
- **Connection Fallback**: If PostgreSQL at `localhost:5432` cannot be reached within 2 seconds, the engine automatically switches to `guideme_local.db`.

### 9.2 Conceptual Database Relationship Diagram
```
User (PK: id)
├── UserProfile (1-to-1, FK: user_id, CASCADE)
├── UserConsent (1-to-1, FK: user_id, CASCADE)
├── AuditLog (1-to-Many, FK: user_id, SET NULL)
├── PersonalityResult (1-to-Many, FK: user_id, CASCADE)
├── MoodEntry (1-to-Many, FK: user_id, CASCADE)
├── StressObservation (1-to-Many, FK: user_id, CASCADE)
├── DistressEvent (1-to-Many, FK: user_id, CASCADE)
├── Journal (1-to-Many, FK: user_id, CASCADE)
│     └── JournalAnalysis (1-to-1, FK: journal_id, CASCADE)
├── Conversation (1-to-Many, FK: user_id, CASCADE)
│     └── ConversationMessage (1-to-Many, FK: conversation_id, CASCADE)
├── ConversationMemory (1-to-Many, FK: user_id, CASCADE)
├── Goal (1-to-Many, FK: user_id, CASCADE)
│     └── GoalMilestone (1-to-Many, FK: goal_id, CASCADE)
├── Habit (1-to-Many, FK: user_id, CASCADE)
│     └── HabitLog (1-to-Many, FK: habit_id, CASCADE)
├── WellnessMetric (1-to-Many, FK: user_id, CASCADE)
├── WearableConnection (1-to-Many, FK: user_id, CASCADE)
├── DigitalWellbeingMetric (1-to-Many, FK: user_id, CASCADE)
├── BehavioralSignal (1-to-Many, FK: user_id, CASCADE)
├── Recommendation (1-to-Many, FK: user_id, CASCADE)
├── Notification (1-to-Many, FK: user_id, CASCADE)
├── EmergencyContact (1-to-Many, FK: user_id, CASCADE)
└── SafetyEvent (1-to-Many, FK: user_id, CASCADE)

Assessment (PK: id)
├── AssessmentQuestion (1-to-Many, FK: assessment_id, CASCADE)
└── AssessmentAnswer (1-to-Many, FK: assessment_id, CASCADE)
```

### 9.3 Complete Database Tables & Schema Reference (28 Models)
All models reside in `backend/app/models/entities.py`. Primary keys are UUID4 strings (`String(36)`), and timestamps use UTC (`DateTime(timezone=True)`).

1. **`users`**: `id` (PK), `email` (unique, index), `hashed_password`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`.
2. **`user_profiles`**: `id` (PK), `user_id` (FK `users.id`, unique), `full_name`, `preferred_name`, `timezone`, `occupation`, `bio`, `avatar_url`, `created_at`, `updated_at`.
3. **`user_consents`**: `id` (PK), `user_id` (FK `users.id`, unique), `camera_consent`, `audio_consent`, `wearable_consent`, `memory_consent`, `typing_dynamics_consent`, `store_facial_data`, `consent_version`, `updated_at`.
4. **`audit_logs`**: `id` (PK), `user_id` (FK `users.id`, nullable), `action` (index), `resource`, `ip_address`, `user_agent`, `details` (JSON), `created_at` (index).
5. **`assessments`**: `id` (PK), `title`, `assessment_type` (index), `version`, `description`, `is_active`, `created_at`.
6. **`assessment_questions`**: `id` (PK), `assessment_id` (FK `assessments.id`), `question_text`, `domain_trait`, `reverse_scored`, `order_index`.
7. **`assessment_answers`**: `id` (PK), `user_id` (FK `users.id`), `assessment_id` (FK `assessments.id`), `question_id` (FK `assessment_questions.id`), `score_value`, `created_at`.
8. **`personality_results`**: `id` (PK), `user_id` (FK `users.id`), `assessment_id` (FK `assessments.id`), `openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`, `dominant_traits` (JSON), `analysis_summary`, `career_strengths` (JSON), `created_at` (index).
9. **`mood_entries`**: `id` (PK), `user_id` (FK `users.id`), `score` (Float 1.0-10.0), `valence`, `arousal`, `energy_level`, `tags` (JSON), `note`, `recorded_at` (index).
10. **`stress_observations`**: `id` (PK), `user_id` (FK `users.id`), `score` (0-100), `confidence`, `risk_band` (index), `evidence` (JSON), `source`, `deviation_from_baseline`, `recorded_at` (index).
11. **`distress_events`**: `id` (PK), `user_id` (FK `users.id`), `risk_level` (index), `triggers` (JSON), `symptoms` (JSON), `support_recommended` (JSON), `is_resolved`, `recorded_at` (index).
12. **`journals`**: `id` (PK), `user_id` (FK `users.id`), `title`, `content`, `tags` (JSON), `mood_context`, `is_pinned`, `created_at` (index), `updated_at`.
13. **`journal_analyses`**: `id` (PK), `journal_id` (FK `journals.id`, unique), `user_id` (FK `users.id`), `sentiment_score`, `dominant_emotion`, `cognitive_distortions` (JSON), `topics` (JSON), `reflection_prompt`, `recommended_action`, `created_at`.
14. **`conversations`**: `id` (PK), `user_id` (FK `users.id`), `title`, `created_at`, `updated_at`.
15. **`conversation_messages`**: `id` (PK), `conversation_id` (FK `conversations.id`), `user_id` (FK `users.id`), `sender_role` ("user", "assistant", "system"), `content`, `metadata_json` (JSON), `created_at`.
16. **`conversation_memories`**: `id` (PK), `user_id` (FK `users.id`), `memory_type`, `key`, `content`, `confidence`, `is_active`, `created_at`.
17. **`goals`**: `id` (PK), `user_id` (FK `users.id`), `title`, `description`, `category`, `target_date`, `progress_percentage`, `status`, `created_at`, `updated_at`.
18. **`goal_milestones`**: `id` (PK), `goal_id` (FK `goals.id`), `title`, `is_completed`, `completed_at`.
19. **`habits`**: `id` (PK), `user_id` (FK `users.id`), `title`, `description`, `category`, `target_frequency`, `target_per_day`, `streak_count`, `best_streak`, `is_archived`, `created_at`, `updated_at`.
20. **`habit_logs`**: `id` (PK), `habit_id` (FK `habits.id`), `user_id` (FK `users.id`), `date` (YYYY-MM-DD, index), `completed_count`, `notes`, `created_at`.
21. **`wellness_metrics`**: `id` (PK), `user_id` (FK `users.id`), `metric_date` (index), `sleep_hours`, `sleep_quality_score`, `water_intake_ml`, `step_count`, `active_minutes`, `resting_heart_rate`, `hrv_ms`, `calories_burned`, `distance_km`, `sleep_stages` (JSON), `created_at`.
22. **`wearable_connections`**: `id` (PK), `user_id` (FK `users.id`), `provider`, `is_connected`, `device_name`, `last_sync_at`, `created_at`.
23. **`digital_wellbeing_metrics`**: `id` (PK), `user_id` (FK `users.id`), `metric_date` (index), `total_screen_time_minutes`, `focus_time_minutes`, `notification_count`, `night_screen_minutes`, `pickup_count`, `target_limit_minutes`, `categories` (JSON), `created_at`.
24. **`behavioral_signals`**: `id` (PK), `user_id` (FK `users.id`), `signal_type`, `typing_speed_wpm`, `backspace_rate`, `pause_frequency`, `recorded_at`.
25. **`recommendations`**: `id` (PK), `user_id` (FK `users.id`), `category`, `title`, `description`, `reason`, `evidence` (JSON), `priority`, `confidence`, `action_url`, `is_dismissed`, `created_at`.
26. **`notifications`**: `id` (PK), `user_id` (FK `users.id`), `title`, `message`, `category`, `is_read`, `created_at`.
27. **`emergency_contacts`**: `id` (PK), `user_id` (FK `users.id`), `name`, `relationship`, `phone_number`, `email`, `notify_on_distress`, `created_at`.
28. **`safety_events`**: `id` (PK), `user_id` (FK `users.id`), `severity`, `event_type`, `details` (JSON), `support_displayed` (JSON), `resolution_notes`, `created_at`.

---

## 10. USER DATA FLOW

### 10.1 Typical User Journey Lifecycle
```
1. Registration / Login:
   User submits credentials -> /api/v1/auth/login -> JWT received -> saved in localStorage -> redirects to /dashboard.

2. Dashboard Telemetry Synthesis:
   DashboardOverview triggers parallel requests:
   - GET /wellness/dashboard-summary -> computes latest mood, composite stress, sleep, screen time, 7d trends.
   - GET /goals, GET /habits, GET /recommendations.
   - User toggles a habit -> POST /habits/{id}/toggle -> state updates optimistically and synchronizes DB.

3. Cognitive Journaling:
   User composes entry -> POST /api/v1/journal -> backend passes text to NLPEmotionJournalEngine:
   - Sentiment score (-1.0 to +1.0) calculated via positive/negative word hits.
   - Distortions detected via regex patterns.
   - Analysis persisted to journal_analyses table -> UI displays reframing prompt & micro-action.

4. Stress & Personal Baseline Calibration:
   User clicks "Re-Evaluate Stress" -> POST /api/v1/stress/evaluate:
   - Gathers latest mood (weight 0.35), HRV (0.25), sleep (0.15), screen time (0.15), sentiment (0.10).
   - Queries previous 14 days of stress scores.
   - Computes z-score = (X - mean) / std.
   - Saves StressObservation -> UI renders risk band & deviation.

5. AI Companion Dialogue:
   User types message -> POST /api/v1/companion/chat/stream:
   - SafetyGuardrailEngine inspects message for crisis keywords.
   - If crisis: records SafetyEvent, halts normal dialogue, returns Indian emergency hotlines.
   - If safe: AIContextBuilder compiles user's current mood, stress band, sleep, active goals, habits, and consented memories.
   - Gemini / MockLLMProvider streams tokens via SSE.
   - If tool requested (e.g. "create goal"): ToolDispatcher executes DB action.
   - If destructive tool (e.g. "delete goal"): pauses, issues confirmation payload with action_id.
   - Consented memory facts extracted and saved to conversation_memories.

6. Data Sovereignty & Account Deletion:
   User enters PrivacyCenterPage:
   - Toggles sensor permissions -> PUT /profile/consent -> updates user_consents.
   - Clicks "Export My Data" -> GET /profile/export-data -> browser triggers JSON file download.
   - Clicks "Delete Account" -> DELETE /profile/delete-account -> cascades across all 28 tables.
```

---

## 11. PERSONALITY / OCEAN SYSTEM

- **Scientific Framework**: Big Five Factor model based on the International Personality Item Pool (IPIP) 50-item questionnaire.
- **Five Core Dimensions**:
  1. **Openness to Experience**: Intellectual curiosity, artistic appreciation, unconventional thought.
  2. **Conscientiousness**: Self-discipline, systematic organization, goal-directed behavior.
  3. **Extraversion**: Social vitality, assertiveness, positive emotionality.
  4. **Agreeableness**: Empathy, altruism, cooperativeness.
  5. **Neuroticism** (Emotional Reactivity): Autonomic sensitivity, anxiety vulnerability.
- **Question Storage**: Questions are seeded into `assessment_questions` table by `app.seed`. If DB table is empty, `assessments.py` falls back to `OceanBigFiveEngine.QUESTIONS_DATA` in memory.
- **Scoring Execution**: Scoring occurs entirely on the **backend** inside `OceanBigFiveEngine.calculate_scores()`:
  - Takes Likert scale values (1: Very Inaccurate to 5: Very Accurate).
  - Handles reverse scoring: $\text{Effective Score} = 6 - \text{Raw Score}$.
  - Averages domain responses and maps to percentage:
    $$\text{Percentage} = \left(\frac{\text{Average} - 1.0}{4.0}\right) \times 100\%$$
- **Interpretation & Career Mapping**:
  - `OceanBigFiveEngine.interpret_profile()` classifies scores:
    - $\ge 65\%$: High trait (adds dominant tag, descriptive narrative, and matched career pathways).
    - $\le 35\%$: Low trait (descriptive narrative and pragmatic focus areas).
    - $36\%–64\%$: Balanced profile.
- **Retaking & History**: Users can retake the assessment at any time via "Retake Assessment" button in `PersonalityPage.tsx`. Each submission creates a new timestamped record in `personality_results`.

---

## 12. CHATBOT / AI COMPANION

### 12.1 Real Dynamic Functionality vs. Fallbacks
- **Dual-Mode Engine Architecture**:
  1. **Google Gemini (`GeminiProvider`)**:
     - Configured when `GEMINI_API_KEY` is provided in `.env`.
     - Uses model `gemini-1.5-flash` via HTTP endpoints.
     - Supports Server-Sent Events (SSE) streaming (`POST /companion/chat/stream`).
     - Native tool/function declarations for 9 operations.
  2. **Local Intelligent Fallback (`MockLLMProvider`)**:
     - Automatically active out-of-the-box when `GEMINI_API_KEY` is empty.
     - Context-sensitive heuristic agent that parses user name, recent assistant turns, affirmative/negative intents, and keywords.
     - Executes real local tools (creates goals, habits) and extracts structured memories.
     - Never repeats static canned phrases; adapts dynamically across multi-turn exchanges.
  3. **External Provider (`ExternalLLMProvider`)**:
     - Optional OpenAI fallback (`gpt-4o-mini`) if `AI_PROVIDER=openai` and `OPENAI_API_KEY` is provided.

### 12.2 Native Platform Tools (`ToolDispatcher`)
The companion has 9 declared tools:
1. `create_goal`: Creates a goal with title, category, target date, and milestones.
2. `update_goal`: Updates title, status, or percentage.
3. `delete_goal`: **Destructive action** — triggers confirmation prompt.
4. `create_habit`: Creates a daily or weekly habit.
5. `complete_habit`: Logs completion for today.
6. `delete_habit`: **Destructive action** — triggers confirmation prompt.
7. `create_journal_entry`: Saves a journal reflection with automatic NLP analysis.
8. `get_user_wellbeing_data`: Queries active goals, habits, sleep, stress, or digital wellbeing.
9. `log_quick_mood`: Logs a mood score (1.0 to 10.0).

### 12.3 Destructive Action Safety Barrier
- Destructive operations (`delete_goal`, `delete_habit`) are intercepted by `ToolDispatcher.execute()`.
- Generates a UUID `action_id`, stores payload in `PENDING_DESTRUCTIVE_ACTIONS` with a 15-minute expiration, and returns `confirmation_required: True`.
- The frontend renders an interactive confirmation card:
  - **Confirm** -> issues `POST /companion/actions/{action_id}/confirm` -> executes deletion.
  - **Cancel** -> issues `POST /companion/actions/{action_id}/cancel` -> purges pending cache.

### 12.4 Memory Transparency & Governance
- Consented memories are automatically extracted by the provider (e.g. preferences, identified stressors, goals) and persisted to `conversation_memories`.
- Users can view all memories in the **Memories** tab of `AICompanionPage`, search, edit text, or permanently delete them with one click.

---

## 13. SAFETY / DISTRESS / CRISIS SYSTEM

> [!IMPORTANT]
> **Clinical Notice & Scope**:
> GUIDE ME is explicitly designed for educational self-awareness, lifestyle balance, and preventative mindfulness. It is **not a diagnostic medical device** and does not provide psychiatric diagnoses or medical treatments.

### 13.1 Crisis Detection & Escalation Architecture
- **Layer 1: Input Keyword Interception (`SafetyGuardrailEngine`)**:
  - Scans user messages against clinical crisis regex patterns (`suicid`, `kill myself`, `end my life`, `want to die`, `better off dead`, `self-harm`, `hurt myself`, `no reason to live`, `can't go on anymore`).
  - If triggered:
    - Suspends normal generative companion dialogue.
    - Emits emergency crisis response text with 24/7 hotline numbers.
    - Asynchronously logs an urgent safety event to `safety_events` table.
- **Layer 2: Diagnostic Guardrail**:
  - Scans for clinical medical inquiries (`diagnose me`, `do i have bipolar`, `what medication should i take`, `prescribe me`).
  - Responds with an advisory notice that the AI cannot provide medical diagnoses and recommends licensed professional care.
- **Layer 3: Acute Distress Self-Report (`POST /distress/report`)**:
  - Users can log acute symptoms (e.g., panic, palpitations, severe anxiety) via `StressDistressPage`.
  - Persists record in `distress_events` table with recommended support lines.
- **Layer 4: Emergency SOS Trigger (`POST /safety/trigger-alert`)**:
  - Triggered via the persistent SOS button in `DashboardLayout` or `SafetyCenterPage`.
  - Records a critical safety event in `safety_events` and returns verified national emergency resources.

### 13.2 Verified Regional Hotlines (India & International)
- **Tele-MANAS** (Govt. of India 24/7 Toll-Free): `14416` or `1800-891-4416` (20+ Indian languages managed by NIMHANS).
- **KIRAN Mental Health Helpline**: `1800-599-0019` (Ministry of Social Justice, 24/7).
- **Vandrevala Foundation Helpline**: `+91 9999 666 555` (Free 24/7 clinical counseling).
- **National Emergency Services**: `112` (Police, Fire, Ambulance).
- **AASRA 24/7 Suicide Prevention**: `+91 98204 66726`.
- **NIMHANS Psychosocial Helpline**: `080-46110007`.
- **International Resources**: `https://findahelpline.com`, US/Canada `988`, UK `116 123`.

---

## 14. WELLNESS FEATURES STATUS AUDIT

| Feature | Codebase Status | Underlying Implementation |
|---|---|---|
| **Mood Tracking** | **IMPLEMENTED** | `MoodEntry` table, `POST /moods`, historical queries, 1–10 scale, valence, energy levels. |
| **Cognitive Journaling** | **IMPLEMENTED** | `Journal` & `JournalAnalysis` tables, `NLPEmotionJournalEngine`, distortion detection. |
| **Wellness Goals & Milestones** | **IMPLEMENTED** | `Goal` & `GoalMilestone` tables, `POST /goals`, milestone toggle, progress percentage calculation. |
| **Daily Habit Tracker & Streaks** | **IMPLEMENTED** | `Habit` & `HabitLog` tables, `POST /habits/{id}/toggle`, streak counting, best streak tracking. |
| **Sleep Tracking & Architecture** | **IMPLEMENTED** | `WellnessMetric` table, `GET /wellness/sleep/summary`, deep/REM/light/awake stages, manual log modal. |
| **Step Count & Calories** | **IMPLEMENTED** | `WellnessMetric` fields (`step_count`, `calories_burned`, `distance_km`, `active_minutes`). |
| **Heart Rate Variability (HRV)** | **IMPLEMENTED** | `WellnessMetric.hrv_ms`, resting HR, used in `StressDistressEngine`. |
| **Screen Time & Curfew** | **IMPLEMENTED** | `DigitalWellbeingMetric`, target limits, weekly trends, categories, manual logging. |
| **Camera-Based Facial Signals** | **IMPLEMENTED** | `FacialAnalysisEngine` using OpenCV Haar cascades in RAM; live viewfinder in `FacialAnalysisPage`. |
| **Big Five Personality (OCEAN)** | **IMPLEMENTED** | `OceanBigFiveEngine`, 50-item IPIP inventory, radar chart, career mapping. |
| **Wearable Hardware Sync** | **MOCKED / SIMULATED**| `MockWearableProvider` returns simulated physiological biometrics; Fitbit/Apple/Google are interface stubs. |
| **Typing Dynamics** | **PARTIALLY IMPLEMENTED**| `BehavioralSignal` model exists; toggle in `AICompanionPage.tsx` records key/backspace counts; backend engine not yet analyzing rhythms. |
| **Audio / Voice Processing** | **PARTIALLY IMPLEMENTED**| Frontend uses Web Speech API for speech-to-text and text-to-speech; backend audio streaming endpoint not implemented. |
| **Career Trajectory Mapping** | **PARTIALLY IMPLEMENTED**| Frontend UI and backend endpoints exist; recommendations are static response templates based on assessment presence. |

---

## 15. SETTINGS, THEMING & UI SYSTEM

- **Design System**: Sustainable, low-cognitive-overhead palette built around nature-grounded earth, sage, and forest tokens.
- **Light / Dark Mode**:
  - Toggled via `ThemeToggle.tsx`.
  - Persists preference in `localStorage.getItem('guideme_theme')` (`'dark'` or `'light'`).
  - Automatically respects OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
  - Applies `.dark` class to `document.documentElement`.
- **Responsive Layout**:
  - Uses CSS flexbox and grid breakpoints (`sm:`, `md:`, `lg:`).
  - On desktop: Fixed left navigation drawer (`md:w-64`).
  - On mobile: Hidden sidebar replaced by top mobile header with hamburger button and slide-out overlay drawer.
  - Tested and fully responsive on phone screens (320px to 480px width) and tablets.
- **Server Configuration Modal (`ServerConfigModal.tsx`)**:
  - Accessible from the login screen.
  - Allows changing the backend URL on phones running the APK (`http://192.168.X.X:8000/api/v1`).
  - Includes a live "Test Connection" button calling `/health` before saving.

---

## 16. STATIC & MOCK DATA AUDIT

| File Path | Component / Function | What is Hardcoded / Mocked | Where It Appears | Real DB vs Mock Status | Action Required to Productionize |
|---|---|---|---|---|---|
| `backend/app/api/v1/career.py` | `get_career_recommendations()` | Hardcoded recommendation objects (Systems Architect, UX AI Research Engineer, Technology Strategist). | `/dashboard/career` | **HARDCODED TEMPLATE DATA** | Replace with dynamic vector search / LLM psychometric synthesis. |
| `backend/app/integrations/wearable_provider.py` | `MockWearableProvider.fetch_latest_metrics()` | Hardcoded biometric values (`sleep_hours: 7.4`, `hrv_ms: 54.0`, `step_count: 8240`). | `/wellness/sync-wearables` | **SIMULATED DEMO DATA** | Connect live OAuth 2.0 PKCE APIs for Fitbit, Apple HealthKit, Google Health Connect. |
| `backend/app/integrations/wearable_provider.py` | `FitbitProvider`, `AppleHealthProvider`, `GoogleHealthProvider` | Return hardcoded mock dictionary with `is_simulated_demo: True`. | `/wellness/sync-wearables` | **INTERFACE STUB** | Implement live API adapter HTTP requests. |
| `backend/app/seed.py` | `seed_database()` | Demo user `demo@guideme.com` / `DemoUser123!` (Jordan Chen) with 7 days of historical logs. | Initial database seed | **TEST / DEMO DATA** | Keep for zero-config evaluation; clear before production deployment. |
| `backend/app/ai/providers.py` | `MockLLMProvider` | Rule-based dialog heuristics and simulated breathing exercises. | `/companion/chat` when no API key | **DYNAMIC LOCAL HEURISTIC** | Active when `GEMINI_API_KEY` is not provided. |
| `backend/app/api/v1/safety.py` & `SafetyCenterPage.tsx` | `verifiedIndiaHelplines` | Array of verified Indian crisis helpline names and telephone numbers. | `/dashboard/safety` | **STATIC UI DIRECTORY** | Real public phone numbers; keep static or load from administrative DB table. |
| `ml/models/train_sentiment.py` | `SAMPLE_TRAINING_DATA` | 10 sample sentences for Naive Bayes emotion training. | Standalone ML script | **PROTOTYPE DATA** | Standalone file; not loaded by the application. |

---

## 17. MOBILE & ANDROID READINESS

### 17.1 Current Mobile State
- **APK Status**: A standalone debug APK has already been compiled: `GuideMe-v1.0.apk` (4,401,803 bytes / 4.2 MB) in the project root.
- **Capacitor Configuration (`capacitor.config.ts`)**:
  ```typescript
  appId: 'com.guideme.app'
  appName: 'GuideMe'
  webDir: 'dist'
  server: { androidScheme: 'https', cleartext: true }
  android: { allowMixedContent: true }
  ```
- **Android Manifest (`frontend/android/app/src/main/AndroidManifest.xml`)**:
  - `android:usesCleartextTraffic="true"` (Allows HTTP requests over local Wi-Fi to PC backend).
  - Permissions declared: `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.

### 17.2 Cross-Device Phone Connectivity
- When running the app on a physical phone:
  1. The phone and PC must be connected to the same Wi-Fi network.
  2. The backend must be launched with host `0.0.0.0`:
     ```powershell
     python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
     ```
  3. On the phone, open GuideMe, tap the **Server** icon on the login screen, and enter:
     `http://<PC_LOCAL_IP>:8000/api/v1` (e.g. `http://192.168.1.15:8000/api/v1`).
  4. Alternatively, use the included Cloudflare tunnel:
     ```powershell
     .\cloudflared.exe tunnel --url http://127.0.0.1:8000
     ```
     and enter the generated `https://*.trycloudflare.com/api/v1` in the Server modal.

### 17.3 How to Rebuild the APK
Run the PowerShell build pipeline from the project root:
```powershell
.\build-apk.ps1
```
This script automatically compiles the Vite web bundle (`npm run build`), syncs assets to Android (`npx cap sync android`), invokes the Gradle wrapper (`gradlew.bat assembleDebug`), and copies the resulting APK to `GuideMe-v1.0.apk`.

---

## 18. ENVIRONMENT VARIABLES

All variables defined in `backend/app/core/config.py` and `.env.example`:

| Variable Name | Purpose | Required? | Default Value | Where Used |
|---|---|---|---|---|
| `PROJECT_NAME` | Name of application | No | `"GUIDE ME - FINAL"` | `config.py`, `main.py` |
| `ENVIRONMENT` | Runtime environment | No | `"development"` | `config.py`, `main.py` |
| `DEBUG` | Enable debug logs | No | `True` | `config.py`, `main.py` |
| `API_V1_PREFIX` | Prefix for versioned endpoints | No | `"/api/v1"` | `config.py`, `main.py` |
| `SECRET_KEY` | Cryptographic secret for signing JWTs | **YES in Production** | `[REDACTED]` | `security.py` |
| `ALGORITHM` | JWT signing algorithm | No | `"HS256"` | `security.py` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | No | `60` | `security.py` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan | No | `7` | `security.py` |
| `PASSWORD_MIN_LENGTH` | Minimum password length | No | `8` | `security.py` |
| `DATABASE_URL` | Asynchronous PostgreSQL connection string | Optional (falls back to SQLite) | `"postgresql+asyncpg://..."` | `database.py` |
| `DATABASE_URL_SYNC` | Synchronous PostgreSQL connection string | Optional (falls back to SQLite) | `"postgresql://..."` | `database.py` |
| `DATABASE_FALLBACK_SQLITE` | Enable automatic local SQLite fallback | No | `True` | `database.py` |
| `DATABASE_SQLITE_URL` | Asynchronous SQLite connection string | No | `"sqlite+aiosqlite:///./guideme_local.db"` | `database.py` |
| `DATABASE_SQLITE_URL_SYNC` | Synchronous SQLite connection string | No | `"sqlite:///./guideme_local.db"` | `database.py` |
| `CORS_ORIGINS` | Permitted CORS frontend origins | No | `["http://localhost:5173", ...]` | `main.py` |
| `AI_PROVIDER` | LLM provider selection (`"gemini"`, `"mock"`, `"openai"`) | No | `"gemini"` | `providers.py` |
| `GEMINI_API_KEY` | Google Gemini API Key | Optional (runs mock if blank) | `[REDACTED]` | `gemini_provider.py` |
| `GEMINI_MODEL` | Gemini model selection | No | `"gemini-1.5-flash"` | `gemini_provider.py` |
| `OPENAI_API_KEY` | OpenAI API Key (Optional fallback) | Optional | `[REDACTED]` | `providers.py` |
| `AI_MODEL_NAME` | OpenAI model selection | No | `"gpt-4o-mini"` | `providers.py` |
| `WEARABLE_PROVIDER` | Wearable provider (`"mock"`, `"fitbit"`, etc.) | No | `"mock"` | `wearable_provider.py` |
| `FITBIT_CLIENT_ID` | Fitbit Developer OAuth Client ID | Optional | `""` | `wearable_provider.py` |
| `FITBIT_CLIENT_SECRET` | Fitbit Developer OAuth Client Secret | Optional | `[REDACTED]` | `wearable_provider.py` |
| `PRIVACY_ALLOW_RAW_FACIAL_STORAGE` | Prohibits persisting facial video/photos | No | `False` | `config.py` |
| `RATE_LIMIT_PER_MINUTE` | Rate limiting threshold | No | `120` | `config.py` |
| `SAFETY_CRISIS_HOTLINE_DEFAULT`| Default crisis hotline identifier | No | `"988"` (or `"14416"` in `.env`) | `config.py` |
| `SAFETY_CRISIS_INTERNATIONAL_INFO`| Global crisis directory URL | No | `"https://findahelpline.com"` | `config.py` |

---

## 19. RUNNING THE PROJECT

### 19.1 Prerequisites
- **OS**: Windows 10/11 with **Git Bash** or PowerShell.
- **Python**: Python 3.10+ (tested on Python 3.13.15).
- **Node.js**: Node.js v18+ and npm (tested on Node v24.20.0).
- **Rule**: No Python virtual environment required (`requirements.txt` installs directly).

### 19.2 Step-by-Step Terminal Commands

#### Option A: Automated Git Bash Runner (Recommended)
```bash
# In Git Bash:
cd "GUIDE ME - FINAL"

# 1. Install dependencies and seed demo database
./scripts/setup.sh

# 2. Launch Backend and Frontend concurrently
./scripts/start_all.sh
```

#### Option B: Manual Windows PowerShell Terminals

**Terminal 1 (Backend)**:
```powershell
cd "GUIDE ME - FINAL\backend"
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend)**:
```powershell
cd "GUIDE ME - FINAL\frontend"
npm run dev
```

**Terminal 3 (Seed Database - First run only)**:
```powershell
cd "GUIDE ME - FINAL\backend"
$env:PYTHONPATH="."
python -m app.seed
```

### 19.3 Ports & URLs
- **Web Application**: `http://127.0.0.1:5173`
- **FastAPI Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **FastAPI ReDoc**: `http://127.0.0.1:8000/redoc`
- **Backend Health Check**: `http://127.0.0.1:8000/health`
- **Database Ports**: Local SQLite runs in-process (`guideme_local.db`); PostgreSQL if active runs on `localhost:5432`.

### 19.4 Pre-Seeded Demo Credentials
- **Email**: `demo@guideme.com`
- **Password**: `DemoUser123!`
- *(Or click "Load Demo Account (Jordan Chen)" on the login screen).*

---

## 20. CURRENT ISSUES & AUDIT FINDINGS

### 20.1 Issue Classification Table
| Priority | Problem Description | File Location | Root Cause | Impact | Suggested Fix |
|---|---|---|---|---|---|
| **MEDIUM** | Wildcard in CORS origins alongside credentials | `backend/app/core/config.py` (line 38) | `"*" ` is included in `CORS_ORIGINS` while `allow_credentials=True` is enabled in `main.py`. | Certain strict browser engines disallow `Access-Control-Allow-Origin: *` when credentials are included. | Remove `"*"` from `CORS_ORIGINS` and rely strictly on the explicit host origins and regex. |
| **MEDIUM** | Rate limiting configuration unused | `backend/app/core/config.py` (line 63) | `RATE_LIMIT_PER_MINUTE=120` is declared but no rate-limiting middleware is attached to `FastAPI`. | Endpoints are vulnerable to rapid automated request flooding. | Mount `slowapi` or custom Redis sliding-window middleware. |
| **LOW** | Career recommendations return hardcoded templates | `backend/app/api/v1/career.py` | Static responses defined directly in router function. | Career recommendations do not vary dynamically based on subtle Big Five trait percentages. | Wire `career.py` into a dynamic prompt sent to `GeminiProvider` or psychometric database matrix. |
| **LOW** | Wearable hardware providers are interface stubs | `backend/app/integrations/wearable_provider.py` | Real OAuth 2.0 PKCE tokens for Fitbit/Apple/Google are not yet exchanged. | Real fitness trackers cannot synchronize live steps/HRV without manual entry or simulation. | Complete OAuth token exchange routes for Fitbit and Google Health Connect. |
| **LOW** | Empty Alembic migrations directory | `backend/migrations/versions` | Schema changes were handled via SQLAlchemy `create_all` and manual SQLite PRAGMAs. | Alembic commands (`alembic upgrade head`) will not execute revisions. | Generate initial Alembic revision (`alembic revision --autogenerate -m "initial"`). |
| **LOW** | Large JavaScript bundle warning during Vite build | `frontend/dist/assets/index-Di_tV5Qy.js` (844 kB) | Recharts, Lucide, and all page components are bundled into a single chunk. | Slightly slower initial page load on slow 3G mobile networks. | Introduce React lazy loading (`React.lazy(() => import(...))`) for router pages. |

---

## 21. SECURITY AUDIT

1. **Authentication & Token Expiry**:
   - Access tokens expire after 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES=60`).
   - Refresh tokens expire after 7 days (`REFRESH_TOKEN_EXPIRE_DAYS=7`).
   - Tokens are cryptographically signed with HS256 using `SECRET_KEY`.
2. **Password Security**:
   - Native Bcrypt algorithm with 12 salt rounds (`bcrypt.gensalt(rounds=12)`).
   - Passwords truncated at 72 bytes to avoid Bcrypt boundary bypass.
   - Enforced password complexity: minimum 8 characters, uppercase, lowercase, digits.
3. **Insecure Direct Object Reference (IDOR)**:
   - Verified across all repositories. Every SQL query explicitly scopes records:
     `SELECT ... WHERE entity.user_id == current_user.id` and `DELETE ... WHERE entity.user_id == current_user.id`.
   - Verified by automated test in `tests/test_backend.py:test_auth_and_idor_protection`.
4. **Biometric Privacy**:
   - Facial frames sent to `/api/v1/facial-analysis/process-frame` are decoded into NumPy arrays in RAM and immediately discarded.
   - Zero image or video bytes are written to disk or database tables.
   - `PRIVACY_ALLOW_RAW_FACIAL_STORAGE` is strictly locked to `False`.
5. **Audit Logging**:
   - Critical events (`LOGIN`, `REGISTER`, `UPDATE_CONSENT`, `DATA_EXPORT`, `DELETE_ACCOUNT`, `REPORT_DISTRESS`) create immutable records in `audit_logs` with timestamps and client IP metadata.

---

## 22. FRONTEND ↔ BACKEND CONNECTION MAP

| Frontend Component / Action | Frontend API Method | HTTP Endpoint | Backend Router | Backend Service / Engine | Database Table Affected |
|---|---|---|---|---|---|
| **User Sign In** | `ApiService.login()` | `POST /auth/login` | `auth.py` | `AuthService.login()` | Reads `users`, writes `audit_logs` |
| **User Registration** | `ApiService.register()` | `POST /auth/register` | `auth.py` | `AuthService.register()` | Inserts `users`, `user_profiles`, `user_consents`, `audit_logs` |
| **Dashboard Pulse** | `ApiService.getDashboardSummary()` | `GET /wellness/dashboard-summary` | `wellness.py` | `WellnessRepository`, `MoodStressRepository` | Reads `mood_entries`, `stress_observations`, `wellness_metrics`, `habits` |
| **Log Today's Mood** | `ApiService.logMood()` | `POST /moods` | `mood_stress.py` | `MoodStressRepository.log_mood()` | Inserts `mood_entries`, writes `audit_logs` |
| **Re-Evaluate Stress**| `ApiService.evaluateStress()` | `POST /stress/evaluate` | `mood_stress.py` | `StressDistressEngine` & `PersonalBaselineCalculator` | Reads recent metrics; inserts `stress_observations` |
| **Report Distress** | `ApiService.reportDistress()` | `POST /distress/report` | `mood_stress.py` | `MoodStressRepository.log_distress()` | Inserts `distress_events`, writes `audit_logs` |
| **Create Journal** | `ApiService.createJournal()` | `POST /journal` | `journal.py` | `JournalService.create_entry()` & `NLPEmotionJournalEngine` | Inserts `journals`, `journal_analyses`, `audit_logs` |
| **Delete Journal** | `ApiService.deleteJournal()` | `DELETE /journal/{id}` | `journal.py` | `JournalService.delete_entry()` | Deletes from `journals` (cascades to `journal_analyses`) |
| **Stream Chat Message**| `ApiService.streamChatMessage()` | `POST /companion/chat/stream` | `companion.py` | `CompanionService.process_message_stream()` & `GeminiProvider` / `MockLLMProvider` | Inserts `conversation_messages`, updates `conversation_memories` |
| **Confirm Action** | `ApiService.confirmAction()` | `POST /companion/actions/{id}/confirm` | `companion.py` | `ToolDispatcher.confirm_action()` | Deletes target goal/habit from `goals` or `habits` |
| **Submit OCEAN Test**| `ApiService.submitOcean()` | `POST /assessments/ocean/submit` | `assessments.py` | `AssessmentService.submit_assessment()` & `OceanBigFiveEngine` | Inserts `assessment_answers`, inserts `personality_results` |
| **Facial Frame Scan**| `ApiService.processFacialFrame()` | `POST /facial-analysis/process-frame` | `facial.py` | `FacialAnalysisEngine` (OpenCV) | Zero DB writes (RAM-only processing) |
| **Sync Wearables** | `ApiService.syncWearables()` | `POST /wellness/sync-wearables` | `wellness.py` | `MockWearableProvider` | Inserts `wellness_metrics`, writes `audit_logs` |
| **Manual Sleep Log**| `ApiService.logWellnessMetric()` | `POST /wellness/metrics` | `wellness.py` | `WellnessRepository.log_metric()` | Inserts `wellness_metrics` |
| **Digital Screen Log**| `ApiService.updateDigitalWellbeing()` | `POST /wellness/digital-wellbeing`| `wellness.py` | `WellnessRepository.log_digital_wellbeing()` | Inserts/Updates `digital_wellbeing_metrics` |
| **Toggle Habit** | `ApiService.toggleHabit()` | `POST /habits/{id}/toggle` | `goals.py` | `HabitRepository.toggle_completion()` | Inserts/Deletes `habit_logs`, updates `habits.streak_count` |
| **Create Goal** | `ApiService.createGoal()` | `POST /goals` | `goals.py` | `GoalRepository.create()` | Inserts `goals`, `goal_milestones` |
| **Trigger SOS Alert**| `ApiService.triggerEmergencyAlert()`| `POST /safety/trigger-alert` | `safety.py` | `SafetyRepository.log_safety_event()` | Inserts `safety_events` |
| **Save Privacy Consent**| `ApiService.updateConsent()` | `PUT /profile/consent` | `users.py` | `UserRepository.update_consent()` | Updates `user_consents`, writes `audit_logs` |
| **Export Personal Data**| `ApiService.exportData()` | `GET /profile/export-data` | `users.py` | Queries `journals`, `mood_entries`, `goals` | Zero DB writes; logs to `audit_logs` |
| **Delete Account** | `ApiService.deleteAccount()` | `DELETE /profile/delete-account` | `users.py` | `db.delete(current_user)` | Cascades through all 28 tables |

---

## 23. FEATURE STATUS TABLE

| Feature | Frontend | Backend | Database | Real / Dynamic vs Mocked | Overall Status |
|---|---|---|---|---|---|
| **User Registration** | `RegisterPage.tsx` | `/api/v1/auth/register` | `users`, `user_profiles`, `user_consents` | Real / Dynamic | **COMPLETE** |
| **User Authentication** | `LoginPage.tsx` | `/api/v1/auth/login` | `users`, `audit_logs` | Real / Dynamic (Bcrypt + JWT) | **COMPLETE** |
| **Dashboard Telemetry** | `DashboardOverview.tsx` | `/wellness/dashboard-summary` | Multi-table read | Real / Dynamic | **COMPLETE** |
| **Cognitive Journaling**| `JournalPage.tsx` | `/api/v1/journal` | `journals`, `journal_analyses` | Real / Dynamic (NLP Engine) | **COMPLETE** |
| **Big Five Personality**| `PersonalityPage.tsx` | `/api/v1/assessments/ocean/*`| `assessments`, `personality_results` | Real / Dynamic (50-Item IPIP) | **COMPLETE** |
| **Multimodal Stress** | `StressDistressPage.tsx`| `/api/v1/stress/evaluate` | `stress_observations` | Real / Dynamic (Z-score baseline) | **COMPLETE** |
| **Distress Reporting** | `StressDistressPage.tsx`| `/api/v1/distress/report` | `distress_events` | Real / Dynamic | **COMPLETE** |
| **AI Companion Chat** | `AICompanionPage.tsx` | `/companion/chat/stream` | `conversation_messages`, `memories` | Real (Gemini API) & Dynamic Heuristic (Mock Fallback) | **COMPLETE** |
| **Companion Tools** | `AICompanionPage.tsx` | `/companion/actions/*` | `goals`, `habits`, `PENDING_ACTIONS` | Real Dynamic Tool Execution with Destructive Confirmation | **COMPLETE** |
| **Transparent Memory** | `AICompanionPage.tsx` | `/companion/memories` | `conversation_memories` | Real / Dynamic CRUD | **COMPLETE** |
| **Facial Landmark Scan**| `FacialAnalysisPage.tsx`| `/facial-analysis/process-frame`| In-Memory RAM only | Real / Dynamic (OpenCV Haar cascades) | **COMPLETE** |
| **Habit & Streak Track**| `GoalsPage.tsx` | `/api/v1/habits` | `habits`, `habit_logs` | Real / Dynamic | **COMPLETE** |
| **Goal Milestones** | `GoalsPage.tsx` | `/api/v1/goals` | `goals`, `goal_milestones` | Real / Dynamic | **COMPLETE** |
| **Safety Center & SOS** | `SafetyCenterPage.tsx` | `/api/v1/safety/*` | `emergency_contacts`, `safety_events`| Real / Dynamic | **COMPLETE** |
| **Privacy Sovereignty**| `PrivacyCenterPage.tsx`| `/api/v1/profile/*` | `user_consents`, full export | Real / Dynamic | **COMPLETE** |
| **Wearable Hub Sync** | `WearablesPage.tsx` | `/wellness/sync-wearables` | `wellness_metrics` | **MOCKED / SIMULATED** (BioSensor Sim) | **MOCKED** |
| **Digital Wellbeing** | `DigitalWellbeingPage.tsx`| `/wellness/digital-wellbeing` | `digital_wellbeing_metrics` | Real DB tracking / Manual entry (No native OS hook) | **PARTIALLY IMPLEMENTED** |
| **Career Trajectories**| `CareerPage.tsx` | `/career/recommendations` | Reads `personality_results` | **HARDCODED TEMPLATES** | **PARTIALLY IMPLEMENTED** |
| **Typing Dynamics** | `AICompanionPage.tsx` | `/companion/chat` payload | `behavioral_signals` | Keycount tracked in UI; backend analysis not active | **PARTIALLY IMPLEMENTED** |
| **Voice Interaction** | `AICompanionPage.tsx` | Web Speech API | Browser local | Client-side only; no backend speech endpoint | **PARTIALLY IMPLEMENTED** |
| **Android APK Package** | Capacitor 8 Project | `build-apk.ps1` | N/A | Real build pipeline (`GuideMe-v1.0.apk`) | **COMPLETE** |

---

## 24. KNOWN DESIGN DECISIONS

1. **Why FastAPI + SQLAlchemy 2.0 (Async)**:
   - High-throughput asynchronous endpoints required for Server-Sent Events (SSE) token streaming from LLM providers.
   - Automated OpenAPI schema generation keeps API contracts strictly typed.
   - Pydantic v2 models provide microsecond serialization and automatic hash sanitization.
2. **Why Dual Database (PostgreSQL + SQLite Fallback)**:
   - Eliminates development onboarding friction: developers and evaluators can clone and run `start_all.sh` instantly without provisioning a PostgreSQL service.
   - Seamlessly switches to enterprise PostgreSQL when `DATABASE_URL` is available.
3. **Personal Baseline Sovereignty ($z$-Score Deviation)**:
   - Evaluates physiological signals (HRV, sleep, screen time) against an individual's personal 14-day rolling mean and standard deviation:
     $$z = \frac{X - \mu_{14}}{\sigma_{14}}$$
   - Prevents pathologizing healthy individuals who naturally deviate from generic population averages.
4. **RAM-Only In-Memory Facial Processing**:
   - Rejects the storage of facial photos or video streams to prevent biometric data compromise.
   - Computes superficial landmark variance proxies in volatile memory and immediately dereferences byte payloads for garbage collection.
5. **Destructive Tool Calling Barrier**:
   - Protects users from unintended data loss caused by generative AI hallucinations. Deleting goals or habits pauses execution and requires explicit human confirmation.
6. **No Virtual Environment Mandate**:
   - Tailored to host environments where global Python installations are managed directly.

---

## 25. COMPLETE FILE-BY-FILE REFERENCE

### 25.1 Backend Core (`backend/app/core/`)
- **`config.py`**:
  - *Purpose*: Loads, validates, and exposes all system configurations.
  - *Classes*: `Settings(BaseSettings)`.
  - *Key Variables*: `settings = Settings()`.
  - *Depends on*: `pydantic_settings`, `pydantic`.
  - *Used by*: Throughout backend.
- **`database.py`**:
  - *Purpose*: Manages dual async/sync database engines, session generators, and in-code SQLite PRAGMA migrations.
  - *Key Functions*: `get_async_db()`, `get_sync_db()`, `init_db_tables()`.
  - *Key Variables*: `Base`, `async_engine`, `AsyncSessionLocal`, `sync_engine`, `SyncSessionLocal`.
  - *Depends on*: `sqlalchemy`, `aiosqlite`, `asyncpg`.
  - *Used by*: `deps.py`, `main.py`, `seed.py`.
- **`security.py`**:
  - *Purpose*: Implements password cryptography and JWT lifecycle.
  - *Key Functions*: `verify_password()`, `get_password_hash()`, `validate_password_strength()`, `create_access_token()`, `create_refresh_token()`, `decode_token()`.
  - *Depends on*: `bcrypt`, `jose.jwt`, `passlib`.
  - *Used by*: `AuthService`, `deps.py`.

### 25.2 Backend API Layer (`backend/app/api/`)
- **`deps.py`**:
  - *Purpose*: Request-scoped authentication dependency injection.
  - *Key Functions*: `get_current_user()`, `get_current_admin_user()`.
  - *Used by*: All protected router files.
- **`v1/auth.py`**:
  - *Purpose*: Authentication routes (`/register`, `/login`, `/refresh`, `/me`).
- **`v1/users.py`**:
  - *Purpose*: User profile, consent toggles, JSON portability export, and account deletion.
- **`v1/assessments.py`**:
  - *Purpose*: IPIP 50-item questionnaire retrieval, submission, and scoring.
- **`v1/journal.py`**:
  - *Purpose*: Journal reflection CRUD with NLP analysis.
- **`v1/mood_stress.py`**:
  - *Purpose*: Mood logging, multimodal stress evaluation, and acute distress reporting.
- **`v1/companion.py`**:
  - *Purpose*: AI companion chat, SSE streaming, multi-session management, memory CRUD, and destructive action confirmations.
- **`v1/facial.py`**:
  - *Purpose*: Ephemeral in-memory facial frame processing.
- **`v1/wellness.py`**:
  - *Purpose*: Biometrics, wearable synchronization, sleep summaries, digital wellbeing metrics, and dashboard telemetry aggregation.
- **`v1/goals.py`**:
  - *Purpose*: Goal/milestone management and daily habit streak tracking.
- **`v1/career.py`**:
  - *Purpose*: Career recommendation pathways aligned with Big Five traits.
- **`v1/safety.py`**:
  - *Purpose*: Emergency contacts management and urgent SOS alert trigger.
- **`v1/recommendations.py`**:
  - *Purpose*: Cross-domain multimodal recommendations.

### 25.3 Backend Analytical & AI Engines (`backend/app/ml/` & `app/ai/`)
- **`ml/ocean_engine.py`**:
  - *Purpose*: 50-item IPIP psychometric scoring and profile interpretation.
  - *Class*: `OceanBigFiveEngine`.
  - *Methods*: `calculate_scores()`, `interpret_profile()`.
- **`ml/nlp_engine.py`**:
  - *Purpose*: Emotion classification, cognitive distortion detection, and constructive reframing.
  - *Class*: `NLPEmotionJournalEngine`.
  - *Method*: `analyze_text()`.
- **`ml/stress_distress_engine.py`**:
  - *Purpose*: Multimodal stress index fusion and personal baseline z-score deviation.
  - *Classes*: `StressDistressEngine`, `PersonalBaselineCalculator`.
  - *Methods*: `evaluate_stress()`, `calculate_deviation()`.
- **`ml/facial_engine.py`**:
  - *Purpose*: OpenCV Haar cascade frontal face detection and feature contrast proxy calculation.
  - *Class*: `FacialAnalysisEngine`.
  - *Method*: `analyze_frame_base64()`.
- **`ml/recommendation_engine.py`**:
  - *Purpose*: Rule-based intervention generation across stress, sleep, digital wellbeing, and personality.
  - *Class*: `RecommendationEngine`.
  - *Method*: `generate_recommendations()`.
- **`ai/gemini_provider.py`**:
  - *Purpose*: Google Gemini API integration with SSE streaming and tool calling.
  - *Class*: `GeminiProvider`.
  - *Methods*: `generate_response()`, `stream_conversation()`.
- **`ai/providers.py`**:
  - *Purpose*: LLM provider interfaces and local intelligent fallback.
  - *Classes*: `BaseLLMProvider`, `MockLLMProvider`, `ExternalLLMProvider`.
  - *Function*: `get_llm_provider()`.
- **`ai/safety_guardrails.py`**:
  - *Purpose*: Regex detection for crisis keywords and medical diagnosis requests.
  - *Class*: `SafetyGuardrailEngine`.
  - *Method*: `evaluate_message_safety()`.
- **`ai/context_builder.py`**:
  - *Purpose*: Multimodal context synthesis into the companion system prompt.
  - *Class*: `AIContextBuilder`.
  - *Method*: `assemble_system_prompt()`.
- **`ai/tools.py`**:
  - *Purpose*: Native tool declarations schema, tool execution dispatcher, and destructive action confirmation queue.
  - *Class*: `ToolDispatcher`.
  - *Methods*: `execute()`, `confirm_action()`, `cancel_action()`.

### 25.4 Frontend Source (`frontend/src/`)
- **`services/api.ts`**:
  - *Purpose*: Static `ApiService` class handling all network requests, JWT headers, base URL dynamic override, and SSE streaming.
- **`layouts/DashboardLayout.tsx`**:
  - *Purpose*: Primary dashboard frame, responsive sidebar drawer, theme toggle, and SOS button.
- **`components/ServerConfigModal.tsx`**:
  - *Purpose*: Modal for testing and setting custom backend URLs on mobile devices.
- **`components/CircularProgressRing.tsx`**:
  - *Purpose*: SVG animated circular percentage gauge.
- **`components/MarkdownRenderer.tsx`**:
  - *Purpose*: Custom Markdown parser for inline formatting, lists, and fenced code blocks.
- **`components/ThemeToggle.tsx`**:
  - *Purpose*: Light/dark mode toggle button with local storage persistence.

---

## 26. GUIDEME — AI HANDOFF CONTEXT

> **Quick AI Context Primer**:  
> Read this section first when resuming pair-programming or generating new features for GUIDE ME.

1. **System Nature**: A modular multimodal wellness and guidance platform built with **FastAPI** (Python 3.13) and **React 19** (Vite 8 + TypeScript + Tailwind CSS).
2. **Database Mode**: Uses an automatic dual-database pattern in `backend/app/core/database.py`. It defaults to SQLite (`guideme_local.db`) if local PostgreSQL is unreachable, allowing immediate zero-friction development.
3. **Database Entities**: 28 SQLAlchemy declarative models in `backend/app/models/entities.py`. All user data queries are strictly scoped by `user_id == current_user.id` in `repositories.py` (IDOR defense).
4. **Authentication**: Native 12-round Bcrypt + HS256 JWT tokens. `access_token` (60 min) and `refresh_token` (7 days) are stored in `localStorage`.
5. **AI Companion Core**:
   - Located in `backend/app/ai/`.
   - Uses `GeminiProvider` when `GEMINI_API_KEY` is present.
   - Falls back gracefully to `MockLLMProvider` (an intelligent rule-based multi-turn dialog engine with memory and tool execution) when keys are absent.
   - Implements Server-Sent Events (SSE) streaming at `POST /api/v1/companion/chat/stream`.
   - Tool calling is mediated by `ToolDispatcher` in `tools.py`. Destructive operations (`delete_goal`, `delete_habit`) pause execution and require explicit user confirmation via `/companion/actions/{action_id}/confirm`.
6. **Safety & Crisis Guardrails**:
   - `SafetyGuardrailEngine` detects self-harm and crisis keywords with regex, suspends normal AI generation, records a `SafetyEvent`, and returns verified Indian emergency crisis hotlines (Tele-MANAS `14416`, KIRAN `1800-599-0019`, Vandrevala `+91 9999 666 555`, `112`).
7. **Facial Landmark Analysis**:
   - Browser camera stream captured via HTML5 Canvas in RAM.
   - Base64 frames posted to `POST /api/v1/facial-analysis/process-frame`.
   - Analyzed by OpenCV Haar cascades in volatile RAM with **zero image/video storage on disk or database**.
8. **Android Mobile Status**:
   - Packaged with Capacitor 8.
   - `build-apk.ps1` builds production APK: `GuideMe-v1.0.apk` (4.4 MB) in root.
   - `ServerConfigModal.tsx` on login screen allows phone users to point the app to `http://<PC_IP>:8000/api/v1` or a Cloudflare tunnel URL.
9. **How to Run**:
   - Backend: `cd backend && python -m uvicorn app.main:app --reload`
   - Frontend: `cd frontend && npm run dev`
   - Demo User: `demo@guideme.com` / `DemoUser123!` (Jordan Chen).
10. **Critical Constraints**:
    - **NO VIRTUAL ENVIRONMENT**: Dependencies install directly to the host Python installation per project rules.
    - **DO NOT PERSIST FACIAL IMAGES**: Raw biometric storage is explicitly forbidden in `PRIVACY_ALLOW_RAW_FACIAL_STORAGE`.
    - **IDOR INTEGRITY**: Every new database query must enforce `user_id == current_user.id`.
    - **CONFIRMATION PROTOCOL**: Never execute destructive tool actions from the AI companion without passing through `PENDING_DESTRUCTIVE_ACTIONS`.

---

## 27. DOCUMENTATION ACCURACY & DISCREPANCY AUDIT

During deep codebase inspection, several discrepancies between legacy repository documentation/README and actual code were uncovered:

1. **React Version**:
   - *Legacy Documentation*: README lists "React 18".
   - *Actual Code*: `frontend/package.json` installs `"react": "^19.2.8"` and `"react-dom": "^19.2.8"`.
2. **React Router Version**:
   - *Legacy Documentation*: README lists "React Router v6".
   - *Actual Code*: `frontend/package.json` installs `"react-router-dom": "^7.18.3"`.
3. **Vite Version**:
   - *Legacy Documentation*: README refers to Vite 5.
   - *Actual Code*: `frontend/package.json` installs `"vite": "^8.2.2"`.
4. **Default Crisis Hotline**:
   - *Legacy Documentation*: Root `.env.example` defines `SAFETY_CRISIS_HOTLINE_DEFAULT="988"`.
   - *Actual Code*: `backend/.env`, `safety_guardrails.py`, and `SafetyCenterPage.tsx` prioritize verified Indian national hotlines (Tele-MANAS `14416` / `1800-891-4416` and KIRAN `1800-599-0019`).
5. **API Endpoints Coverage**:
   - *Legacy Documentation*: `docs/api/endpoints.md` documents only 21 endpoints.
   - *Actual Code*: The backend implements 36+ endpoints, including SSE token streaming (`/companion/chat/stream`), multi-session management, habit streak logs, sleep summaries, dashboard summaries, and action confirmations.
6. **Database Migration Mechanism**:
   - *Legacy Documentation*: README claims Alembic manages migrations.
   - *Actual Code*: `backend/migrations/versions` is completely empty. Schema tables are created via SQLAlchemy `Base.metadata.create_all`, and SQLite column additions are executed via custom PRAGMA scripts in `database.py`.
