import os, json
from langchain_community.document_loaders import UnstructuredEPubLoader

DATA_PATH = "./data"
RAW_DATA_FILE = "./scripts/raw_text.json"

def extract_all():
    all_content = []
    files = [f for f in os.listdir(DATA_PATH) if f.endswith(".epub")]
    for file in files:
        print(f"Extracting: {file}")
        loader = UnstructuredEPubLoader(os.path.join(DATA_PATH, file))
        docs = loader.load()
        for d in docs:
            all_content.append({"text": d.page_content, "source": file})
    
    with open(RAW_DATA_FILE, "w") as f:
        json.dump(all_content, f)
    print(f"Saved the text to {RAW_DATA_FILE}")

if __name__ == "__main__":
    extract_all()
