import json
from langchain_text_splitters import RecursiveCharacterTextSplitter

RAW_DATA_FILE = "./scripts/raw_text.json"
CHUNKS_FILE = "./scripts/chunks.json"

def create_chunks():
    with open(RAW_DATA_FILE, "r") as f:
        data = json.load(f)
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=200)
    all_chunks = []
    
    print("Splitting and trimming chunks...")

    for item in data:
        chunks = splitter.split_text(item["text"]) 
        for c in chunks:
            if c.strip():
                # Keeping the source link in the metadata for each chunk to know what book it came from
                all_chunks.append({
                    "text": c.strip(), 
                    "source": item["source"]
                })
            
    with open(CHUNKS_FILE, "w") as f:
        json.dump(all_chunks, f)
    print(f"Created {len(all_chunks)} chunks saved to {CHUNKS_FILE}")

if __name__ == "__main__":
    create_chunks()
