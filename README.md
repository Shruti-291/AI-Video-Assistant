# 🎥 AI Video Assistant

AI Video Assistant is an intelligent **video understanding and conversational Q&A platform** that makes long YouTube videos and uploaded media easier to understand. It processes video audio, generates transcripts using Whisper, creates summaries and structured insights, and enables context-aware Q&A through a **Retrieval-Augmented Generation (RAG)** pipeline.

The application combines **Whisper, LangChain, Mistral AI, ChromaDB, and HuggingFace embeddings** to transform long-form video content into searchable and conversational knowledge.

---

## 🌟 Key Features

- 🎙️ **AI Transcription** — Converts video audio into text using OpenAI Whisper.
- 📝 **Smart Summarization** — Generates concise summaries and structured insights.
- 📌 **Key Insights** — Extracts key points, action items, decisions, and open questions.
- 🧠 **RAG-based Q&A** — Ask questions about the video and get context-grounded answers.
- 🔎 **Semantic Search** — Uses HuggingFace embeddings with ChromaDB for relevant context retrieval.
- 🤖 **Mistral AI** — Generates conversational answers using retrieved video context.
- 🎥 **YouTube Processing** — Downloads and processes YouTube audio using yt-dlp and FFmpeg.
- 🌐 **Web Interface** — Interactive frontend built with HTML, CSS, and JavaScript.

---

## 🏗️ Project Structure

```text
AIVideoAssistant_/
│
├── core/
│   ├── extractor.py
│   ├── rag_engine.py
│   ├── summarize.py
│   ├── transcriber.py
│   └── vector_store.py
│
├── utils/
│   └── audio_processor.py
│
├── templates/
│   └── index.html
│
├── static/
│   ├── app.js
│   └── style.css
│
├── vector_db/                 # ChromaDB storage
├── downloads/                 # Processed media files
│
├── main.py
├── server.py
├── requirements.txt
└── .env
```

---

## 🧠 AI Pipeline

```text
YouTube / Uploaded Video
          ↓
     yt-dlp + FFmpeg
          ↓
    Audio Processing
          ↓
        Whisper
          ↓
      Transcript
          ↓
   ┌──────┴───────┐
   ↓              ↓
Summary        ChromaDB
& Insights     + Embeddings
                  ↓
             User Question
                  ↓
             RAG Retrieval
                  ↓
              Mistral AI
                  ↓
          Contextual Answer
```

---

## 🛠️ Tech Stack

**Backend:** Python, Flask  
**AI/ML:** Whisper, Mistral AI, LangChain, HuggingFace  
**RAG:** ChromaDB, Embeddings  
**Audio/Video:** yt-dlp, Pydub, FFmpeg  
**Frontend:** HTML, CSS, JavaScript

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AIVideoAssistant_
```

### 2. Create virtual environment

```bash
python -m venv .venv
```

Activate on Windows:

```powershell
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure `.env`

```env
MISTRAL_API_KEY=your_mistral_api_key
```

### 5. Run the application

```bash
python server.py
```

Open the local URL shown by Flask in your browser.

---


