# GUIDE ME - Architectural Overview

## 1. System Philosophy

**GUIDE ME** is structured as an enterprise-grade, modular wellness platform following the **COLLECT → VALIDATE → NORMALIZE → UNDERSTAND → ANALYZE → ESTIMATE → EXPLAIN → PERSONALIZE → GUIDE** paradigm.

```
       ┌───────────────────────────────┐
       │   Eco-Friendly React Frontend │ (Vite + TS + Tailwind)
       └──────────────┬────────────────┘
                      │ HTTP / REST / JSON
       ┌──────────────▼────────────────┐
       │   FastAPI Modular Monolith    │ (API Gateway Layer /api/v1)
       └──────┬───────────────┬────────┘
              │               │
      ┌───────▼──────┐ ┌──────▼────────┐
      │ Core Engine  │ │  ML / AI Hub  │
      │ Services &   │ │  - OCEAN      │
      │ Repositories │ │  - NLP & CV   │
      └───────┬──────┘ └───────────────┘
              │
      ┌───────▼────────────────────────┐
      │ PostgreSQL / SQLite Fallback   │ (22+ ORM Entities)
      └────────────────────────────────┘
```

## 2. Microservice-Ready Domain Boundaries

While deployed as a high-performance modular monolith for prototype agility and zero operational overhead, the codebase maintains strict internal service boundaries:

- **Auth & Identity Service**: JWT token generation, refresh tokens, role-based access control (RBAC).
- **User Profile & Consent Service**: Granular privacy controls, GDPR/CCPA data export, permanent deletion.
- **Psychometrics Service**: Big Five (OCEAN) scoring, facet breakdown, career matching.
- **NLP Reflection Service**: Text sentiment analysis, emotion tagging, cognitive distortion detection.
- **Autonomic & Stress Service**: Personal baseline tracking (z-score), HRV integration, distress reporting.
- **AI Companion Service**: Context assembler, safety guardrail filter, memory transparency.
- **Computer Vision Service**: In-memory facial expression feature proxy estimation.
- **Wearable Integration Service**: Mock simulation and provider interfaces (Fitbit, Apple HealthKit, Google Health Connect).
- **Safety Center**: Configurable regional crisis lifelines, emergency contacts, panic/SOS triggers.

## 3. Data Flow & Personal Baseline Calculation

GUIDE ME fundamentally rejects comparing an individual's autonomic or emotional signals to arbitrary population averages.

```
Historical User Observations (14-day window)
              ↓
    Calculate Rolling Mean (μ) and Std Dev (σ)
              ↓
    Current Day Multimodal Observation (X)
              ↓
    Z-Score Deviation = (X - μ) / σ
              ↓
    Personalized Risk Band & Narrative Guidance
```
