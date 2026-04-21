# Security & Data Integrity

Yellove OS enforces robust security protocols to protect tactical telemetry and user identity.

## 1. Safe Input Handling
- **XSS Prevention**: All user-generated strings (e.g., chat queries, custom addresses) are sanitized using `DOMPurify` before being processed or rendered.
- **Escape Logic**: React's built-in escaping is used across the system, with `dangerouslySetInnerHTML` restricted only to trusted sanitized HTML from the Google Directions API.

## 2. Secure Cloud Integration
- **Firebase Security**: Authentication is managed via Firebase Auth, ensuring secure session management. Real-time Database access is governed by production-grade rules (locked to authenticated users).
- **Environment Variables**: API keys and secrets are never hardcoded. They are injected via `import.meta.env` during build time for production deployments.

## 3. Safe DOM Operations
- **DOMPurify**: Standard sanitization layer for all external API strings.
- **Ref Responsibility**: Using React `useRef` for direct DOM access (Google Maps initialization) instead of unsafe selectors like `document.querySelector`.
- **Target Safety**: External links (e.g., transit URLs) use `rel="noreferrer"` to prevent credential leaking.

## 4. Encrypted Telemetry
All traffic between the OS and Google/Firebase services is encrypted via HTTPS (TLS 1.3), ensuring that stadium crowd data remains confidential.
