# GUIDE ME - FINAL

> **Multimodal Mental Wellness, Digital Balance, and Personal Guidance Platform**
> *A privacy-first, evidence-informed wellness companion — web app plus Android build.*

---

## 1. GUIDE ME Concept

**GUIDE ME** is a multimodal wellness and personal guidance platform. It combines physiological
signals, digital screen exposure, cognitive thought patterns, and a validated psychometric
inventory into personalised, explainable guidance.

Rather than comparing you against population averages, GUIDE ME evaluates you against your own
recent history:

```
COLLECT → VALIDATE → NORMALIZE → UNDERSTAND → ANALYZE → ESTIMATE → EXPLAIN → PERSONALIZE → GUIDE
```

> [!IMPORTANT]
> **Not a medical device.** GUIDE ME is for educational self-awareness and lifestyle balance. It
> does not diagnose or treat any condition. See §16 for crisis resources.

---

## 2. Product Objectives

1. **Holistic Vitality** — bring emotional well-being, autonomic recovery, and conscious digital
   engagement into one dashboard.
2. **Personal Baseline** — evaluate stress against your own rolling history ($z$-score deviation)
   rather than arbitrary population norms.
3. **Privacy-First Processing** — analyse camera frames in memory, with no raw biometric storage.
4. **Cognitive Clarity** — surface cognitive distortions (catastrophizing, all-or-nothing thinking)
   and offer constructive reframing.
5. **Psychometric Career Alignment** — map Big Five (OCEAN) traits to career and mastery pathways.
6. **Calm Interface** — a muted sage, earth, and forest palette with dark and light modes.

---

## 3. Feature Suite

| Feature | What it actually does today |
|---|---|
| **AI Wellness Companion** | Conversational companion with crisis guardrails, context assembly, and inspectable long-term memory. Uses Google Gemini when an API key is configured; otherwise runs a built-in offline heuristic agent (see §12). |
| **Camera Facial Signals** | Live browser camera via `getUserMedia()`. Frames are analysed in memory (OpenCV Haar cascade + pixel-region proxies) and never stored. Continuous sampling every 3s while the tab is focused. |
| **Big Five (OCEAN)** | Full 50-item IPIP inventory — 10 items per trait, 18 reverse-keyed. Radar and bar charts, plus career strength mapping. |
| **Cognitive Journaling** | Lexicon-based sentiment scoring with negation handling, emotion tagging, regex cognitive-distortion detection across 5 patterns, and reframing prompts. |
| **Stress & Distress Monitor** | Weighted 5-signal composite score, personal baseline deviation, and acute distress logging with crisis escalation. |
| **Wearable Hub** | Ring-based daily activity summary, sleep-stage architecture, and metric sync. Includes **real Bluetooth LE pairing** via Web Bluetooth (see §6 note on simulated providers). |
| **Digital Wellbeing** | Screen exposure analytics, focus tracking, and wind-down curfews. On Android, backed by real `UsageStatsManager` data. |
| **Goals & Habits** | Interactive checklists with computed progress. |
| **Safety Center** | India-focused 24/7 crisis helplines, emergency contacts, and an SOS action that records a safety event. |
| **Privacy Center** | JSON data export, six granular consent toggles, and permanent (hard-delete) account erasure. |

---

## 4. System Architecture

A **modular monolith** with clean service and repository boundaries:

```
GUIDE ME - FINAL/
├── frontend/                  # React 19 + TypeScript + Vite + Tailwind + Recharts
│   ├── src/
│   │   ├── pages/             # 14 feature pages
│   │   ├── components/        # Shared UI (rings, toasts, theme toggle, markdown)
│   │   ├── contexts/          # Consent context
│   │   └── services/          # API client + Capacitor/Web-Bluetooth native bridge
│   └── android/               # Capacitor Android project (APK build)
├── backend/                   # Python 3.13 + FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── app/
│   │   ├── api/v1/            # 13 routers, 53 endpoints
│   │   ├── core/              # Security, JWT, dual-database manager, config
│   │   ├── models/            # 28 SQLAlchemy ORM entities
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── repositories/      # User-scoped, IDOR-guarded queries
│   │   ├── services/          # Business logic layer
│   │   ├── ml/                # Psychometric, NLP, stress & facial engines
│   │   ├── ai/                # LLM provider abstraction & safety layer
│   │   └── integrations/      # Wearable provider abstraction
│   ├── migrations/            # Alembic scaffold (currently unused — see note below)
│   └── tests/                 # pytest suite (14 tests)
├── ml/                        # Standalone experiment scripts (not imported by the app)
├── scripts/                   # Git Bash automation (setup, start, test, seed)
├── infrastructure/            # Dockerfiles + Nginx config
├── docs/                      # Architecture, API, security, research notes
├── build-apk.sh / .ps1        # Android APK build helpers
├── requirements.txt           # Root Python dependencies (NO virtualenv)
└── .env.example               # Configuration template
```

