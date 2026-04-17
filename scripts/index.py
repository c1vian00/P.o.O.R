import os
import chromadb
from chromadb.utils import embedding_functions

ROOT_DIR = os.getcwd()
CHUNKS_DIR = os.path.join(ROOT_DIR, 'data', 'chunks')
DB_PATH = os.path.join(ROOT_DIR, 'data', 'chroma_db')

def main():
    client = chromadb.PersistentClient(path=DB_PATH)
    embedding_func = embedding_functions.DefaultEmbeddingFunction()

    collection = client.get_or_create_collection(
        name="cookbook_recipes",
        embedding_function=embedding_func
    )

    if not os.path.exists(CHUNKS_DIR):
        print(f"Error: {CHUNKS_DIR} not found.")
        return

    all_documents = []
    all_metadatas = []
    all_ids = []

    print("Preparing chunks for embedding...")
    for filename in os.listdir(CHUNKS_DIR):
        if filename.endswith('_chunks.txt'):
            
            file_path = os.path.join(CHUNKS_DIR, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            raw_chunks = content.split('--- CHUNK')
            
            for i, chunk in enumerate(raw_chunks):
                if not chunk.strip(): continue 
                
                clean_content = chunk.split('---', 1)[-1].strip()
                if clean_content:
                    all_documents.append(clean_content)
                    all_metadatas.append({"source": filename.replace('_chunks.txt', '.epub')})
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

        print(f"\nFinished! Total items in database: {collection.count()}")
    else:
        print("No documents found to index.")


if __name__ == "__main__":
    main()