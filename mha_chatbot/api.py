from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from chat2 import retrieve, build_context, query_llm, CHUNKS_PATH as chunks_path
import numpy as np

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stats")
def get_stats():
    # Show stats about the data and workflow
    if os.path.exists(chunks_path):
        with open(chunks_path, 'r', encoding='utf-8') as f:
            chunks = json.load(f)
        num_chunks = len(chunks)
        sources = set(c.get('source') for c in chunks)
        return {
            "documents": len(sources),
            "chunks": num_chunks,
            "sources": len(sources)
        }
    return {"documents": 0, "chunks": 0, "sources": 0}

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_query = data.get("query", "")
    k = int(data.get("k",7))
    keyword_boost = float(data.get("keyword_boost", 0.2))
    retrieved_chunks = retrieve(user_query, k=k, keyword_boost=keyword_boost)
    context = build_context(retrieved_chunks)
    answer = query_llm(context, user_query)

    def convert(obj):
        if isinstance(obj, np.generic):
            return obj.item()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert(v) for v in obj]
        return obj
    return JSONResponse({
        "answer": answer,
        "chunks": convert(retrieved_chunks),
        "context": context
    })

@app.get("/api/chunks")
def get_chunks(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=500)):
    # Return paginated chunks metadata (for visualization)
    if os.path.exists(chunks_path):
        with open(chunks_path, 'r', encoding='utf-8') as f:
            chunks = json.load(f)
        return chunks[offset:offset+limit]
    return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