> [!NOTE]
> **Schema creation** uses `Base.metadata.create_all` plus targeted `ALTER TABLE` statements in
> `app/core/database.py`, not Alembic revisions. `backend/migrations/versions/` is an empty
> scaffold — Alembic is installed but no migrations have been authored yet.

---

## 5. Technology Stack

**Frontend** — React **19.2**, TypeScript 6.0, Vite 8.2, Tailwind CSS 3.4, React Router **7.18**,
Lucide React, Recharts 3.10, Capacitor 8.5 (Android), HTML5 MediaStream / Canvas / Web Bluetooth.

**Backend** — Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, native `bcrypt`, Python-Jose (JWT).

**Database** — PostgreSQL in production, with automatic SQLite fallback (`guideme_local.db`) when
PostgreSQL is unreachable, so the project runs with zero setup.

**ML / numerics** — NumPy, Pillow, OpenCV (headless).

> [!NOTE]
> `requirements.txt` also pins pandas, scikit-learn and SciPy. These are **not currently imported**
> by the backend — the ML engines are deterministic (NumPy, regex, and lexicon based). They are
> retained for the standalone scripts under `ml/` and for future model work.

**DevOps** — Docker, Docker Compose, Nginx Alpine, GitHub Actions (**CI only** — the workflow runs
tests and builds; it does not deploy).

---

## 6. Prerequisites

- **OS**: Windows 10/11 with **Git Bash** (all scripts are bash).
- **Python**: 3.10+ (developed and tested on 3.13.15).
- **Node.js**: v18+ and npm (tested on Node v24.20.0).
- **PostgreSQL**: optional. If unavailable, SQLite is used automatically.
- **Browser for BLE**: Chrome, Edge, or Chrome on Android. Web Bluetooth is not implemented by
  Safari or Firefox.

---

## 7. Mandatory Environment Rule: NO Virtual Environment

> [!IMPORTANT]
> **Do NOT create a `venv/`, `.venv/`, or `env/`.** Dependencies install directly against your host
> Python installation, as mandated by project requirements.

```bash
pip install -r requirements.txt
```

> A second `backend/requirements.txt` exists for the Docker build context. The **root**
> `requirements.txt` is authoritative for local development.

---

## 8. Quick Start (Windows + Git Bash)

Open **Git Bash** in the repository root:

```bash
cd "GUIDE ME - FINAL"
```

### Step 1 — Install dependencies and seed the database

```bash
./scripts/setup.sh
```

This verifies Python and Node are present, installs `requirements.txt`, installs frontend packages,
and seeds the database with the Jordan Chen demo archetype.

### Step 2 — Start all services

```bash
./scripts/start_all.sh
```

This starts the FastAPI backend and the Vite frontend concurrently. Press `Ctrl+C` to shut both
down cleanly.

Alternatively, run them in separate Git Bash tabs:

```bash
# Terminal 1: Backend
./scripts/start_backend.sh

# Terminal 2: Frontend
./scripts/start_frontend.sh
```

### Step 3 — Open the application

| Surface | URL |
|---|---|
| Web application | `http://127.0.0.1:5173` |
| FastAPI interactive docs | `http://127.0.0.1:8000/docs` |
| ReDoc API documentation | `http://127.0.0.1:8000/redoc` |
| Health probe | `http://127.0.0.1:8000/health` |

---

## 9. Demo Account

