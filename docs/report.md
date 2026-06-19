# Technical Documentation: Project "Smart Spend" Reengineering

**Project:** Nova Bank (HTN26)  
**Document version:** 1.0  
**Last updated:** June 2026  
**Related documentation:** [diagram-context.md](./diagram-context.md)

---

## 1. Executive Summary

The original **Smart Spend** application served as a proof-of-concept with critical architectural and security flaws that rendered it unsuitable for financial operations. Following a comprehensive forensic audit, our team determined that patching the existing codebase was insufficient. We executed a **full-scale architectural pivot** to a **3-tier Spring Boot / Next.js architecture**, offloading identity management to **Auth0** and ensuring strict **ACID-compliant** data integrity.

The reengineered system—**Nova Bank**—now delivers:

- **Stateless, JWT-authenticated** access to all protected API endpoints.
- **Zero local credential storage**; Auth0 is the sole identity provider.
- **Parameterized data access** via Spring Data JPA (SQL injection neutralized).
- **Atomic financial operations** for transfers and bill payments.
- **Ownership-scoped queries** derived from the cryptographically signed JWT `sub` claim, eliminating IDOR.
- A **unified transaction ledger** powering dashboard, e-statements, receipts, and the Smart Spend analytics view.

Rather than retrofitting insecure patterns, we rebuilt the system with clear separation of concerns: the Next.js frontend is a presentation and BFF (Backend-for-Frontend) layer; Spring Boot owns all business rules; PostgreSQL persists state under Flyway-managed schema migrations.

---

## 2. Identified Vulnerabilities & Flaws

Our audit of the original proof-of-concept revealed the following systemic issues:

| Category | Original flaw | Business impact |
|----------|---------------|-----------------|
| **SQL Injection (SQLi)** | Raw user input interpolated directly into SQL strings | Attackers could read, modify, or delete arbitrary database rows |
| **Insecure Authentication & IDOR** | Forgeable Base64 session tokens; no ownership checks on API endpoints | Users could access accounts and transactions belonging to others |
| **Plaintext Exposure** | Passwords and PINs stored in plaintext in the database | Full credential compromise on any DB breach |
| **ACID Failures** | Multi-step transfers without transactional boundaries | Partial debits/credits ("lost money") and inconsistent balances |
| **Information Disclosure** | Admin endpoints leaked database URIs and environment variables | Attack surface expansion and infrastructure mapping |
| **Hardcoded Logic** | Mock data and disconnected UI components | Fragmented UX; Smart Spend disconnected from real transaction data |

These were not isolated bugs—they reflected an architecture that mixed presentation, persistence, and authorization in a single untrusted tier. A ground-up reengineering was required.

---

## 3. The Re-engineering Strategy: Architectural Shift

We adopted an **N-tier architecture** to enforce separation of concerns and a **zero-trust API perimeter**.

### 3.1 The New Architecture

```text
Browser
  → Next.js App Router (pages + server components)
  → Auth0 Universal Login (/auth/login, /auth/callback)
  → Next.js API proxy routes (/api/v1/*)  [client-side mutations]
  → Spring Boot REST API (/api/v1/*)
  → Spring Security OAuth2 Resource Server (JWT validation)
  → Service Layer (@Transactional business logic)
  → Spring Data JPA (parameterized queries)
  → PostgreSQL (Flyway migrations)
```

| Tier | Technology | Responsibility |
|------|------------|----------------|
| **Tier 1 — Presentation** | Next.js 16, React 19 | Stateless UI, Auth0 session handling, API proxying. **No business logic, no database connections, no credential storage.** |
| **Tier 2 — Business Logic** | Spring Boot 3.4, Java 21 | Financial rules, validation, ownership checks, transactional money movement, admin aggregation. |
| **Tier 3 — Data Access** | PostgreSQL 17, Spring Data JPA, Flyway | Persistent storage with schema versioning, CHECK constraints, and foreign keys. |

### 3.2 Trust Boundaries

- **Identity** is established exclusively by Auth0-issued JWTs (issuer + audience validated).
- **Authorization** (including admin) is enforced in the application database (`users.is_admin`), not in client code.
- **User identity for data scoping** is never accepted from query parameters or request bodies—only from the verified JWT `sub` → `users.auth0_sub` mapping.

See [diagram-context.md §12 — Security Trust Boundaries](./diagram-context.md) for the full trust-boundary diagram context.

---

## 4. Implementation Steps & Justifications

### Step 1: Perimeter Security (Auth0 Integration)

**Action:** Removed all local password/credential storage. Integrated Auth0 for identity management via `@auth0/nextjs-auth0` on the frontend and Spring Security OAuth2 Resource Server on the backend.

**Implementation details:**

- Frontend Auth0 client (`frontend/lib/auth0.ts`) requests audience-scoped access tokens and syncs the user profile to the backend on login callback:

