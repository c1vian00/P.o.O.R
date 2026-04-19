import os
from langchain_text_splitters import RecursiveCharacterTextSplitter

EXTRACTED_DIR = os.path.join(os.getcwd(), 'data', 'extracted_text')
CHUNKS_DIR = os.path.join(os.getcwd(), 'data', 'chunks')
os.makedirs(CHUNKS_DIR, exist_ok=True)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""]
)

def main():
    for filename in os.listdir(EXTRACTED_DIR):
        if filename.endswith('.txt'):
            file_path = os.path.join(EXTRACTED_DIR, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            chunks = text_splitter.split_text(text)
            
            output_filename = filename.replace('.txt', '_chunks.txt')
            output_path = os.path.join(CHUNKS_DIR, output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                for i, chunk in enumerate(chunks):
                    f.write(f"--- CHUNK {i} ---\n{chunk}\n\n")
            
            print(f"Processed {filename}: Created {len(chunks)} chunks.")

if __name__ == "__main__":
    main()