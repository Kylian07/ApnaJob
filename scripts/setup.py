import os

try:
    os.system("pip install -r scripts/requirements.txt")
    os.system("python -m spacy download en_core_web_sm")
except Exception as e:
    print("Error installing requirements:", e)