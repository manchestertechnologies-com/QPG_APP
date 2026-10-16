# QPG — Question Paper Generator (Mobile & Backend System)

Production-oriented cross-platform mobile application and backend architecture built for faculty, teachers, and educational institutions to browse an authentic question bank and generate 2026 examination question papers with instant, publication-grade PDF export.

---

## 1. Project Architecture & Stack

### Mobile Application (`/mobile`)
* **Framework:** React Native with Expo (SDK 52+)
* **Language:** TypeScript
* **Navigation:** React Navigation (Native Stack + Bottom Tabs)
* **Design System:** Deep navy foundation (`#090D16`), violet/indigo accents (`#6366F1`, `#8B5CF6`), dark & light theme support
* **Math & Diagrams:** KaTeX mathematical formula rendering & Cloudinary high-res diagram integration (`{{IMG::<url>}}`)
* **Document Engine:** `expo-print` & `expo-sharing` (Vector-sharp PDF export only; Word/DOCX strictly prohibited)
* **Local Paper Vault:** `@react-native-async-storage/async-storage` (Papers stored locally on device; automatically locked if subscription expires)

### Backend API & Admin Portal (`/backend`)
* **Runtime:** Node.js (v24) + Express + TypeScript
* **Admin Verification Portal:** Served at `http://localhost:5000/admin` (Interactive web dashboard to review, approve, and reject UPI payments)
* **Connected Databases:** 8 Supabase PostgreSQL Databases across 4 subjects and Class 11 & 12
* **Total Question Bank:** **89,202 verified live questions**
  - **Chemistry:** 23,603 questions (12,997 Class 11 + 10,606 Class 12)
  - **Physics:** 24,757 questions (11,424 Class 11 + 13,333 Class 12)
  - **Mathematics:** 16,970 questions (7,418 Class 11 + 9,552 Class 12)
  - **Biology:** 23,872 questions (14,288 Class 11 + 9,584 Class 12)

---

## 2. Key Business & Pedagogical Rules Implemented

1. **Teacher-Specific Subject Locking:**
   - At onboarding / initial sign-up, the teacher selects their subject specialization: **Chemistry**, **Physics**, **Mathematics**, or **Biology**.
   - The teacher's profile is permanently locked to that subject. A Chemistry teacher can only browse and generate papers for Chemistry (Class 11 & 12).
2. **Email + OTP Authentication:**
   - One email address = one teacher account.
   - 6-digit cryptographic OTP verification.
3. **2026 Examination Patterns:**
   - **NEET 2026:** Section A (35 mandatory questions) + Section B (15 questions, attempt any 10). Total 45 attempted questions = 180 Marks (+4 / -1).
   - **JEE Main 2026:** Section A (20 MCQs, +4 / -1) + Section B (10 Numerical Value questions, attempt any 5, +4 / -1). Total 25 attempted questions = 100 Marks.
   - **CET / KCET 2026:** 60 Multiple Choice Questions = 60 Marks, 80 Minutes (No negative marking).
   - **Custom Chapter Practice:** Configure question counts, custom marks, negative marking, and target chapter mix.
4. **Local Storage for Generated Papers:**
   - Generated papers are saved directly to device storage.
   - **Strict Expiry Lockout:** When a teacher's subscription expires or is inactive, access to already created papers in the local vault is locked until renewed.
5. **Subscription & ₹299 UPI QR Payment:**
   - ₹299 for exactly one calendar month.
   - Dynamic UPI QR Code screen (`upi://pay?pa=...&am=299`).
   - Teacher submits 12-digit UPI transaction reference (UTR).
   - Duplicate UTR prevention enforced on backend.
   - Admin reviews queue on `/admin` and approves/rejects with audit trail.
6. **Accurate Calendar Month Expiry:**
   - Exact calendar-month calculation in `Asia/Kolkata` timezone (e.g. Jan 31 -> Feb 28/29, Mar 31 -> Apr 30).
7. **Publication-Grade PDF Generation:**
   - Configurable institutional header, general instructions, section headings, LaTeX formulas, diagrams, answer key grid, and detailed step-by-step solutions.
   - Strictly PDF format only.

---

## 3. Database Schema for Your New Database (`backend/schema.sql`)

When you create your new PostgreSQL / Supabase database, execute [`backend/schema.sql`](file:///c:/Users/swamy/OneDrive/Desktop/APP/backend/schema.sql) in your SQL editor. It defines:
- `users` (Email, name, institution, locked subject, role)
- `otps` (Email, code, expires_at)
- `subscriptions` (Plan name, ₹299 amount, status, started_at, expires_at, payment_reference)
- `payment_requests` (UTR, amount, user_email, status, verified_by, verified_at)
- `audit_logs` (Action, actor, details, timestamp)

Once created, simply paste your new database connection string into `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

---

## 4. Quick Start & Local Development

### 1. Launch the Backend API & Admin Portal
```bash
cd backend
npm install
npm run build
npm start
```
* **API Server:** `http://localhost:5000`
* **Admin Verification Portal:** `http://localhost:5000/admin`
  - Default Admin Email: `admin@qpg.com`
  - Default Admin Password: `Admin@QPG2026`

### 2. Run Automated Backend Tests
```bash
cd backend
npm test
```
*Verifies calendar-month math, teacher subject locking, duplicate UTR prevention, admin payment approval, 2026 NEET/JEE/CET generation, and publication HTML templates.*

### 3. Launch the Mobile Application
```bash
cd mobile
npm install
npx expo start
```
- Press `a` to open Android Emulator.
- Press `i` to open iOS Simulator.
- Press `w` to run on Web.
- Or scan the QR code with the **Expo Go** app on your physical Android or iPhone device!

---

## 5. Summary of Verification & Test Results

| Test Category | Tested Behavior | Status |
|---|---|---|
| **Month Calculation** | Jan 31 -> Feb 28, Mar 31 -> Apr 30, Year Rollover | ✅ PASSED |
| **Subject Isolation** | Chem teacher locked to Chem (23,603 Qs) | ✅ PASSED |
| **Authentication** | Email + OTP verification; One email = One account | ✅ PASSED |
| **Duplicate Prevention** | Rejected duplicate UTR references | ✅ PASSED |
| **Admin Approval** | Admin approved payment -> 1-month subscription active | ✅ PASSED |
| **NEET 2026 Pattern** | 35 Sec A + 15 Sec B = 50 Qs, 180 Marks (+4/-1) | ✅ PASSED |
| **CET 2026 Pattern** | 60 MCQs, 60 Marks, 80 mins, 0 negative marking | ✅ PASSED |
| **PDF Generation** | Vector-sharp KaTeX formulas, diagrams, answer key | ✅ PASSED |
| **Local Vault Lock** | Expired subscriber locked from viewing saved papers | ✅ PASSED |
| **Live E2E Flow** | 10/10 live API integration steps executed | ✅ PASSED |
