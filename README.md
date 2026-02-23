# Smart EMR & Diagnostic Assistant

An AI-powered full-stack web application for clinical documentation. Record or upload patient consultations, auto-generate transcripts, and produce structured Electronic Medical Records (EMR) in seconds.

---

## Project Structure

```
Smart EMR & Diagnostic Assistant/
├── backend/                  # Node.js / Express API
│   ├── routes/
│   │   ├── audio.js          # Audio upload & recording endpoints
│   │   ├── transcript.js     # Transcript management endpoints
│   │   └── emr.js            # EMR generation endpoints
│   ├── uploads/              # Uploaded audio files (auto-created)
│   ├── server.js             # Express app entry point
│   ├── .env                  # Environment variables
│   └── package.json
│
└── frontend/                 # React SPA
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Navbar.jsx    # Top navigation bar
        │   └── Layout.jsx    # App shell wrapper
        ├── pages/
        │   ├── Home.jsx          # Homepage with feature cards
        │   ├── RecordUpload.jsx  # Live recording + file upload
        │   ├── Transcript.jsx    # Transcript list & viewer
        │   └── GenerateEMR.jsx   # EMR generation from transcript
        ├── App.jsx           # Router & route definitions
        ├── App.css           # Shared component styles
        ├── index.js          # React entry point
        └── index.css         # Global reset & CSS variables
```

---

## Getting Started

### 1. Backend

```bash
cd backend
npm install
npm run dev       # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start         # Starts on http://localhost:3000
```

> The frontend proxies `/api/*` requests to `http://localhost:5000` (configured in `package.json`).

---

## API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | /api/health               | Health check                       |
| POST   | /api/audio/upload         | Upload an audio file               |
| POST   | /api/audio/record         | Submit a recorded audio blob       |
| GET    | /api/transcript           | List all transcripts               |
| GET    | /api/transcript/:id       | Get a specific transcript          |
| POST   | /api/transcript/generate  | Trigger transcription for audio    |
| GET    | /api/emr                  | List all EMR records               |
| POST   | /api/emr/generate         | Generate EMR from transcript text  |
| GET    | /api/emr/:id              | Get a specific EMR record          |

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18, React Router v6     |
| Backend   | Node.js, Express 4            |
| Styling   | Custom CSS (CSS Variables)    |
| File Upload | Multer                      |
| Fonts     | Inter (Google Fonts)          |

---

## Roadmap

- [ ] Integrate Whisper / Azure Speech for real transcription
- [ ] Connect GPT-4 / Claude for intelligent EMR generation
- [ ] Add authentication (JWT)
- [ ] Persist data with MongoDB / PostgreSQL
- [ ] Export EMR as PDF

---

