import os
import json
from dotenv import load_dotenv
load_dotenv()
import chromadb
from google import genai
from chromadb.utils import embedding_functions
from app.backend.utils.ai_utils import get_model_stream

DB_PATH = "./data/chroma_db"
client_db = chromadb.PersistentClient(path=DB_PATH)
embedding_func = embedding_functions.DefaultEmbeddingFunction()
collection = client_db.get_collection(name="cookbook_recipes", embedding_function=embedding_func)

client_ai = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def get_context(user_query, search_type="recipe"):
    """
    Now filters ChromaDB results by metadata tags.
    Defaulting to 'recipe' blocks all the informational fluff.
    """
    results = collection.query(
        query_texts=[user_query], 
        n_results=3,
        where={"type": search_type}
    )
    documents = [doc for sublist in results.get('documents', [[]]) for doc in sublist]
    return "\n\n".join(documents)

async def stream_rag_response(user_query, history=[], preferences={}):
    recipe_triggered = False
    print(f"\n--- NEW REQUEST ---")
    print(f"1. User Query Received: {user_query}")

    search_parts = [user_query]
    
    if preferences.get('meal_type') and preferences.get('meal_type') != "No specific preference":
        search_parts.append(preferences['meal_type'])
        
    if preferences.get('mood') and preferences.get('mood') != "No specific mood":
        search_parts.append(preferences['mood'])
        
    if preferences.get('time'):
            search_parts.append(f"{preferences['time']}")
            
    if preferences.get('servings'):
        search_parts.append(preferences['servings'])
        
    search_query = " ".join(search_parts)
    print(f"-> Cleaned Search Query: {search_query}")
    
    context = get_context(search_query, search_type="recipe")

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
    You are the 'POOR Cook Recipe Assistant'.
    
    USER PREFERENCES (Already known, do not ask about these):
    - Time: {preferences.get('time', 'Not specified')}
    - Mood: {preferences.get('mood')}
    - Serving Size: {preferences.get('servings')} people
    - Meal Type: {preferences.get('meal_type')}
    - Allergies: {", ".join(preferences.get('allergies', [])) if preferences.get('allergies') else "None"}

    RULES:
    1. IF the user's query is vague (e.g., "I'm hungry"): Ask ONLY 1 follow-up question to find out their desired main ingredient or flavor. Do NOT give a recipe yet.
    2. IF the user has provided a main ingredient OR a flavor profile, be decisive. First, write a short, friendly sentence confirming your choice (e.g., "I found a great spicy noodle dish for you!"). THEN, immediately output the exact tag [RECIPE_FOUND] followed by the meal in STRICT JSON format.
    3. Be friendly and conversational in your follow-up questions, but keep them short and to the point.
    4. The JSON must have exactly these keys: "title" (string), "time" (string), "servings" (string), "ingredients" (list of OBJECTS, where each object has "name" [the full string like '1/2 cup diced onions'] and "search_term" [just the core ingredient name translated to Finnish, e.g., 'sipuli']), "instructions" (list of strings).
    5. DO NOT wrap the JSON in markdown blocks (do not use ```json). Output ONLY the raw JSON object after the tag. Say nothing else after the JSON.
    6. Do not repeat questions the user has already answered in the CONVERSATION HISTORY.
    7. CRITICAL SAFETY: You MUST NOT suggest a recipe that contains any ingredients listed in the user's Allergies. If a retrieved recipe contains an allergen, you must either heavily modify the recipe to remove/substitute it, or pick a different recipe entirely.
    8. BOUNDARY ENFORCEMENT: You are strictly a food, cooking, and recipe assistant. If the user asks about anything unrelated to food, recipes, or grocery shopping (e.g., coding, history, relationship advice), you MUST politely refuse to answer, remind them that you are just a "POOR Cook" and only know about food and recipes, and steer the conversation back to what they want to eat.

    CONVERSATION HISTORY:
    {history_text}

    CONTEXT FROM COOKBOOKS:
    {context}

    NEW USER QUERY: {user_query}
    """

    response_stream, chosen_model = get_model_stream(client_ai, prompt)

    if not response_stream:
        print("ERROR: All models failed.")
        yield f"data: {json.dumps({'type': 'error', 'content': 'AI service unavailable'})}\n\n"
        return

    print(f"3. SUCCESS: Using model {chosen_model}")
    
    print(f"4. Streaming response back to frontend:")

    full_response = ""
    for chunk in response_stream:
        if chunk.text:
            full_response += chunk.text

            if "[RECIPE_FOUND]" in full_response and not recipe_triggered:
                print("\n3. SUCCESS: [RECIPE_FOUND] tag detected!")
                print("   -> Triggering Modal in Frontend")
                recipe_triggered = True
            
            print(".", end="", flush=True)
            
            event = json.dumps({"type": "text", "content": chunk.text})
            yield f"data: {event}\n\n"

    
    print(f"\n5. Stream Complete. Full length: {len(full_response)} characters.")
    
    done_event = json.dumps({"type": "done"})
    yield f"data: {done_event}\n\n"