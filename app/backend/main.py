import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from app.backend.rag.rag_engine import get_context, stream_rag_response
from app.backend.utils.scraper import fetch_ingredient_prices

load_dotenv()
app = FastAPI(title="POOR Recipe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: list = []
    preferences: dict = {}

class ShopRequest(BaseModel):
    store_id: str
    ingredients: list[str]


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_rag_response(request.message, request.history, request.preferences),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@app.post("/shop/ingredients")
async def shop_ingredients(request: ShopRequest):
    try:
        print(f"Shopping request received for store: {request.store_id}")
        print(f"Items to fetch: {request.ingredients}")
        
        # Dispatch the headless browser
        prices = await fetch_ingredient_prices(request.store_id, request.ingredients)
        
        return {"status": "success", "data": prices}
    except Exception as e:
        print(f"Scraper crashed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prices from the store.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
