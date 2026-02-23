# 🏥 MedLexa AI  
## Smart Voice-Based EMR, ICD Coding & Diagnostic Engine

MedLexa AI is an AI-powered full-stack clinical documentation system that converts doctor–patient conversations into structured Electronic Medical Records (EMR), automatically maps ICD-10 codes, and supports intelligent diagnostic workflows.

Designed to reduce clinician documentation burden, improve accuracy, and enhance emergency triage efficiency.

---

## 🚀 Key Features

🎤 **Voice-to-Text Transcription**  
Record or upload patient consultations and generate real-time transcripts.

🧠 **AI-Powered Medical Summarization**  
Extract symptoms, vitals, diagnoses, and clinical findings from conversations.

🏷 **Automatic ICD-10 Mapping**  
Map detected diseases to standardized ICD codes with confidence scoring.

📄 **Structured EMR Generation**  
Auto-generate clean, structured electronic medical records.

📊 **Transcript Management System**  
Store, retrieve, and manage consultation transcripts.

🔐 **MongoDB Atlas Integration**  
Secure data storage.

---

## 🏗 System Architecture

Doctor–Patient Conversation  
⬇  
Speech-to-Text Engine  
⬇  
Medical NLP Processing  
⬇  
ICD Mapping & Diagnosis Extraction  
⬇  
Structured EMR Generation  
⬇  
Database Storage (MongoDB)

---

## 🛠 Tech Stack

### Frontend
- React 18
- React Router v6
- Custom CSS (Modern UI)
- Axios

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Multer (File Upload)
- Nodemon

---

## 📁 Project Structure


MedLexa-AI/
├── backend/
│ ├── routes/
│ ├── uploads/
│ ├── server.js
│ └── package.json
│
└── frontend/
├── public/
├── src/
├── package.json


---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository


git clone https://github.com/arpitadhage/MedLexa-AI-Smart-Voice-Based-EMR-ICD-Diagnostic-Engine.git

cd MedLexa-AI-Smart-Voice-Based-EMR-ICD-Diagnostic-Engine


---

### 2️⃣ Backend Setup


cd backend
npm install


Create `.env` file inside backend:


PORT=5000
MONGO_URI=your_mongodb_connection_string


Run backend:


npm run dev


Backend runs at:

http://localhost:5000


---

### 3️⃣ Frontend Setup

Open new terminal:


cd frontend

npm install

npm start


Frontend runs at:

http://localhost:3000


---

## 🔐 Environment Variables

| Variable | Description |
|----------|------------|
| PORT | Backend server port |
| MONGO_URI | MongoDB Atlas connection string |

---

## 📌 Roadmap

- [ ] Integrate OpenAI / GPT for intelligent EMR drafting
- [ ] Whisper / Azure Speech real-time transcription
- [ ] Role-based authentication (JWT)
- [ ] Export EMR as downloadable PDF
- [ ] Doctor Dashboard Analytics

---

## 🎯 Use Cases

- Hospitals & Clinics
- Telemedicine Platforms
- Emergency Departments
- Medical Documentation Automation
- Healthcare AI Research

---

## 🧠 Innovation Highlights

- Reduces manual documentation workload  
- Standardizes medical coding with ICD integration  
- Improves emergency triage response  
- Enhances clinical workflow efficiency  

---

## 📜 License

MIT License

---

## 👩‍💻 Developed By

Arpita Dhage  
B.Tech Computer Science (AI/ML)
