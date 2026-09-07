# GUIDE ME - API Specification (/api/v1)

Interactive OpenAPI documentation is automatically served at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

## Endpoints Summary

### Authentication (`/auth`)
- `POST /api/v1/auth/register` - Create new user account.
- `POST /api/v1/auth/login` - Authenticate and receive access & refresh tokens.
- `POST /api/v1/auth/refresh` - Refresh an expired access token.
- `GET /api/v1/auth/me` - Retrieve current authenticated user profile.

### User Profile & Privacy (`/profile`)
- `GET /api/v1/profile` - Retrieve profile details.
- `PUT /api/v1/profile` - Update profile bio, timezone, occupation.
- `GET /api/v1/profile/consent` - Read granular privacy consent status.
- `PUT /api/v1/profile/consent` - Update camera, memory, or wearable permissions.
- `GET /api/v1/profile/export-data` - Download all user data in JSON format.
- `DELETE /api/v1/profile/delete-account` - Permanently erase account and all related records.

### Personality & Psychometrics (`/assessments`)
- `GET /api/v1/assessments/ocean/questions` - Retrieve IPIP 50-item question bank.
- `POST /api/v1/assessments/ocean/submit` - Score answers and generate OCEAN profile.
- `GET /api/v1/assessments/ocean/latest` - Retrieve most recent personality assessment.

### Journal & Reflection (`/journal`)
- `GET /api/v1/journal` - List journal reflections for current user.
- `POST /api/v1/journal` - Create journal entry with automated NLP reflection analysis.
- `GET /api/v1/journal/{id}` - Retrieve single journal entry (IDOR protected).
- `DELETE /api/v1/journal/{id}` - Delete journal entry (IDOR protected).

### Mood & Stress (`/moods`, `/stress`, `/distress`)
- `POST /api/v1/moods` - Log momentary mood score (1-10) and valence.
- `GET /api/v1/moods` - Historical mood logs.
- `POST /api/v1/stress/evaluate` - Multimodal stress estimation and baseline deviation.
- `POST /api/v1/distress/report` - Report acute distress event and retrieve support.

### AI Companion & Memory (`/companion`)
- `POST /api/v1/companion/chat` - Send user message and receive empathetic AI response.
- `GET /api/v1/companion/conversation` - Retrieve active conversation history.
- `GET /api/v1/companion/memories` - Inspect long-term memories remembered by AI.
- `DELETE /api/v1/companion/memories/{id}` - Delete a specific memory item.

### Camera & Facial Signals (`/facial-analysis`)
- `POST /api/v1/facial-analysis/process-frame` - Process base64 frame in volatile RAM.

### Wearables & Digital Wellbeing (`/wellness`)
- `GET /api/v1/wellness/metrics` - List physiological records (HRV, sleep, resting HR).
- `POST /api/v1/wellness/sync-wearables` - Trigger wearable device synchronization.
- `GET /api/v1/wellness/digital-wellbeing` - Retrieve screen time and focus statistics.

### Safety Center (`/safety`)
- `GET /api/v1/safety/emergency-contacts` - List trusted emergency contacts.
- `POST /api/v1/safety/emergency-contacts` - Add an emergency contact.
- `POST /api/v1/safety/trigger-alert` - Record safety event and display immediate crisis lifelines.
