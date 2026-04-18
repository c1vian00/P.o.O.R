import requests
import json

url = "http://localhost:8000/chat/stream"

data = {
    "message": "I'm looking for something with salmon",
    "history": [],
    "preferences": {
        "time": "15",
        "mood": "light",
        "servings": "1",
        "meal_type": "dinner",
        "allergies": ["nuts"]
    }
}

response = requests.post(url, json=data, stream=True)

print("--- STREAM START ---")
for line in response.iter_lines():
    if line:
        decoded_line = line.decode('utf-8')
        print(decoded_line)
print("--- STREAM END ---")
