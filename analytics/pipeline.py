import pandas as pd
import psycopg2
import json
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score

def run_pipeline():
    # ETL - Extracción (según PRD)
    conn = psycopg2.connect("host=localhost dbname=satisfaction_db user=user_admin password=secure_password")
    df = pd.read_sql("SELECT * FROM reviews", conn)
    
    # Cálculo IGE: 50% comida, 30% servicio, 20% precio
    df['ige'] = (df['food_score']*0.5 + df['service_score']*0.3 + df['price_score']*0.2) * 20
    
    # ML: Split 80/20
    X_train, X_test, y_train, y_test = train_test_split(df['comment'], (df['food_score'] > 3).astype(int), test_size=0.2)
    
    vectorizer = TfidfVectorizer()
    X_train_tfidf = vectorizer.fit_transform(X_train)
    
    model = LogisticRegression()
    model.fit(X_train_tfidf, y_train)
    
    # Resultados para Node (Contrato JSON)
    metrics = {
        "accuracy": accuracy_score(y_test, model.predict(vectorizer.transform(X_test))),
        "f1": f1_score(y_test, model.predict(vectorizer.transform(X_test))),
        "ige_avg": df['ige'].mean()
    }
    print(json.dumps(metrics))

if __name__ == "__main__":
    run_pipeline()

