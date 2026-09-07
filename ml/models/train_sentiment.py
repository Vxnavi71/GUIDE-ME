"""
Standalone ML script for training and evaluating text emotion classification.
Uses scikit-learn Naive Bayes & Logistic Regression pipelines.
"""
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report


SAMPLE_TRAINING_DATA = [
    ("I feel deeply grateful for the calm walk today", "calm_joy"),
    ("Everything is going well and I feel optimistic", "calm_joy"),
    ("I am overwhelmed by deadlines and cannot breathe", "anxiety_stress"),
    ("My chest feels tight with worry and panic", "anxiety_stress"),
    ("I am exhausted, tired, and hopeless about tomorrow", "sadness"),
    ("Nothing seems to work out for me anymore", "sadness"),
    ("I am furious that my colleagues disregarded my work", "anger_frustration"),
    ("I feel irritated and annoyed by every notification", "anger_frustration"),
    ("Today was an ordinary Tuesday with standard tasks", "neutral"),
    ("Just checking in with my routine daily log", "neutral"),
]


def train_emotion_pipeline():
    texts, labels = zip(*SAMPLE_TRAINING_DATA)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
        ("clf", MultinomialNB(alpha=0.1)),
    ])

    pipeline.fit(texts, labels)
    preds = pipeline.predict(texts)
    print("Training Evaluation Report:")
    print(classification_report(labels, preds))

    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    metrics = {"status": "trained", "classes": list(set(labels)), "samples": len(texts)}
    with open(os.path.join(os.path.dirname(__file__), "model_metadata.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("Emotion model training completed successfully.")
    return pipeline


if __name__ == "__main__":
    train_emotion_pipeline()
