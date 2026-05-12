# Authentication and Authorization Flow (Defense)

## Mermaid Diagram

```mermaid
flowchart TD
  A[User opens app] --> B{Has session token?}
  B -- No --> C[Sign in or register]
  C --> D[Local password policy validation]
  D --> E[Store password hash only]
  E --> F[Local credential created]

  B -- Yes --> G[API request with JWT]
  G --> H[Auth middleware verifies JWT issuer audience exp nbf iat]
  H --> I{JWT valid?}
  I -- No --> J[401 Unauthorized + auth_failure log]
  I -- Yes --> K[Extract userId tokenId role]

  K --> L{Privileged role and MFA claim required?}
  L -- Yes and missing --> M[401 MFA required + access_denied log]
  L -- No or present --> N[Role middleware check]

  N --> O{Role allowed for route?}
  O -- No --> P[403 Forbidden + access_denied log]
  O -- Yes --> Q[Execute handler]

  Q --> R{Admin role update route?}
  R -- Yes --> S[Update target user role]
  S --> T[security_event_log role_update]
  R -- No --> U[Normal response]

  V[Local login path] --> W[authenticateLocalLogin]
  W --> X{Password valid?}
  X -- No --> Y[Increase failed attempts]
  Y --> Z{attempts >= 5?}
  Z -- Yes --> AA[Lock account 15 minutes]
  Z -- No --> AB[Return invalid_credentials]
  X -- Yes --> AC[Reset failed attempts]
  AC --> AD{MFA enabled?}
  AD -- No --> AE[Login success]
  AD -- Yes --> AF[verifyMfaChallenge TOTP]
  AF --> AG{Code valid?}
  AG -- No --> AH[invalid_code]
  AG -- Yes --> AE

  AI[MFA enrollment path] --> AJ[beginMfaEnrollment]
  AJ --> AK[Generate base32 secret]
  AK --> AL[Encrypt secret AES-GCM]
  AL --> AM[Return otpauth URI]
  AM --> AN[User scans in authenticator app]
  AN --> AO[confirmMfaEnrollment code]
  AO --> AP{Code valid?}
  AP -- No --> AQ[Reject enrollment]
  AP -- Yes --> AR[Set mfaEnabled true]
```

## Notes for Defense

1. Authentication proves identity: password hash verification + optional TOTP challenge.
2. Authorization enforces permissions: route-level role checks using requireRole middleware.
3. CID principles:

- Confidentiality: passwords hashed, MFA secret encrypted at rest.
- Integrity: append-only audit logs in database triggers.
- Availability: lockout is temporary and bounded, API remains available.

4. Least privilege:

- Auditor has read-only access where required.
- Admin is required for role assignment routes.
