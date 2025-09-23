import os
import json
import pdfplumber
import pytesseract
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
import faiss
import numpy as np
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
import sys

# --- Tesseract OCR Configuration ---
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- Directory Paths ---
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data2')
METADATA_PATH = os.path.join(os.path.dirname(__file__), 'metadata2.json')
FAISS_DIR = os.path.join(os.path.dirname(__file__), 'faiss_index2')

# --- Global Settings for Chunking and Embedding ---
CHUNK_SIZE = 512    # target tokens per chunk
CHUNK_OVERLAP = 75  # token overlap between chunks
EMBED_MODEL = 'intfloat/e5-large-v2'  # ~4096 token max sequence
  # full HF model path
OCR_LANGS = 'eng+hin'  # OCR languages

# --- Global tokenizer (use same as embedding model) ---
try:
    emb_tokenizer = AutoTokenizer.from_pretrained(EMBED_MODEL, use_fast=True)
    emb_tokenizer.model_max_length = 4096  # prevent the 512-token warning
    
except Exception as e:
    print(f"Error loading tokenizer for '{EMBED_MODEL}': {e}", file=sys.stderr)
    sys.exit(1)

def chunk_text(text, tokenizer, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks using embedding model's tokenizer."""
    token_ids = tokenizer.encode(text, add_special_tokens=False)
    chunks = []
    stride = max(1, chunk_size - overlap)
    for start in range(0, len(token_ids), stride):
        chunk_ids = token_ids[start:start + chunk_size]
        chunks.append(tokenizer.decode(chunk_ids))
        if start + chunk_size >= len(token_ids):
            break
    return chunks

def load_metadata():
    if not os.path.exists(METADATA_PATH):
        print(f"Error: Metadata file not found at '{METADATA_PATH}'", file=sys.stderr)
        sys.exit(1)
    with open(METADATA_PATH, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    return metadata

def process_pdf_for_worker(task_data):
    """OCR a PDF and return text chunks with metadata."""
    pdf_path, doc_meta = task_data
    chunks_with_meta = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                pil_img = page.to_image(resolution=300).original
                text = pytesseract.image_to_string(pil_img, lang=OCR_LANGS)
                if not text.strip():
                    continue
                text_chunks = chunk_text(text, emb_tokenizer, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP)
                for idx, chunk in enumerate(text_chunks, start=1):
                    chunks_with_meta.append({
                        'source': doc_meta['filename'],
                        'title': doc_meta['title'],
                        'date': doc_meta['date'],
                        'page': page_num,
                        'chunk_index_on_page': idx,
                        'text': chunk
                    })
    except Exception as e:
        print(f"Error processing PDF '{os.path.basename(pdf_path)}' in worker process: {e}", file=sys.stderr)
        return []
    return chunks_with_meta

def normalize_embeddings(emb):
    norms = np.linalg.norm(emb, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-12)
    return emb / norms

# --- MAIN EXECUTION FUNCTION ---
def main():
    # Ensure FAISS directory exists
    try:
        os.makedirs(FAISS_DIR, exist_ok=True)
    except OSError as e:
        print(f"Error creating FAISS directory '{FAISS_DIR}': {e}", file=sys.stderr)
        sys.exit(1)

    metadata = load_metadata()

    tasks_for_pool = []
    for doc_meta in metadata:
        pdf_path = os.path.join(DATA_DIR, doc_meta['filename'])
        if not os.path.exists(pdf_path):
            print(f"Warning: Missing PDF: {pdf_path}. Skipping.", file=sys.stderr)
            continue
        tasks_for_pool.append((pdf_path, doc_meta))

    if not tasks_for_pool:
        print("No valid PDFs found. Exiting.", file=sys.stderr)
        sys.exit(0)

    num_processes = cpu_count()
    print(f"Starting parallel PDF processing with {num_processes} processes...")

    all_chunks_raw = []
    try:
        with Pool(processes=num_processes) as pool:
            for result_chunks in tqdm(
                pool.imap_unordered(process_pdf_for_worker, tasks_for_pool),
                total=len(tasks_for_pool),
                desc='Processing documents'
            ):
                all_chunks_raw.extend(result_chunks)
    except Exception as e:
        print(f"An error occurred during parallel PDF processing: {e}", file=sys.stderr)
        sys.exit(1)

    all_chunks = []
    for idx, chunk in enumerate(all_chunks_raw, start=1):
        chunk['uid'] = idx
        all_chunks.append(chunk)

    if not all_chunks:
        print("No chunks were extracted from any document. Exiting.", file=sys.stderr)
        sys.exit(0)

    print(f"Total chunks extracted: {len(all_chunks)}")

    # --- Load embedding model ---
    print(f"\nAttempting to load SentenceTransformer model: {EMBED_MODEL}")
    try:
        model = SentenceTransformer(EMBED_MODEL)
        print("Successfully loaded SentenceTransformer model.")
        try:
            print(f"Max sequence length: {model.get_max_seq_length()}")
        except Exception:
            pass  # ignore optional debug info
    except Exception as e:
        print(f"Error loading SentenceTransformer model '{EMBED_MODEL}': {e}", file=sys.stderr)
        sys.exit(1)

    texts = [c['text'] for c in all_chunks]

    print(f"Generating embeddings for {len(texts)} chunks...")
    try:
        embeddings = model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=True,
            batch_size=32  # adjust based on available memory
        )
        embeddings = normalize_embeddings(np.array(embeddings).astype('float32'))
    except Exception as e:
        print(f"Error during embedding generation: {e}", file=sys.stderr)
        sys.exit(1)

    print("Building FAISS index...")
    try:
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        faiss.write_index(index, os.path.join(FAISS_DIR, 'index.faiss'))
    except Exception as e:
        print(f"Error building or saving FAISS index: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(os.path.join(FAISS_DIR, 'chunks.json'), 'w', encoding='utf-8') as f:
            json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving chunks metadata: {e}", file=sys.stderr)
        sys.exit(1)

    print("Ingestion complete.")

if __name__ == '__main__':
    main()
