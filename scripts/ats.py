import os
import re
import docx
import nltk
import spacy
import argparse
import json
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Download NLTK stopwords and load spaCy model
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))
nlp = spacy.load("en_core_web_sm")

sentiment_analyzer = SentimentIntensityAnalyzer()

# --- Helper Functions ---
def read_docx(file_path):
    doc = docx.Document(file_path)
    return ' '.join([para.text for para in doc.paragraphs])

def clean_text(text):
    text = re.sub(r'[^A-Za-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower()

def extract_keywords(text):
    doc = nlp(text)
    return list(set([token.lemma_ for token in doc if token.is_alpha and token.text.lower() not in stop_words]))

def extract_experience(text):
    patterns = [
        r'\b\d+\+?\s+years?\s+of\s+experience\b',
        r'\b\d+\s+years?\s+experience\b',
        r'\bworked\s+for\s+\d+\s+years?\b',
        r'\bover\s+\d+\s+years?\b'
    ]
    for pattern in patterns:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return True
    return False

def get_sentiment_score(text):
    sentiment = sentiment_analyzer.polarity_scores(text)
    compound = sentiment['compound']
    if compound >= 0.5:
        return 5
    elif compound >= 0.2:
        return 3
    elif compound >= 0.05:
        return 1
    elif compound <= -0.3:
        return -2
    else:
        return 0

def score_resume(resume_keywords, required_keywords, preferred_keywords, text):
    required_match = set(resume_keywords).intersection(required_keywords)
    preferred_match = set(resume_keywords).intersection(preferred_keywords)

    req_score = (len(required_match) / len(required_keywords)) * 70 if required_keywords else 0
    pref_score = (len(preferred_match) / len(preferred_keywords)) * 30 if preferred_keywords else 0
    experience_mentioned = extract_experience(text)
    experience_bonus = 5 if experience_mentioned else 0
    soft_skill_bonus = get_sentiment_score(text)

    total_score = min(round(req_score + pref_score + experience_bonus + soft_skill_bonus, 2), 100)

    return total_score, required_match, preferred_match, experience_mentioned, soft_skill_bonus

# --- Ranking Function ---
def rank_resumes(folder_path, required_skills, preferred_skills):
    required_keywords = set([clean_text(skill) for skill in required_skills])
    preferred_keywords = set([clean_text(skill) for skill in preferred_skills])

    results = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".docx"):
            path = os.path.join(folder_path, filename)
            text = read_docx(path)
            keywords = extract_keywords(clean_text(text))

            score, req_match, pref_match, experience_mentioned, soft_skill_bonus = score_resume(
                keywords, required_keywords, preferred_keywords, text
            )

            results.append({
                'filename': filename,
                'score': score,
                'required_matched': list(req_match),
                'preferred_matched': list(pref_match),
                'missing_required': list(required_keywords - req_match),
                'missing_preferred': list(preferred_keywords - pref_match),
                'experience': experience_mentioned,
                'soft_skill_score': soft_skill_bonus
            })

    ranked = sorted(results, key=lambda x: x['score'], reverse=True)

    # Send to stderr for debug log (won't go to stdout)
    for i, res in enumerate(ranked, 1):
        print(
            f"{i}. {res['filename']} — Score: {res['score']}/100\n"
            f"   Required matched: {res['required_matched']}\n"
            f"   Preferred matched: {res['preferred_matched']}\n"
            f"   Experience mentioned: {'Yes' if res['experience'] else 'No'}\n"
            f"   Soft Skill Bonus: {res['soft_skill_score']}\n"
            f"   Missing required: {res['missing_required']}\n"
            f"   Missing preferred: {res['missing_preferred']}\n",
            file=sys.stderr
        )

    return ranked

if __name__ == "__main__":
    import sys

    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", required=True)
    parser.add_argument("--required", default="")
    parser.add_argument("--preferred", default="")
    args = parser.parse_args()

    required_skills = [s.strip() for s in args.required.split(",") if s.strip()]
    preferred_skills = [s.strip() for s in args.preferred.split(",") if s.strip()]

    ranked = rank_resumes(args.folder, required_skills, preferred_skills)

    # Append the appId by extracting from filename
    for r in ranked:
        r["appId"] = r["filename"].split("_")[0]

    # Only JSON goes to stdout
    print(json.dumps(ranked))
