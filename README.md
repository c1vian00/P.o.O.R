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
│   ├── backend/          # FastAPI server and RAG logic
│   │   ├── main.py       # API routes and SSE configuration
│   │   ├── rag/
│   │   │   └── rag_engine.py # Metadata-filtered retrieval & Gemini integration
│   │   └── utils/         # Global utilities
│   └── frontend/         # React Application
│       ├── src/          # Source code
│       │   ├── assets/   # Images, SVGs, and global styles
│       │   ├── components/
│       │   │   └── ui/   # Atomic UI components
│       │   │       ├── ChatBox.jsx
│       │   │       ├── DashboardColumn.jsx
│       │   │       ├── FilterSidebar.jsx
│       │   │       ├── Header.jsx
│       │   │       ├── MoodButton.jsx
│       │   │       ├── RecipeDisplay.jsx
│       │   │       └── ShoppingColumn.jsx
│       │   ├── constants/ # Global config files
│       │   │   ├── ouluStores.js   # K-Market data
│       │   │   └── preferences.js  # Filter option arrays
│       │   ├── App.jsx   # Core logic and State Management
│       │   └── main.jsx  # React entry point
│       └── index.html    # HTML template
├── data/
│   ├── chroma_db/        # Persistent Vector Store
│   ├── chunks/           # Processed JSON segments with metadata
│   └── extracted_text/   # Structured JSON data from EPUBs
├── scripts/
│   ├── oldETLlogic/      # Archive of old RAG scripts
│   ├── extract.py        # HTML-aware parser
│   ├── chunk.py          # Metadata-tagging
│   └── index.py          # Metadata-compatible ChromaDB ingestion
├── .env                  # API Keys (Google Gemini)
└── requirements.txt      # Python dependencies
```

## Setup and Running Instructions

1.   **Install Backend Dependencies:**  
        `pip install -r requirements.txt`

2.   **Install Frontend Dependencies:**  
        `cd app/frontend` -> `npm install`

3.  **Configure Environment Variables:**  
     Create a `.env` file in the root folder of the project and add the Google API key:
    `GOOGLE_API_KEY=actual_api_key_here`

4.   **Initialize the Data Pipeline:**  
        Place the .epub files in the `data/` folder, then run in the following order:
    - `python scripts/extract.py`
    -   `python scripts/chunk.py`
    -   `python scripts/index.py`

5.   **Start the Application:**
    - **Backend:** `python -m app.backend.main` (runs on port 8000)
    - **Frontend:** `cd app/frontend && npm start`

## Technical Choices

### 1. Context-Aware ETL Pipeline & Metadata Classification (`scripts/`)

During testing of the code it was realised that standard RAG pipelines using blind recursive character splitting wasn't effective with the recipe format, as every cook book had several of passages of "author notes" and not delivering any valuable search results for the LLM to work with. It would also cut the recipes from headlines, ingredients and instruction, splitting up the recipes, which makes it harder for the Vector search to find context. The metadata tags allow the FastAPI backend to use pre-filtered queries (searching only within `recipe` chunks), preventing the LLM from hallucinating meals out of an author's introductory biography.

- `extract.py` parses EPUB HTML tags (like `<h1>`, `<h2>`) and outputs structured JSON dictionaries instead of flat text files in order to presere chapter boundaries.
- `chunk.py` has a logic gate (`classify_content`) to sort text chunks into categories. It scans each block for keyword density ("ingredients", "prep time" etc.) and tags the chunk as either `type: "recipe"` or `type: "informational"`.
- `index.py` was updated to inject these tags directly into ChromaDB as searchable metadata. The old "vanilla" ETL logic was archived in `scripts/oldETLlogic/`.

### 2. Decoupled Utility Architecture (`app/backend/utils/`)

A centralized `utils/` directory was created to house `ai_utils.py` to follow the clean code principles. The AI logic was moved to a global utility folder to make the code modular and prevent circular imports, allowing future features to use the same AI helpers if needed.

### 3. Multi-Model Resilience Strategy (`ai_utils.py`)

A fallback mechanism was developed that cycles through a list of Gemini models (`3.1 Flash Lite`, `3 Flash`, `2.5 Flash`) if the primary one is busy as I was tired of switching when using free-tier API keys frequently and hit "503 Service Unavailable" errosr during peak times. This extra small script prevents the app from crashing by automatically finding a healthy model to take over the request.

### 4. Stream-Peeking Generator (`ai_utils.py`)

A "peek" function was implemented that checks the first chunk of a stream before committing to it. Because the AI SDK streams data lazily, crashes often happen _after_ the stream starts. By forcing a check on the first bit of data inside a `try/except` block, failures can be caught early, triggering the fallback before the user's connection is broken.

### 5. Semantic Preference Injection & Query Purifying (`rag_engine.py`)

User filters (Time, Mood, Serving Size, Meal Type) are dynamically appended to the vector database search query, while UI placeholders (like "No specific preference") are explicitly stripped out before searching. Because vector databases perform semantic matching. If placeholders aren't stripped, the database might return an author's biography just because it contains the word "preference." Purifying the query ensures ChromaDB only fetches highly relevant recipe chunks.

### 6. Strict Allergy Guardrails (`rag_engine.py`)

A hardcoded "CRITICAL SAFETY" rule was added to the LLM's system prompt, strictly forbidding the inclusion of user-defined allergens. Because LLMs are generally bad at "negative constraints" (Example: It hallucinated soy milk into a recipe when asked to avoid soy). This explicit rule forces the AI to actively substitute or reject dangerous recipes retrieved from the vector database.

### 7. Tag-Based Stream Interception & JSON Vault (`App.jsx` & `rag_engine.py`)

The LLM was prompt-engineered to output a secret `[RECIPE_FOUND]` tag followed by strict JSON. The React frontend was built to intercept this tag mid-stream, hide the JSON from the user's chat UI and buffer it into a hidden string for parsing. This was done because the React components require highly structured JavaScript objects, not markdown text and this is what came back. This "track switching" approach allows the AI to be conversational in the chat, but strictly programmatic when delivering the final data payload for the recipe.

### 8. Component-Based UI Architecture (`app/frontend/src/components/ui/`)

The frontend was decomposed into atomic, reusable components. Shared data points (like Oulu store locations) were moved into a dedicated `constants/` directory. This was done after making the frontend initially to prevent `App.jsx` from becoming a "mega-file" and hard to read.

### 9. Dynamic UI State Stamping (`RecipeDisplay.jsx`)

Active user filters are stamped directly onto the JSON recipe object and rendered as visual UI pills when shown in a recipe, utilizing dynamic inline styling to clearly cross out excluded allergens (e.g., a thick red strikethrough).
This was eye candy to provide the user with a quick visual "receipt" confirming the AI listened to their constraints. It visually bridges the gap between the sidebar filters and the final generated output.

### 10. Decoupled Web-Scraping Microservice (`scraper.py` & `main.py`)

During testing, it became obvious that jamming a heavy, 15-second Playwright browser automation into the middle of a high-speed SSE AI stream would cause a massive traffic jam and freeze the user interface. Furthermore, the K-Market search engine panicked when fed full English ingredient descriptions (like "0.7 lbs boneless, skinless chicken thighs"), returning completely irrelevant items or timing out. 

- A dedicated API endpoint (`/shop/ingredients`) was created to completely isolate the slow web-scraping task from the fast text generation stream.
- The LLM prompt was updated to act as a dual-translator. It outputs an array of ingredient objects containing both a hidden `search_term` in Finnish (e.g., "kana") for the scraper to use and the full English description for the UI.
- A headless Playwright script utilizes these clean keywords to navigate K-Ruoka, select the user's specific local store and fetch real-time prices in the background.
- Regular Expressions (Regex) are applied to the scraped data before it hits the frontend, aggressively stripping away localized formatting fluff (like "Hinta" and "kappale") to deliver a clean, minimalist Euro amount to the user's shopping list.

## AI Tools Used

- Gemini used for:
  - Brainstorming project tools
  - Developing project structure
  - Code corrections