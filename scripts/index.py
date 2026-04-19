import os
import json
import chromadb
from chromadb.utils import embedding_functions

ROOT_DIR = os.getcwd()
CHUNKS_DIR = os.path.join(ROOT_DIR, 'data', 'chunks')
DB_PATH = os.path.join(ROOT_DIR, 'data', 'chroma_db')

def main():
    for path in [CHUNKS_DIR, DB_PATH]:
        dir_to_make = path if path == CHUNKS_DIR else os.path.dirname(path)
        if not os.path.exists(dir_to_make):
            os.makedirs(dir_to_make, exist_ok=True)
            print(f"Created missing directory: {dir_to_make}")

    client = chromadb.PersistentClient(path=DB_PATH)
    embedding_func = embedding_functions.DefaultEmbeddingFunction()

    # Delete old collection if it exists to start fresh each time
    try:
        client.delete_collection(name="cookbook_recipes")
        print("Deleted old database collection.")
    except ValueError:
        pass

    collection = client.create_collection(
        name="cookbook_recipes",
        embedding_function=embedding_func
    )

    all_documents = []
    all_metadatas = []
    all_ids = []

    print("Preparing JSON chunks for embedding...")
    for filename in os.listdir(CHUNKS_DIR):
        if filename.endswith('_chunks.json'):
            file_path = os.path.join(CHUNKS_DIR, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                chunks_data = json.load(f)
            
            for i, chunk_dict in enumerate(chunks_data):
                content = chunk_dict.get("content", "").strip()
                if not content: continue
                
                all_documents.append(content)
                all_metadatas.append({
                    "source": filename.replace('_chunks.json', '.epub'),
                    "type": chunk_dict.get("chunk_type", "informational")
                })
                all_ids.append(f"{filename}_{i}")

    if all_documents:
        batch_size = 2000 
        total_chunks = len(all_documents)
        print(f"\nStarting embedding for {total_chunks} total chunks...")

        for i in range(0, total_chunks, batch_size):
            end = min(i + batch_size, total_chunks)
            print(f"Indexing chunks {i} to {end}...")
            
            collection.add(
                documents=all_documents[i:end],
                metadatas=all_metadatas[i:end],
                ids=all_ids[i:end]
            )
            print(f"Finished indexing chunks {i} to {end}")

        print(f"\nFinished! Total items in smart database: {collection.count()}")
    else:
        print("No documents found to index.")


if __name__ == "__main__":
    main()