# POOR - Preparation of Oulu Recipes

This repository contains the full source code for POOR (Preparation of Oulu Recipes). The project implements a complete RAG (Retrieval-Augmented Generation) pipeline that transforms EPUB cookbooks into a searchable semantic database, integrated with a React frontend.

## Project Architecture

The application follows a full-stack AI architecture:

- **Frontend:** React-based user interface for recipe queries and result visualization.
- **Backend:** FastAPI (Python) server orchestrating LLM calls, vector searches, and SSE streaming.
- **Database:** ChromaDB persistent vector store for semantic recipe retrieval.
- **Streaming:** Server-Sent Events (SSE) for real-time, word-by-word recipe generation.
- **Data Pipeline:** Modular ETL (Extract, Transform, Load) for processing cookbook data.

Raw EPUBs -> ETL Pipeline -> ChromaDB -> RAG Engine -> FastAPI (SSE) -> React UI

## Project Structure
```
POOR/
├── app/
│   ├── backend/          # FastAPI server and RAG logic
│   │   ├── main.py       # API routes and SSE configuration
│   │   ├── rag/
│   │   │   └── rag_engine.py # Database retrieval and Gemini integration
│   │   └── utils/        # Global utilities for scalability
│   │       ├── __init__.py
│   │       └── ai_utils.py   # Model fallback and stream management
│   └── frontend/         # React application
├── data/
│   ├── chroma_db/        # Persistent Vector Store (Ignored by Git)
│   ├── chunks/           # Processed text segments
│   └── extracted_text/   # Cleaned text from EPUBs
├── scripts/
│   ├── extract.py        # EPUB to Text parser
│   ├── chunk.py          # Semantic text splitter
│   └── index.py          # ChromaDB ingestion
├── tests/
│   └── test_api.py       # Backend simulation script
├── .env                  # API Keys (Google Gemini) and Config
└── requirements.txt      # Python dependencies
```

## Setup and Running Instructions

1.  **Install Backend Dependencies:**
    `pip install -r requirements.txt`

2.  **Install Frontend Dependencies:**
    `cd app/frontend` -> `npm install`

3.  **Initialize the Data Pipeline:**
    Place the .epub files in the data/ folder, then run:
    -   `python scripts/extract.py`
    -   `python scripts/chunk.py`
    -   `python scripts/index.py`

4.  **Start the Application:**
    -   **Backend:** `python -m app.backend.main` (runs on port 8000)
    -   **Frontend:** `cd app/frontend && npm start`

## Technical Choices and Student Updates

### 1. Decoupled Utility Architecture (`app/backend/utils/`)
*   **What was done:** A centralized `utils/` directory was created to house `ai_utils.py`.
*   **Why it was done:** This follows clean code principles. Moving AI logic to a global utility folder makes the code more modular. This allows other future features (like image processing) to use the same AI helpers without circular imports.

### 2. Multi-Model Resilience Strategy (`ai_utils.py`)
*   **What was done:** A fallback mechanism was developed that cycles through a list of Gemini models (`3.1 Flash Lite`, `3 Flash`, `2.5 Flash`) if the primary one is busy.
*   **Why it was done:** Free-tier API keys frequently hit "503 Service Unavailable" errors during peak times. This script prevents the app from crashing by automatically finding a healthy model to take over the request.

### 3. Stream-Peeking Generator (`ai_utils.py`)
*   **What was done:** A "peek" function was implemented that checks the first chunk of a stream before committing to it.
*   **Why it was done:** Because Google's SDK is "lazy," a crash often happens *after* the stream starts. By forcing a check on the first bit of data inside a `try/except` block, failures can be caught early and trigger the fallback before the user's connection is broken.

### 4. Semantic Preference Injection (`rag_engine.py`)
*   **What was done:** A preferences dictionary (Time, Mood, Serving Size, Meal Type, Allergies) was added that is prepended to the search query and the system prompt.
*   **Why it was done:** This makes the RAG search "smarter." If the user filters for "15 minutes," the database specifically hunts for chunks from the fast-cooking cookbooks. It also prevents the AI from asking redundant questions the user has already answered in the UI.

### 5. Tag-Based UI Triggers
*   **What was done:** A monitor was created for a specific `[RECIPE_FOUND]` string within the token stream.
*   **Why it was done:** To create a "bridge" between the AI's text and the frontend UI. This allows the backend to signal the React frontend to open a specific Recipe Modal exactly when the AI has finished its suggestion.

## AI Tools Used
- Gemini used for:
  - Brainstorming project tools
  - Developing project structure
  - Code corrections because I suck
