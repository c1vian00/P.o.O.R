import os
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter

EXTRACTED_DIR = os.path.join(os.getcwd(), 'data', 'extracted_text')
CHUNKS_DIR = os.path.join(os.getcwd(), 'data', 'chunks')
os.makedirs(CHUNKS_DIR, exist_ok=True)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=150,
    separators=["\n\n", "\n", " ", ""]
)

def classify_content(text, title):
    """A logic gate to determine if a block of text is a recipe or just fluff."""
    text_lower = text.lower()    
    recipe_markers = ["ingredients", "instructions", "directions", "prep time", "cook time", "servings", "yield"]
    marker_count = sum(1 for marker in recipe_markers if marker in text_lower)
    
    if marker_count >= 2:
        return "recipe"
    return "informational"

def main():
    if not os.path.exists(EXTRACTED_DIR):
        print(f"Source directory {EXTRACTED_DIR} not found.")
        return

    for filename in os.listdir(EXTRACTED_DIR):
        if filename.endswith('.json'):
            file_path = os.path.join(EXTRACTED_DIR, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                structured_data = json.load(f)
            
            processed_chunks = []
            
            for section in structured_data:
                content = section.get("content", "")
                title = section.get("section_title", "Unknown")
                
                if not content:
                    continue
                    
                chunk_type = classify_content(content, title)
                text_splits = text_splitter.split_text(content)
                
                for i, split_text in enumerate(text_splits):
                    processed_chunks.append({
                        "section_title": title,
                        "chunk_type": chunk_type,
                        "content": split_text,
                        "chunk_index": i
                    })
            
            output_filename = filename.replace('.json', '_chunks.json')
            output_path = os.path.join(CHUNKS_DIR, output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(processed_chunks, f, indent=4, ensure_ascii=False)
                
            print(f"Processed {filename}: Created {len(processed_chunks)} tagged chunks.")

if __name__ == "__main__":
    main()