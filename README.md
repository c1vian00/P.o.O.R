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
```text
POOR/
├── app/
│   ├── backend/          # FastAPI server and RAG logic
│   │   ├── main.py       # API routes and SSE configuration
│   │   ├── rag/
│   │   │   └── rag_engine.py # Database retrieval and Gemini integration
│   │   └── utils/        # Global utilities for scalability
│   │       ├── __init__.py
│   │       └── ai_utils.py   # Model fallback and stream management
│   └── frontend/         # React application
├── data/
│   ├── chroma_db/        # Persistent Vector Store (Ignored by Git)
│   ├── chunks/           # Processed text segments
│   └── extracted_text/   # Cleaned text from EPUBs
├── scripts/
│   ├── extract.py        # EPUB to Text parser
│   ├── chunk.py          # Semantic text splitter
│   └── index.py          # ChromaDB ingestion
├── tests/
│   └── test_api.py       # Backend simulation script
├── .env                  # API Keys (Google Gemini) and Config
└── requirements.txt      # Python dependencies
```

## Setup and Running Instructions

1.  **Install Backend Dependencies:**  
    `pip install -r requirements.txt`

2.  **Install Frontend Dependencies:**  
    `cd app/frontend` -> `npm install`

3.  **Initialize the Data Pipeline:**  
    Place the .epub files in the data/ folder, then run:
    - `python scripts/extract.py`
    -   `python scripts/chunk.py`
    -   `python scripts/index.py`

4.  **Start the Application:**  
    - **Backend:** `python -m app.backend.main` (runs on port 8000)
    - **Frontend:** `cd app/frontend && npm start`

## Technical Choices and Student Updates

### 1. Decoupled Utility Architecture (`app/backend/utils/`)
*   **What was done:** A centralized `utils/` directory was created to house `ai_utils.py`.
*   **Why it was done:** This follows clean code principles. Moving AI logic to a global utility folder makes the code more modular. This allows other future features to use the same AI helpers without circular imports.

### 2. Multi-Model Resilience Strategy (`ai_utils.py`)
*   **What was done:** A fallback mechanism was developed that cycles through a list of Gemini models (`3.1 Flash Lite`, `3 Flash`, `2.5 Flash`) if the primary one is busy.
*   **Why it was done:** Free-tier API keys frequently hit "503 Service Unavailable" errors during peak times. This script prevents the app from crashing by automatically finding a healthy model to take over the request.

### 3. Stream-Peeking Generator (`ai_utils.py`)
*   **What was done:** A "peek" function was implemented that checks the first chunk of a stream before committing to it.
*   **Why it was done:** Because the AI SDK streams data lazily, crashes often happen *after* the stream starts. By forcing a check on the first bit of data inside a `try/except` block, failures can be caught early and trigger the fallback before the user's connection is broken.

### 4. Semantic Preference Injection & Query Purifying (`rag_engine.py`)
*   **What was done:** User filters (Time, Mood, Serving Size, Meal Type) are dynamically appended to the vector database search query, while UI placeholders (like "No specific preference") are explicitly stripped out before searching.
*   **Why it was done:** Vector databases perform semantic matching. If placeholders aren't stripped, the database might return an author's biography just because it contains the word "preference." Purifying the query ensures ChromaDB only fetches highly relevant recipe chunks.

### 5. Tag-Based Stream Interception & JSON Vault (`App.jsx` & `rag_engine.py`)
*   **What was done:** The LLM was prompt-engineered to output a secret `[RECIPE_FOUND]` tag followed by strict JSON. The React frontend was rebuilt to intercept this tag mid-stream, hide the JSON from the user's chat UI, and buffer it into a hidden string for parsing. 
*   **Why it was done:** React components (like the Shopping List and Recipe Display) require highly structured JavaScript objects, not markdown text. This "track switching" approach allows the AI to be conversational in the chat, but strictly programmatic when delivering the final data payload.

### 6. Strict Allergy Guardrails (`rag_engine.py`)
*   **What was done:** A hardcoded "CRITICAL SAFETY" rule was added to the LLM's system prompt, strictly forbidding the inclusion of user-defined allergens. 
*   **Why it was done:** LLMs are notoriously bad at "negative constraints" (e.g., hallucinating soy milk into a recipe when asked to avoid soy). This explicit rule forces the AI to actively substitute or reject dangerous recipes retrieved from the vector database.

### 7. Dynamic UI State Stamping (`RecipeDisplay.jsx`)
*   **What was done:** Active user filters are stamped directly onto the JSON recipe object and rendered as visual UI pills, utilizing dynamic inline styling to clearly cross out excluded allergens.
*   **Why it was done:** It provides the user with a visual "receipt" confirming that the AI actually listened to their constraints. It visually bridges the gap between the sidebar filters and the final generated output.

## AI Tools Used
- Gemini used for:
  - Brainstorming project tools
  - Developing project structure
  - Code corrections because I suck
