import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import re

# Import the Google Generative AI library
import google.generativeai as genai
# import google.generativeai.types as genai_types # Not strictly needed for this simple case

# ----------------------
# Paths and global config
# ----------------------
HERE = os.path.dirname(__file__)
DATA_DIR = os.path.join(HERE, 'data2')
FAISS_DIR = os.path.join(HERE, 'faiss_index2')
CHUNKS_PATH = os.path.join(FAISS_DIR, 'chunks.json')
FAISS_INDEX_PATH = os.path.join(FAISS_DIR, 'index.faiss')
EMBED_MODEL = 'intfloat/e5-large-v2'  # must match ingestion

# --- Gemini API Configuration ---
# WARNING: Storing API keys directly in code is generally discouraged for production environments
# due to security risks (e.g., accidental commits to public repositories).
# Environment variables or a secure secret management system are preferred.
# For development or controlled environments, this approach can be used.
GEMINI_API_KEYS = [
    "AIzaSyCx0yYX-Y5Zwuc5o3l7daImC-yMjPwCInY",
    "AIzaSyCJivcRNPzocu-U_-5ua78yHOdAt7A-HJA",
    "AIzaSyCiXoq4c0uDmvNRhaV6Gxs3I89AtDcaV80", # Add as many keys as you have
]

if not GEMINI_API_KEYS or any(key == "YOUR_GEMINI_API_KEY_1" for key in GEMINI_API_KEYS):
    raise ValueError("GEMINI_API_KEYS are not set or still contain placeholders. Please set your actual API keys.")

GEMINI_LLM_MODEL = 'gemini-1.5-flash' # You can choose a different Gemini model if preferred, e.g., 'gemini-1.5-pro'

# Global variables to manage the current API key and model instance
current_key_index = 0
GEMINI_GENERATIVE_MODEL = None

def _configure_gemini_client():
    """Configures the genai library with the current API key and initializes the model."""
    global GEMINI_GENERATIVE_MODEL, current_key_index
    if not GEMINI_API_KEYS:
        raise ValueError("No Gemini API keys available in the pool.")

    key = GEMINI_API_KEYS[current_key_index]
    genai.configure(api_key=key)
    GEMINI_GENERATIVE_MODEL = genai.GenerativeModel(GEMINI_LLM_MODEL)
    print(f"Configured Gemini with key index: {current_key_index} (model: {GEMINI_LLM_MODEL})")

def _rotate_api_key():
    """Rotates to the next API key in the pool."""
    global current_key_index
    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
    print(f"Rotating to next Gemini API key. New index: {current_key_index}")
    _configure_gemini_client() # Reconfigure with the new key

KEYWORD_BOOST = 0.2  # default boost multiplier

# ----------------------
# Load FAISS index, chunks, and embedding model ONCE
# ----------------------
if not os.path.exists(FAISS_INDEX_PATH):
    raise FileNotFoundError(f"FAISS index not found: {FAISS_INDEX_PATH}")
if not os.path.exists(CHUNKS_PATH):
    raise FileNotFoundError(f"Chunks metadata not found: {CHUNKS_PATH}")

print("Loading FAISS index and chunks...")
INDEX = faiss.read_index(FAISS_INDEX_PATH)
with open(CHUNKS_PATH, 'r', encoding='utf-8') as f:
    CHUNKS = json.load(f)

print(f"Loading embedding model: {EMBED_MODEL}")
MODEL = SentenceTransformer(EMBED_MODEL, device='cpu')
INDEX_D = INDEX.d
print(f"Index dimension: {INDEX_D}")

# Initial configuration of the Gemini client
_configure_gemini_client()

