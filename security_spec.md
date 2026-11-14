# CrisisGrid AI — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default Deny**: Any path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All reads and writes to `/simulations/{simulationId}` and `/operators/{operatorId}` require an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
3. **Path ID Hardening**: Document IDs `{simulationId}` and `{operatorId}` must match `^[a-zA-Z0-9_\-]+$` with length `1..128` for all single-document operations (`get`, `create`, `update`, `delete`).
4. **Strict Ownership (`ownerId`)**:
   - On `/simulations/{simulationId}`:
     - `create`: `incoming().ownerId == request.auth.uid`.
     - `get`, `list`, `update`, `delete`: `existing().ownerId == request.auth.uid`.
     - `update`: `incoming().ownerId == existing().ownerId` (immutable owner).
   - On `/operators/{operatorId}`:
     - Document ID `{operatorId}` must equal `request.auth.uid` (`operatorId == request.auth.uid`).
     - `create`: `incoming().ownerId == request.auth.uid`.
     - `get`, `update`: `existing().ownerId == request.auth.uid` and `incoming().ownerId == existing().ownerId`.
     - No `list` access is granted on `/operators` (strict owner-only document lookup).
5. **Schema & Volumetric Bounds**:
   - `isValidSimulationRecord(data)`:
     - Required keys: `['ownerId', 'scenario', 'supply', 'totalDemand', 'safe', 'statusMessage', 'hospitalAllocated', 'waterAllocated', 'emergencyAllocated', 'telecomAllocated', 'createdAt', 'updatedAt']`.
     - Allowed keys: `['ownerId', 'scenario', 'supply', 'totalDemand', 'safe', 'statusMessage', 'hospitalAllocated', 'waterAllocated', 'emergencyAllocated', 'telecomAllocated', 'notes', 'createdAt', 'updatedAt']`.
     - `scenario` is string (`1..64`), `statusMessage` is string (`1..160`), optional `notes` is string (`<= 300`), numeric values in `0..10000`.
   - `isValidOperatorProfile(data)`:
     - Required & allowed keys: `['ownerId', 'displayName', 'organization', 'sectorClearance', 'createdAt', 'updatedAt']`.
     - `displayName` is string (`1..80`), `organization` is string (`1..80`), `sectorClearance` is string (`1..40`) in `['Grid Commander', 'Hospital Liaison', 'Water Operations', 'Emergency Dispatch', 'Telecom Engineer']`.
6. **Temporal Integrity**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: `auth = null`, creating `/simulations/sim_1`.
2. **Unverified Email Spoof**: `auth.uid = 'user_1'`, `email_verified = false`, creating `/simulations/sim_1`.
3. **Identity Spoofing on Create**: `auth.uid = 'user_1'`, `payload.ownerId = 'victim_uid'`.
4. **Shadow Field Injection on Create**: Adding undeclared field `isAdmin: true` to `/operators/user_1`.
5. **Path ID Poisoning**: Creating `/simulations/invalid$id!@#` with invalid characters.
6. **Oversized String Denial-of-Wallet**: `scenario` string of 500 characters (`> 64`).
7. **Negative Power Value Poisoning**: `supply: -50` or `hospitalAllocated: -10`.
8. **Client-Spoofed Timestamp on Create**: `createdAt` set to a past timestamp instead of `request.time`.
9. **Owner Hijack on Update**: Changing `ownerId` from `'user_1'` to `'user_2'` during update.
10. **Unauthorized Field Mutation on Update**: Attempting to mutate `supply` or `scenario` when only `['notes', 'updatedAt']` is allowed in the simulation update action.
11. **Cross-Tenant Operator Profile Read**: `auth.uid = 'attacker'` attempting `get` on `/operators/user_1`.
12. **Unfiltered Blanket List Query**: `auth.uid = 'attacker'` attempting `list` on `/simulations` without filtering `ownerId == request.auth.uid` or attempting `list` on `/operators`.