Log in directly, or click **"Load Demo Account (Jordan Chen)"** on the login page:

| Field | Value |
|---|---|
| **Email** | `demo@guideme.com` |
| **Password** | `DemoUser123!` |
| **Profile** | Jordan Chen (Systems Engineer & Design Thinker) |
| **Pre-seeded** | OCEAN profile, 8 days of mood & stress observations, a journal entry with NLP analysis, a goal with milestones, habits, and an emergency contact. |

---

## 10. Camera Permission Flow & Facial Analysis

1. Open **Facial Signals** in the sidebar.
2. Click **Enable Camera**. The browser shows a permission prompt via
   `navigator.mediaDevices.getUserMedia({ video: true })`.
3. A live viewfinder renders.
4. Frames are captured to an HTML5 Canvas in memory and POSTed as Base64 to
   `/api/v1/facial-analysis/process-frame`.
5. The backend detects a face (OpenCV Haar cascade) and derives four proxies:
   `smile_ratio`, `brow_furrow_index`, `eye_aperture`, `head_pose_stability`.

**Continuous analysis.** With *Auto-sample* enabled, a frame is analysed every 3 seconds. Requests
are single-flight — a new frame is skipped while one is still in flight — and sampling pauses
automatically after repeated errors.

**Foreground only.** The camera stops when the tab is hidden and resumes on return. Browsers and
mobile operating systems suspend camera access for backgrounded pages, so true background capture
is *not technically possible* and is not attempted.

### Privacy guarantees
- **No recording** — no frame is written to disk or any database table.
- **Ephemeral** — the payload is discarded once metrics are extracted.
- **Revocable** — click **Stop Camera**, or revoke permission in the address bar. Disabling camera
  consent in the Privacy Center stops the stream immediately.
- **Probabilistic wording** — the app states plainly that facial signals are superficial muscular
  proxies and do not prove internal emotional states.

---

## 11. Multimodal Stress & Personal Baseline Engine

The composite stress score (0–100) is a weighted blend of five signals:

| Signal | Weight |
|---|---|
| Self-reported mood | 0.35 |
| Heart rate variability (HRV) | 0.25 |
| Sleep deficit | 0.15 |
| Screen exposure | 0.15 |
| Journal text sentiment | 0.10 |

Weights are renormalised over whichever signals are available, so a partial day still scores. With
no signals at all, the API returns an explicit `insufficient_data` state rather than a fabricated
number.

Personal baseline deviation is a standard $z$-score:

$$z = \frac{X - \mu}{\sigma}$$

where $\mu$ and $\sigma$ are computed over the **14 most recent stress observations**
(`limit=14`, ordered by recency — this is a rolling *record* window, not a strict 14-day window).
Zero variance and cold-start cases are guarded.

**Risk bands:** Low `0–29` · Moderate `30–59` · Elevated `60–79` · Critical `80–100`.

---

## 12. AI Companion & Memory Transparency

1. **Context fusion** — the companion assembles your profile, Big Five traits, today's mood, active
   goals, and consented memories into a system prompt.
2. **Provider selection** (`app/ai/providers.py`):

   | `AI_PROVIDER` | Requires | Result |
   |---|---|---|
   | `gemini` *(default)* | `GEMINI_API_KEY` | Google Gemini (`gemini-1.5-flash` by default) |
   | `openai` | `OPENAI_API_KEY` | OpenAI (`AI_MODEL_NAME`, default `gpt-4o-mini`) |
   | *unset key* | — | `MockLLMProvider`, a fully offline heuristic agent |

   > [!IMPORTANT]
   > Gemini is checked **first**. To use OpenAI you must set `AI_PROVIDER=openai` *and*
   > `OPENAI_API_KEY` — supplying the OpenAI key alone is not enough.
   >
   > **With no API key configured, the app still runs**, but companion replies and journal
   > reflections come from deterministic offline logic rather than a language model.

3. **Memory inspector** — the **Memories** tab lists every remembered fact with a confidence score;
   any memory can be permanently deleted.
4. **Crisis guardrail** — when acute crisis language is detected, normal dialogue is suspended and
   crisis resources are returned immediately (see §16).