```typescript
await fetch(`${BACKEND}/api/v1/users/me`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.tokenSet.accessToken}`, ... },
  body: JSON.stringify({ email, fullName, picture }),
})
```

- Backend `SecurityConfig` enforces stateless JWT authentication on all `/api/v1/**` routes, validates issuer and audience, and denies all unmatched paths:

```java
.sessionManagement(session ->
    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/health", "/actuator/health").permitAll()
    .requestMatchers("/api/v1/admin/**").hasRole("admin")
    .requestMatchers("/api/v1/**").authenticated()
    .anyRequest().denyAll())
```

- Database stores **only** `auth0_sub`, email, display name, and picture—no passwords, PINs, or password hashes.

**Justification:** Offloading authentication to Auth0 means our database holds **zero sensitive credentials**, aligning with Financial-grade API (FAPI) principles. Even if the database is physically compromised, there are no passwords or hashes to steal. Auth0 provides built-in brute-force protection and optional MFA without custom implementation.

---

### Step 2: Eliminating SQL Injection (JPA Migration)

**Action:** Replaced raw SQL string concatenation with **Spring Data JPA** repositories and Hibernate-generated parameterized queries.

**Implementation details:**

- Entities: `User`, `Account`, `Transaction` (`backend/src/main/java/com/novabank/entity/`)
- Repositories use method-name and JPQL queries—e.g. `AccountRepository.findByIdAndUser(Long id, User user)` for ownership-scoped lookups.
- Schema managed by Flyway (`backend/src/main/resources/db/migration/`):
  - `V1__init_schema.sql` — core tables, enums, CHECK constraints (`balance >= 0`, `amount > 0`)
  - `V2__seed_demo_data.sql` — demo seed data
  - `V3__add_admin_flag.sql` — `users.is_admin` column

**Justification:** JPA forces parameterized statements. User input is treated strictly as **data**, never as executable SQL, mathematically neutralizing the SQLi vector.

---

### Step 3: Transactional Integrity (ACID Compliance)

**Action:** Implemented financial operations in the service layer with `@Transactional` annotations so debit, credit, and ledger writes succeed or fail as a single unit.

**Transfer example** (`TransferService.executeTransfer`):

```java
@Transactional
public TransferResponseDTO executeTransfer(TransferRequestDTO request, Jwt jwt) {
    User currentUser = userService.resolveUser(jwt);
    Account sender = accountService.findOwnedAccount(request.getFromAccountId(), currentUser);
    Account receiver = accountService.findByAccountNumber(request.getToAccountNumber());

    // Validations: self-transfer block, positive amount, sufficient balance
    sender.setBalance(sender.getBalance().subtract(request.getAmount()));
    receiver.setBalance(receiver.getBalance().add(request.getAmount()));

    transactionRepository.save(Transaction.builder()
        .fromAccount(sender).toAccount(receiver)
        .amount(request.getAmount()).referenceNumber("NB-" + ...)
        .status(SUCCESS).createdBy(currentUser).build());
}
```

**Bill payment example** (`BillPaymentService.payBill`):

```java
@Transactional
public PaymentReceiptDTO payBill(BillPaymentRequestDTO request, Jwt jwt) {
    Account source = accountService.findOwnedAccount(request.getFromAccountId(), currentUser);
    source.setBalance(source.getBalance().subtract(request.getAmount()));
    transactionRepository.save(Transaction.builder()
        .fromAccount(source).toAccount(null)  // external payee — no internal credit
        .referenceNumber("BP-" + ...).build());
}
```

**Justification:** Banking operations must be **atomic**. Spring's transactional management ensures that if any step fails (validation, persistence, constraint violation), the entire operation rolls back—preventing partial transfers and preserving balance consistency.

---

### Step 4: IDOR Prevention (Authentication & Ownership Enforcement)

**Action:** Implemented Spring Security as an OAuth2 Resource Server. All protected requests require a valid JWT. Every data query is scoped to the authenticated user derived from `jwt.getSubject()`.

**Implementation details:**

| Operation | Ownership enforcement |
|-----------|----------------------|
| List accounts | `accountRepository.findByUser(user)` |
| Get account by ID | `findByIdAndUser(accountId, user)` → 404 if not owned |
| Account lookup / claim | Returns 404 (not 403) if account belongs to another user—prevents enumeration |
| Transfer / bill pay | `findOwnedAccount(fromAccountId, currentUser)` on source account |
| Transaction history | `findByAccounts(userAccounts, pageable)` — only txs involving owned accounts |

**Account claiming flow:** Unclaimed accounts (`user_id IS NULL`) are assigned to the authenticated user on first successful lookup; accounts already owned by another user return a generic "Account not found" response.

**Justification:** We extract the `sub` (Subject ID) from the cryptographically signed JWT. Controllers explicitly **do not accept** `userId` query parameters. A user cannot access a resource they do not own, effectively eliminating IDOR vulnerabilities.

---

### Step 5: Frontend De-risking (BFF Proxy Pattern)

**Action:** Removed direct database access and vulnerable API logic from the Next.js layer. Client-side mutations route through authenticated Next.js API proxy handlers that attach the Auth0 access token server-side.

**Example** (`frontend/app/api/v1/transfers/route.ts`):

```typescript
const { token } = await auth0.getAccessToken()
const res = await fetch(`${BACKEND}/api/v1/transfers`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
```

**Proxy routes:**

| Next.js route | Backend endpoint |
|---------------|------------------|
| `/api/v1/users` | `/api/v1/users/me` |
| `/api/v1/accounts` | `/api/v1/accounts` |
| `/api/v1/accounts/lookup` | `/api/v1/accounts/lookup` |
| `/api/v1/transfers` | `/api/v1/transfers` |
| `/api/v1/bill-payments` | `/api/v1/bill-payments` |
| `/api/v1/transactions` | `/api/v1/transactions` |
| `/api/v1/admin` | `/api/v1/admin/{endpoint}` |

Server components (dashboard, e-statement, Smart Spend, admin) fetch directly from the backend using session-derived tokens—never exposing secrets to the browser bundle.

**Legacy artifact note:** Dependencies such as `pg` and `bcryptjs` remain in `package.json` from the original codebase but are **not imported** anywhere in the reengineered frontend source.

---

### Step 6: Admin RBAC (Database-Backed, Defense in Depth)

**Action:** Admin authorization uses the local `users.is_admin` flag rather than Auth0 paid RBAC.

**Implementation:**

- `JwtToUserConverter` grants `ROLE_admin` when `users.is_admin = true` for the JWT `sub`.
- `SecurityConfig`: `/api/v1/admin/**` requires `hasRole("admin")`.
- `AdminController`: class-level `@PreAuthorize("hasRole('admin')")`.
- Frontend admin page (`/admin`) verifies `isAdmin` via `/api/v1/users/me` before rendering.

**Promotion:** `UPDATE users SET is_admin = true WHERE email = 'admin@example.com';`

---

### Step 7: Smart Spend Reengineering

The original Smart Spend module used **hardcoded mock data** disconnected from real financial activity. The reengineered Smart Spend page (`frontend/app/smart-spend/page.tsx`) is a **read-only analytics layer** over the secured transaction API:

1. Authenticates via Auth0; redirects unauthenticated users to `/auth/login`.
2. Fetches `GET /api/v1/transactions?size=100` with a Bearer token (user-scoped server-side).
3. Filters to **successful debits only** (`status === 'SUCCESS'` and `direction !== 'CREDIT'`).
4. Computes client-side:
   - Total spent, transaction count, average, current-month total
   - Monthly spending trend (last 6 months)
   - Category breakdown via keyword matching (Utilities, Telecom, Transfers, Other)
   - Recent spending table with masked account numbers

**Design decision:** No dedicated Smart Spend backend endpoint was required. Analytics consume the same ownership-scoped transaction ledger used by the dashboard and e-statement—eliminating data drift between modules.

Transaction **direction** (DEBIT/CREDIT) is computed in `TransactionService.resolveDirection()` based on whether the user's account appears as the destination— it is not stored in the database, keeping the schema normalized.

---

## 5. Summary Table: Vulnerability Mitigation

| Vulnerability | Original state | New standard | Implementation reference |
|---------------|----------------|--------------|--------------------------|
| **Authentication** | Plaintext / Base64 forgery | Auth0 FAPI-compliant JWTs | `SecurityConfig`, `frontend/lib/auth0.ts` |
| **Database access** | Raw SQL strings (SQLi) | Spring Data JPA (parameterized) | `*Repository.java`, Flyway migrations |
| **Transaction logic** | Multi-step / non-atomic | ACID `@Transactional` | `TransferService`, `BillPaymentService` |
| **Account access** | None (IDOR enabled) | JWT-based ownership enforcement | `AccountService.findOwnedAccount`, `findByIdAndUser` |
| **Credential storage** | Plaintext passwords/PINs | Zero sensitive credentials stored | Auth0-only identity; `users.auth0_sub` |
| **Information disclosure** | Env/URI leaks in admin routes | Deny-by-default API; scoped admin endpoints | `SecurityConfig.anyRequest().denyAll()` |
| **Smart Spend data** | Hardcoded mocks | Live transaction API analytics | `smart-spend/page.tsx` + `TransactionService` |
| **Frontend trust** | DB queries in Next.js API routes | Stateless UI + BFF proxy | `frontend/app/api/v1/*` |

---

## 6. Data Model Overview

### Core entities

| Table | Purpose | Key constraints |
|-------|---------|-----------------|
| `users` | Local profile linked to Auth0 `sub` | `auth0_sub UNIQUE`; `is_admin BOOLEAN` |
| `accounts` | User-owned bank accounts | `balance >= 0`; `account_number UNIQUE` |
| `transactions` | Immutable financial ledger | `amount > 0`; `reference_number UNIQUE` |

### Reference number prefixes

| Prefix | Operation |
|--------|-----------|
| `NB-` | Internal transfer |
| `BP-` | Bill payment (no internal `to_account_id`) |

Full ERD and relationship details: [diagram-context.md §5](./diagram-context.md).

---

## 7. REST API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Health check |
| GET/POST | `/api/v1/users/me` | JWT | Profile read / upsert on login |
| GET | `/api/v1/accounts` | JWT | List owned accounts |
| GET | `/api/v1/accounts/lookup` | JWT | Claim or view account by number |
| GET | `/api/v1/accounts/{id}` | JWT | Get owned account by ID |
| POST | `/api/v1/transfers` | JWT | Execute atomic transfer |
| POST | `/api/v1/bill-payments` | JWT | Execute atomic bill payment |
| GET | `/api/v1/transactions` | JWT | Paginated, ownership-scoped history |
| GET | `/api/v1/admin/stats` | Admin | Platform KPIs |
| GET | `/api/v1/admin/users` | Admin | All registered users |
| GET | `/api/v1/admin/transactions` | Admin | All transactions |

Errors return RFC 7807 `ProblemDetail` via `GlobalExceptionHandler` (400 validation/insufficient funds, 403 forbidden, 404 not found).

---

## 8. Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, `@auth0/nextjs-auth0`, TypeScript |
| Backend | Spring Boot 3.4, Java 21, Spring Security OAuth2 Resource Server, Spring Data JPA, Flyway |
| Database | PostgreSQL 17 |
| Identity | Auth0 (Universal Login, JWT access tokens) |
| Deployment | Docker Compose (`frontend`, `backend`, `db` services) |

---

## 9. Deployment Topology

```text
Browser :443/3000
  → Next.js frontend (port 3000)
  → Spring Boot backend (port 8080)
  → PostgreSQL (port 5432, localhost-bound in dev)

External: Auth0 tenant (identity provider)
```

Environment variables are documented in `backend/.env.example` and `frontend/.env.example`. Sensitive values (Auth0 secrets, database URLs) are injected at runtime—not embedded in source code or returned by API endpoints.

---

## 10. Known Limitations & Follow-Up Items

The following items were identified during documentation review and represent honest gaps—not security regressions:

| Item | Detail |
|------|--------|
| `accounts.user_id` nullability | V1 migration defines `NOT NULL`; application code supports unclaimed accounts (`user_id = NULL`). Deployed databases may require `ALTER TABLE accounts ALTER COLUMN user_id DROP NOT NULL`. |
| Seed data format | V2 seed uses `NB-*` account numbers; runtime validation requires `ACC-[1-9]{10}`. |
| Unused frontend deps | `bcryptjs`, `pg` listed in `package.json` but not imported in reengineered source. |
| Mixed fetch patterns | Some pages use Next.js proxy routes; server components call the backend URL directly. Both paths attach Bearer tokens correctly. |
| Smart Spend categories | Keyword-based heuristics on transaction descriptions—not ML or merchant-category codes. |

---

## 11. Conclusion

The Smart Spend reengineering transformed an insecure proof-of-concept into **Nova Bank**—a production-oriented banking platform with clear tier separation, Auth0-backed identity, parameterized persistence, atomic financial transactions, and ownership-scoped data access. The Smart Spend analytics module now reflects **real user spending** from the same secured ledger that powers transfers, bill payments, and e-statements.

Patching the original codebase would have preserved its fundamental trust model. The architectural pivot was the correct response to the forensic findings documented in this report.

---

## 12. References

| Resource | Location |
|----------|----------|
| Architecture & flow diagram context | [docs/diagram-context.md](./diagram-context.md) |
| Backend entry point | `backend/src/main/java/com/novabank/NovaBankApplication.java` |
| Security configuration | `backend/src/main/java/com/novabank/config/SecurityConfig.java` |
| Transfer service (ACID) | `backend/src/main/java/com/novabank/service/TransferService.java` |
| Bill payment service (ACID) | `backend/src/main/java/com/novabank/service/BillPaymentService.java` |
| Account ownership | `backend/src/main/java/com/novabank/service/AccountService.java` |
| Smart Spend UI | `frontend/app/smart-spend/page.tsx` |
| Auth0 integration | `frontend/lib/auth0.ts` |
| Database migrations | `backend/src/main/resources/db/migration/` |
