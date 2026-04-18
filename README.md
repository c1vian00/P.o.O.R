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
│   │   └── rag/
│   │       └── rag_engine.py # Database retrieval and Gemini integration
│   └── frontend/         # React application
├── data/
│   ├── chroma_db/        # Persistent Vector Store (Ignored by Git)
│   ├── chunks/           # Processed text segments
│   └── extracted_text/   # Cleaned text from EPUBs
├── scripts/
│   ├── extract.py        # EPUB to Text parser
│   ├── chunk.py          # Semantic text splitter
│   └── index.py          # ChromaDB ingestion
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

## Technical Choices

### Data Pipeline (scripts/)

1.  **extract.py**
    -   **Function:** Scans /data for .epub files, parses XHTML, and saves cleaned .txt files.
    -   **Technology:** EbookLib and BeautifulSoup4.

2.  **chunk.py**
    -   **Function:** Breaks text into 1000-character segments with 100-character overlap.
    -   **Technology:** RecursiveCharacterTextSplitter.

3.  **index.py**
    -   **Function:** Converts text chunks into vectors for storage.
    -   **Technology:** ChromaDB with `all-MiniLM-L6-v2` embedding model.

### RAG & API Layer (app/backend/)

1.  **rag\_engine.py**
    -   **Function:** Performs semantic search against ChromaDB to retrieve relevant recipe context and manages the prompt lifecycle.
    -   **Technology:** `google-genai` (Gemini 2.5 Flash).
    -   **Rationale:** Retrieves the top 3 relevant chunks to ground the LLM's responses in local cookbook data.

2.  **main.py**
    -   **Function:** Provides the `/chat` endpoint using `StreamingResponse`.
    -   **Technology:** FastAPI with Server-Sent Events (SSE).
    -   **Rationale:** Streaming allows the UI to display the recipe word-by-word as it is generated, significantly improving perceived latency.

## Development and Debugging

-   **SSE Verification:** The streaming backend can be tested directly in the browser by visiting `http://localhost:8000/chat?message=YOUR\_QUERY`.
-   **ChromaDB Inspection:** Ensure the collection name in `rag\_engine.py` matches the name initialized in `index.py`.

## Known Limitations

-   **Table Data:** Complex HTML tables in cookbooks may be flattened into single strings during extraction.
-   **Scraper Stability:** The K-Ruoka integration relies on external website selectors which may change over time.
-   **Rate Limits:** Using free-tier Gemini API keys may result in 503 errors during periods of high demand.

## AI Tools Used

- Gemini used for:
  - Brainstorming project tools
  - Developing project structure
  - Code corrections because I suck
