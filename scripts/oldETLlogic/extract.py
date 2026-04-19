import os
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

BASE_DATA_DIR = os.path.join(os.getcwd(), 'data')
INPUT_DIR = os.path.join(BASE_DATA_DIR, 'raw_data') 
OUTPUT_DIR = os.path.join(BASE_DATA_DIR, 'extracted_text')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_text_from_epub(epub_path):
    """Extracts clean text from a single EPUB file."""
    try:
        book = epub.read_epub(epub_path)
        full_text = []
        
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                text = soup.get_text(separator=' ', strip=True)
                if text:
                    full_text.append(text)
        
        return "\n\n".join(full_text)
    except Exception as e:
        print(f"Error processing {epub_path}: {e}")
        return None

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Source directory {INPUT_DIR} not found.")
        return

    for filename in os.listdir(INPUT_DIR):
        if filename.endswith('.epub'):
            file_path = os.path.join(INPUT_DIR, filename)
            
            output_filename = os.path.splitext(filename)[0] + ".txt"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            
            print(f"Extracting: {filename}...")
            content = extract_text_from_epub(file_path)
            
            if content:
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Saved to: {output_path}")

if __name__ == "__main__":
    main()
