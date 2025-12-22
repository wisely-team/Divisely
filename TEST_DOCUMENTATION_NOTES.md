# Divisely - Test & Security Documentation Notes

This document contains important technical decisions, security implementations, and testing tips to be included in the final project documentation.

## 1. Security Implementations

### Email Enumeration Prevention
- **Feature:** Forgot Password / Password Reset
- **Implementation:** The system returns a success message ("If an account exists, reset instructions have been sent") regardless of whether the email exists in the database.
- **Rationale:** Prevents attackers from discovering registered user emails by trying different addresses. This follows OWASP security standards.

### Secure Email Delivery (HTTP API)
- **Feature:** Email Notifications (Verification, Password Reset)
- **Implementation:** Switched from standard SMTP (Port 587/465) to **Brevo HTTP REST API**.
- **Rationale:** Standard SMTP ports are often blocked by cloud providers (like Render.com free tier) to prevent spam. Using an HTTP API ensures reliable delivery and bypasses network restrictions.

### Backend AI Proxy (Gemini)
- **Feature:** AI Financial Assistant & Receipt Scanner
- **Implementation:** Gemini API calls are proxied through the backend instead of being called directly from the frontend.
- **Rationale:** Keeps the `GEMINI_API_KEY` secure on the server. Frontend-only implementations expose the API key to users via the browser console/network tab.

## 2. Robustness & Error Handling

### Cascade Cleanup on User Deletion
- **Feature:** Account Deletion
- **Implementation:** When a user deletes their account, the system:
    1. Removes them from all `members` lists in groups.
    2. Removes their entry from `memberBalances`.
    3. Transfers group ownership if they were the owner.
    4. Deletes the group if they were the last member.
- **Rationale:** Prevents "ghost users" from breaking balance calculations or expense creation in active groups.

### Self-Healing Group State
- **Feature:** Group Details / Balances
- **Implementation:** Added a "self-healing" mechanism in `getGroupDetails` and `getGroupBalances`. If the system detects a member ID that no longer exists in the `Users` collection, it automatically cleans up that group's member list.
- **Rationale:** Acts as a safety net for data integrity, ensuring the UI never crashes due to inconsistent database states.

### Defensive Sorting & Null Checks
- **Feature:** Balance Calculation
- **Implementation:** Added explicit null/undefined checks and `String()` conversions in sorting functions (e.g., `localeCompare`).
- **Rationale:** Prevents `TypeError: Cannot read properties of undefined` crashes when dealing with legacy data or partially deleted records.

## 3. Testing Tips for Supervisors

- **Testing Password Reset:** Mention that "no email received" for a non-existent account is intended behavior for security.
- **Testing User Deletion:** Create a group with 2 users, delete one, and observe how the other user sees the group update automatically.
- **Testing AI Features:** Ensure `GEMINI_API_KEY` is set in backend `.env`. The system will return a specific `ai_not_configured` error if the key is missing, rather than a generic server error.
