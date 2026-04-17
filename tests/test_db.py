import os
import chromadb
from chromadb.utils import embedding_functions

# Setup paths relative to the project root
ROOT_DIR = os.getcwd()
DB_PATH = os.path.join(ROOT_DIR, 'data', 'chroma_db')

def test_database_integrity():
    # 1. Initialize Client
    client = chromadb.PersistentClient(path=DB_PATH)
    embedding_func = embedding_functions.DefaultEmbeddingFunction()

    # 2. Access Collection
    try:
        collection = client.get_collection(
            name="cookbook_recipes", 
            embedding_function=embedding_func
        )
    except Exception as e:
        print(f"Error: Could not find collection. {e}")
        return

    # 3. Verify Content Count
    count = collection.count()
    print(f"Database connection successful. Total items: {count}")
    
    if count == 0:
        print("Warning: Database contains 0 items.")
        return

    # 4. Perform a Semantic Search Test
    test_query = "How do I make french macarons?" 
    results = collection.query(
        query_texts=[test_query],
        n_results=1
    )

    if results['documents'] and len(results['documents'][0]) > 0:
        source = results['metadatas'][0][0]['source']
        content_snippet = results['documents'][0][0][:100].replace('\n', ' ')
        print(f"Search successful.")
        print(f"Source: {source}")
        print(f"Snippet: {content_snippet}...")
    else:
        print("Error: Search returned no results.")

if __name__ == "__main__":
    test_database_integrity()
