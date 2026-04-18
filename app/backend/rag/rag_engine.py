import os
import json
from dotenv import load_dotenv
load_dotenv()

import chromadb
from google import genai

# Setup ChromaDB
DB_PATH = "./data/chroma_db"
client_db = chromadb.PersistentClient(path=DB_PATH)
collection = client_db.get_collection(name="cookbook_recipes")

client_ai = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def get_context(user_query):
    results = collection.query(query_texts=[user_query], n_results=3)
    documents = [doc for sublist in results.get('documents', [[]]) for doc in sublist]
    return "\n\n".join(documents)


async def stream_rag_response(user_query, history=[]):
    print(f"\n--- NEW REQUEST ---")
    print(f"1. User Query Received: {user_query}")

    context = get_context(user_query)

    print(f"2. Vector DB Retrieval:")
    if context:
        print(f"   Found relevant chunks:\n{context[:200]}...")
    else:
        print(f"   No relevant chunks found in ChromaDB.")

    history_text = ""
    for msg in history:
        role = "User" if msg['role'] == 'user' else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""
    You are the 'POOR Oulu Recipe Assistant'. Your goal is to help the user find the PERFECT recipe from the cookbooks.

    RULES:
    1. DO NOT give the full recipe immediately.
    2. Ask 1-2 follow-up questions to narrow down their preference (e.g., time, spice level, ingredients on hand).
    3. Be friendly and conversational, but also short and to the point.
    4. Once the user has provided 2-3 preferences (like time and dietary needs), pick the best recipe, start with [RECIPE_FOUND], and provide the full details.
    5. Do not repeat questions the user has already answered in the CONVERSATION HISTORY.

    CONVERSATION HISTORY:
    {history_text}

    CONTEXT FROM COOKBOOKS:
    {context}

    NEW USER QUERY: {user_query}
    """
    
    response_stream = client_ai.models.generate_content_stream(
        model="gemini-3.1-flash-lite-preview",
        contents=prompt
    )
    
    print(f"4. Streaming response back to frontend:")

    full_response = ""
    for chunk in response_stream:
        if chunk.text:
            full_response += chunk.text

            if "[RECIPE_FOUND]" in chunk.text:
                print("\n3. SUCCESS: [RECIPE_FOUND] tag detected!")
                print("   -> Triggering Modal in Frontend")
            
            print(".", end="", flush=True)
            
            event = json.dumps({"type": "text", "content": chunk.text})
            yield f"data: {event}\n\n"
    
    print(f"\n5. Stream Complete. Full length: {len(full_response)} characters.")
    
    done_event = json.dumps({"type": "done"})
    yield f"data: {done_event}\n\n"