---

## 13. Running Automated Tests

```bash
./scripts/test.sh
```

This runs the **full** backend pytest suite (14 tests) and then the frontend type-check and
production build (`tsc -b && vite build`).

Backend coverage includes health endpoints, password hashing, OCEAN scoring, NLP sentiment and
distortion detection, stress calculation, safety guardrails, IDOR resource protection, and the AI
companion (multi-session, memory CRUD, streaming, and the crisis guardrail).

To run just the backend suite:

```bash
cd backend && PYTHONPATH=. python -m pytest -v
```

---

## 14. Docker Deployment (Optional)

```bash
docker-compose up --build
```

| Service | Port |
|---|---|
| Frontend (Nginx Alpine) | `http://localhost` (80) |
| Backend API | `http://localhost:8000` |
| PostgreSQL 16 | `localhost:5432` |

---

## 15. Security & IDOR Defense

- **Strict user scoping** — repositories filter by `user_id`. A cross-user request for another
  user's journal returns `404` on both read and delete; this is covered by an automated test.
- **No hash leakage** — password hashes are excluded from all API response schemas.
- **Audit trail** — authentication events, consent changes, and safety triggers are written to the
  `audit_logs` table. Note this is a standard table; there is no cryptographic append-only
  enforcement.
- **Account erasure** — `DELETE /api/v1/profile/delete-account` performs a hard delete; the user
  row is removed and the credentials stop authenticating.

**Data export scope.** `GET /api/v1/profile/export-data` currently returns your profile, journals,
mood logs, and goals. It does **not** yet include personality results, AI memories, stress
observations, habits, or wellness metrics. Broadening this is tracked as future work.

---

## 16. Crisis Resources

The in-app crisis guardrail and Safety Center currently surface **India-based 24/7 services**:

| Service | Contact |
|---|---|
| Tele-MANAS (Govt. of India) | **14416** or 1800-891-4416 |
| KIRAN Mental Health Helpline | **1800-599-0019** |
| Vandrevala Foundation | **+91 9999 666 555** |
| AASRA | **+91 98204 66726** |
| National Emergency Services | **112** |

> [!NOTE]
> **Regional scope.** Crisis resources are India-localised in this build. If you deploy GUIDE ME
> for another region, update `app/ai/safety_guardrails.py`, `app/api/v1/safety.py`,
> `app/ai/providers.py`, `app/ai/context_builder.py`, and the frontend `SafetyCenterPage` /
> `StressDistressPage` so the documentation and the app agree. International directories such as
> [findahelpline.com](https://findahelpline.com) list equivalents by country.

> [!NOTE]
> **Responsible AI.** GUIDE ME is designed for educational self-awareness and preventative
> mindfulness. It is **not a diagnostic medical device**. If you are experiencing a mental health
> emergency, contact the services above or your local emergency number.

---

## 17. Android Build (Capacitor)

The frontend ships as an Android app via Capacitor, adding Health Connect and UsageStats access.

```bash
./build-apk.sh          # Git Bash
./build-apk.ps1         # PowerShell
```

The Android project lives in `frontend/android/`; configuration is in
`frontend/capacitor.config.ts`.

---

## 18. Known Limitations

Stated plainly so behaviour is not mistaken for a defect:

- **Wearable providers are simulated.** The Fitbit, Apple HealthKit, and Google Health Connect
  adapters implement the provider interface but return representative values flagged
  `is_simulated_demo: true`. There is no OAuth flow or outbound HTTP in `app/integrations/`.
  **Bluetooth LE is the exception** — it performs a real GATT connection and reads live values.
- **Google Health Connect** returns real data only in the Android build, on a device with Health
  Connect installed and permissions granted.
- **Background camera analysis is not possible** on web or mobile; sampling is foreground-only.
- **Digital Wellbeing** uses real `UsageStatsManager` data on Android; in the browser the figures
  are user-entered or seeded.
- **Without an AI API key**, companion replies and journal reflections are deterministic offline
  output, not model-generated text.
- **`ml/`** contains standalone experiment scripts that the running application does not import.

---

## 19. License

Distributed under the **MIT License**. See `LICENSE`.