# ----------------------
# Retrieval
# ----------------------
def retrieve(query, k=7, keyword_boost=KEYWORD_BOOST):
    """
    Hybrid retrieval: semantic + keyword boosting for named entities.
    Returns top-k chunks with combined scores.
    """
    # Generate query embedding
    q_emb = MODEL.encode([query], convert_to_numpy=True).astype('float32')
    if len(q_emb.shape) == 1:
        q_emb = np.expand_dims(q_emb, axis=0)

    # Validate dimension
    if q_emb.shape[1] != INDEX_D:
        raise ValueError(f"Embedding dimension mismatch! Query: {q_emb.shape[1]}, Index: {INDEX_D}")

    # Normalize embedding
    q_emb /= (np.linalg.norm(q_emb, axis=1, keepdims=True) + 1e-12)

    # Semantic search
    D, I = INDEX.search(q_emb, max(50, k))

    results = []
    query_words = set(re.findall(r'\w+', query.lower()))
    for idx, score in zip(I[0], D[0]):
        if idx == -1 or idx >= len(CHUNKS):
            continue
        chunk = CHUNKS[idx]
        chunk_text = chunk.get('text', '').lower()
        # Keyword boost
        keyword_matches = query_words.intersection(set(re.findall(r'\w+', chunk_text)))
        boost = keyword_boost * len(keyword_matches)
        combined_score = score + boost
        results.append({
            'score': combined_score,
            'uid': chunk.get('uid'),
            'source': chunk.get('source'),
            'page': chunk.get('page'),
            'text': chunk.get('text', ''),
            'semantic_score': score,
            'keyword_boost': boost,
            'keyword_matches': list(keyword_matches)
        })

    # Rerank
    results.sort(key=lambda x: x['score'], reverse=True)
    top_chunks = results[:k]

    return [
        {
            'score': c['score'],
            'uid': c['uid'],
            'source': c['source'],
            'page': c['page'],
            'text': c['text']
        }
        for c in top_chunks
    ]

# ----------------------
# Build context from chunks
# ----------------------
def build_context(chunks):
    context = ''
    for c in chunks:
        context += f"According to \"{c.get('source', 'Unknown')}\" (Page {c.get('page', '?')}):\n"
        context += f"{c.get('text', '')}\n\n"
    return context

# ----------------------
# Query LLM (Modified for Gemini API)
# ----------------------
def query_llm(context, user_query):
    prompt_parts = [
        f"You are an exceptionally accurate and helpful Government Helpdesk Assistant.",
        f"",
        f"**Instructions:**",
        f"1.  **General Queries**: If the user's question is a general greeting or conversational statement, respond naturally.",
        f"2.  **Specific Queries**: If the question asks for specific government info, use **only** the provided `Context`.",
        f"    - If the answer is found, provide it.",
        f"    - If not, respond: \"I apologize, but the information needed to answer this specific question is not available in the provided government documents.\"",
        f"",
        f"Context:",
        f"{context}",
        f"",
        f"Question:",
        f"{user_query}",
        f"",
        f"Answer:"
    ]

    try:
        # Use the global GEMINI_GENERATIVE_MODEL
        response = GEMINI_GENERATIVE_MODEL.generate_content(prompt_parts)
        return response.text.strip()
    except Exception as e:
        return f"Error querying Gemini LLM: {e}"

# ----------------------
# Debug helper
# ----------------------
def debug_retrieval(query, k=7, preview_chars=300):
    retrieved = retrieve(query, k=k)
    print('\n--- Retrieval Debug ---')
    print('Query:', query)
    for i, r in enumerate(retrieved, start=1):
        print(f"\n[{i}] score={r['score']:.4f} uid={r['uid']} source={r['source']} page={r['page']}")
        text_preview = r['text'][:preview_chars].replace('\n', ' ').strip()
        print(text_preview + ('...' if len(r['text']) > preview_chars else ''))
    print('--- End of Retrieval ---\n')
    return retrieved

# Example usage (you would typically call these in a main function or API endpoint)
# if __name__ == "__main__":
#     test_query = "What are the requirements for a business license?"
#     retrieved_chunks = retrieve(test_query, k=5)
#     context = build_context(retrieved_chunks)
#     print("\n--- LLM Response ---")
#     llm_response = query_llm(context, test_query)
#     print(llm_response)
#     print("--- End LLM Response ---")