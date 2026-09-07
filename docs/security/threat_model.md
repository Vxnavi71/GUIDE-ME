# GUIDE ME - Threat Model & Security Architecture

## Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector | GUIDE ME Enterprise Defense |
|---|---|---|
| **Spoofing** | Forged identity or stolen JWT tokens | Short-lived JWT access tokens (60 min) with refresh token rotation. Tokens cryptographically signed with HS256 / SHA-256. |
| **Tampering** | Modifying other users' wellness records | Every database query explicitly checks `user_id == current_user.id`. Insecure Direct Object Reference (IDOR) tests enforce complete isolation. |
| **Repudiation** | Denying critical safety or consent changes | Immutable `AuditLog` table records all authentication events, privacy updates, and data deletion requests with timestamps. |
| **Information Disclosure** | Password hash leakage in API responses | Pydantic response schemas strictly omit sensitive credentials (`password`, `hashed_password`). Password fields are never exposed. |
| **Denial of Service** | Flooding heavy ML inference endpoints | Configurable rate limiting architecture (`RATE_LIMIT_PER_MINUTE=120`), in-memory frame limits, and async non-blocking I/O. |
| **Elevation of Privilege** | Normal user attempting administrative actions | Role-Based Access Control (RBAC) dependencies (`get_current_admin_user`) enforce strict permission gates. |

## Camera & Biometric Privacy Architecture

1. **Zero Raw Storage**: Video streams from `navigator.mediaDevices.getUserMedia()` are processed strictly within temporary in-memory buffers.
2. **Ephemeral Frame Analysis**: After landmark features and facial proxy metrics are computed, the frame is immediately dereferenced for garbage collection.
3. **Explicit Consent Gates**: Camera access requires both browser-level permissions and application-level consent in the Privacy Center.
