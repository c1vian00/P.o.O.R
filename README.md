# POOR - Preparation of Oulu Recipes

This repository contains the full source code for POOR (Preparation of Oulu Recipes). The project implements a complete RAG (Retrieval-Augmented Generation) pipeline that transforms EPUB cookbooks into a searchable semantic database, integrated with a React frontend.

## Project Architecture

The application follows a full-stack AI architecture:

- **Frontend:** React-based user interface for recipe queries and result visualization.
- **Backend:** FastAPI (Python) server orchestrating LLM calls, vector searches and K-Ruoka scraping.
- **Database:** ChromaDB persistent vector store for semantic recipe retrieval.
- **Data Pipeline:** Modular ETL (Extract, Transform, Load) for processing cookbook data.

Raw EPUBs -> extract.py -> chunk.py -> index.py -> ChromaDB -> FastAPI -> React UI

## Project Structure
```
POOR/  
├── app/  
│   ├── backend/          # FastAPI server and RAG logic  
│   └── frontend/         # React application  
├── data/  
│   ├── chroma_db/        # Persistent Vector Store (Ignored by Git)  
│   ├── chunks/           # Processed text segments  
│   └── extracted_text/   # Cleaned text from EPUBs  
├── scripts/  
│   ├── extract.py        # EPUB to Text parser  
│   ├── chunk.py          # Semantic text splitter  
│   └── index.py          # ChromaDB ingestion  
├── .env                  # API Keys and Config  
└── requirements.txt      # Python dependencies  
```

## Setup and Running Instructions

1. **Install Backend Dependencies:**  
   `pip install -r requirements.txt`

2. **Install Frontend Dependencies:**  
   `cd app/frontend` -> `npm install`

3. **Initialize the Data Pipeline:**  
   Place the .epub files in the data/ folder, then run:  
   - `python scripts/extract.py`
   - `python scripts/chunk.py`
   - `python scripts/index.py`

4. **Start the Application:**  
   - Backend: uvicorn app.backend.main:app --reload  
   - Frontend: cd app/frontend && npm start

## Technical Choices

### Data Pipeline (scripts/)

1. **extract.py**
   - **Function:** Scans /data for .epub files, parses XHTML, and saves cleaned .txt files to data/extracted_text/.
   - **Technology:** EbookLib and BeautifulSoup4.
   - **Rationale:** EPUBs are zipped HTML. Stripping tags ensures the vector database contains only clean recipe text.

2. **chunk.py**
   - **Function:** Breaks large text files into 1000-character segments with 100-character overlap.
   - **Technology:** RecursiveCharacterTextSplitter.
   - **Rationale:** Segments data to fit LLM context windows while preserving recipe integrity.

3. **index.py**
   - **Function:** Converts text chunks into vectors and stores them in a persistent ChromaDB collection.
   - **Technology:** ChromaDB with `all-MiniLM-L6-v2` embedding model.
   - **Rationale:** Enables semantic search and persistent local storage.

## Development and Debugging
The chunk.py script saves are maintained as a dedicated utility to allow developers to inspect the segmentation logic. You can view the human-readable .txt chunks in data/chunks/ to verify that recipe instructions and ingredient lists are being split logically before they are committed to the vector database.

## Known Limitations

- **Table Data:** Complex HTML tables in cookbooks may be flattened into single strings during extraction.
- **Scraper Stability:** The K-Ruoka integration relies on external website selectors which may change over time. But currently there are no API's for any of the major grocery stores in Finland.
- **Embedding Model:** The local all-MiniLM model is optimized for speed but may be less nuanced than larger commercial API models.

## AI Tools Used

- Gemini used for:
  - Brainstorming project tools
  - Developing project structure
  - Code corrections because I suck
