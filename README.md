# 🌸 Rejan's Study Corner

A cute little private study room — a full online exam/study platform built
specifically to help Rejan study, with your cat as her study buddy.

Flow: **Open the website → enter name → pick an exam → study.**
No accounts, no passwords, no Firebase Auth, no Firebase Storage.

---

## 1. What's inside

- **React + Vite + Tailwind CSS**, no backend server of your own — Firestore
  is the only persistence layer.
- **No Firebase Authentication.** Students never log in.
- **"Creator Mode"** — a PIN-gated area (not real security, see below) where
  you create exams, manage the question bank, import CSVs, view results, and
  set up the Study Buddy cat photo/GIF.
- **Cat images/GIFs** are external URLs you paste in — never uploaded, never
  stored in Firebase Storage. Every URL is test-loaded before it's saved, and
  the app falls back to a cute placeholder if an image stops working later.
- **A real countdown timer** anchored to Firestore timestamps
  (`startedAt` / `expiresAt`), so refreshing the page never grants extra time.
- **Server-side-style grading**: scores are always recalculated from the
  correct answers stored in Firestore — never trusted from the browser.

## 2. Getting it running

```bash
npm install
npm run dev
```

A `.env` file is already included with this project's Firebase config and
a default Creator Mode PIN (`101702`) — change the PIN in `.env` to
whatever you like before sharing the URL with anyone. If you ever need to
recreate it, copy `.env.example` and fill in the values from your Firebase
project (Project Settings → your web app → SDK setup and configuration).

```bash
cp .env.example .env
```

## 3. Setting up Firestore

1. In the [Firebase Console](https://console.firebase.google.com), open
   your project (`forrejan-45d8d` by default) → **Build → Firestore
   Database** → **Create database** (production mode is fine).
2. Deploy the included security rules (or paste `firestore.rules` into the
   Rules tab in the console):
   ```bash
   npm install -g firebase-tools   # one time
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```
3. That's it — no Storage bucket, no Auth provider to configure.

Firestore will auto-create these collections the first time you use each
feature: `exams`, `questions`, `attempts` (with an `answers` subcollection
per attempt), and `settings` (a single `studyBuddy` document).

## 4. Deploying it somewhere real

Any static host works great since this is a plain Vite build — Firebase
Hosting, Vercel, Netlify, GitHub Pages, etc.

```bash
npm run build
# deploy the generated dist/ folder to your host of choice
```

If you use Firebase Hosting:

```bash
firebase init hosting   # point it at ./dist
npm run build
firebase deploy --only hosting
```

Remember to set the same environment variables (`VITE_FIREBASE_*`,
`VITE_ADMIN_PIN`) in your host's build settings if it builds from source
(Vercel/Netlify project settings → Environment Variables).

## 5. ⚠️ Security notes — please read

This is a private project for two people, so it intentionally trades real
security for simplicity. Please understand these trade-offs before putting
the URL anywhere public:

- **The Creator Mode PIN is a UI speed bump, not authentication.** It lives
  in a client-side env var that ends up inside the JavaScript bundle.
  Anyone determined enough to open devtools and read the bundle can find it
  — or just call Firestore directly, bypassing your app entirely.
- **Firestore Security Rules can't tell a creator from a student**, because
  there's no Firebase Auth user to check `request.auth` against. The
  included `firestore.rules` documents this explicitly and only does basic
  shape validation (right fields, right types) rather than pretending to
  enforce "only the creator can publish exams."
- **Don't put anything truly sensitive in this app.** Treat it like a
  shared notebook, not a bank vault.
- If you outgrow this later, the natural upgrade path is adding real
  Firebase Authentication (e.g. a single email/password account for you)
  and rewriting the rules around `request.auth.uid`.

## 6. Project structure

```
src/
├── components/     StudyBuddy, ExamCard, QuestionCard, Timer, QuestionNavigation, ui/
├── pages/          Home/, Exam/ (instructions, take, result), Admin/ (creator mode)
├── firebase/        Firebase app + Firestore init
├── services/        All Firestore reads/writes, grouped by domain
├── hooks/            useCreatorMode (PIN gate), useCountdown (exam timer)
└── utils/            csv parsing/export, grading, image URL validation
```

Firebase calls live only in `src/services/*` — components never talk to
Firestore directly.

## 7. Data model

```
exams/{examId}
  { title, description, instructions, durationMinutes, passingPercentage,
    published, questionIds[], createdAt, updatedAt }

questions/{questionId}
  { question, type, options[], correctAnswer, points, category,
    explanation, createdAt, updatedAt }

attempts/{attemptId}
  { username, examId, startedAt, expiresAt, submittedAt, status,
    score, totalPoints, percentage, passed }
  attempts/{attemptId}/answers/{questionId}
    { value, updatedAt }

settings/studyBuddy
  { images: { default, studying, happy, celebration, sleepy,
              encouraging, passed, tryAgain }, caption }
```

## 8. CSV import format

```
question,type,option_a,option_b,option_c,option_d,correct_answer,points,category,explanation
What is 2 + 2?,multiple_choice,3,4,5,6,B,1,Math,2 + 2 equals 4.
```

`type` is one of `multiple_choice`, `true_false`, `short_answer`.
Grab `question-template.csv` from **Creator Mode → Questions → Import CSV
→ Download CSV Template**.

## 9. End-to-end checklist (what you should be able to do)

1. Open the website → see Rejan's Study Corner.
2. Tap **⚙️ Manage Exams**, enter the PIN.
3. Create an exam, add questions (manually or via CSV import), publish it.
4. Exit Creator Mode.
5. Enter a name, pick the exam, read the instructions, start it.
6. Watch the countdown timer, answer questions, jump between them.
7. Submit → see a score calculated from Firestore, not the browser.
8. See the attempt appear in Creator Mode → Results.
9. In Creator Mode → Study Buddy, paste a direct cat photo/GIF URL, preview
   it, save it — see it show up around the app, with a graceful fallback if
   it ever stops loading.

Enjoy studying together. 💗🐱
