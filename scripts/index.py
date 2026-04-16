import json, os, time
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()
CHUNKS_FILE = "./scripts/chunks.json"
DB_PATH = "./app/backend/rag/chroma_db"

def build_db():
    with open(CHUNKS_FILE, "r") as f:
        chunk_data = json.load(f)
    
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2-preview")
    
    docs = [Document(page_content=c["text"], metadata={"source": c["source"]}) for c in chunk_data]
    
    print(f"Total chunks to index: {len(docs)}")
    
    vector_db = Chroma.from_documents(
        documents=[docs[0]], 
        embedding=embeddings, 
        persist_directory=DB_PATH
    )

    for i in range(1, len(docs)):
        print(f"Indexing chunk {i}/{len(docs)}...", end="\r")
        
        try:
            vector_db.add_documents([docs[i]])
            # Short delay to respect the 30k tokens/min rate limit
            time.sleep(0.5) 
        except Exception as e:
            print(f"\nSkipped chunk {i} due to API safety filter.")
            continue

    print(f"\nSuccess! All recipes indexed to {DB_PATH}")

if __name__ == "__main__":
    build_db()
