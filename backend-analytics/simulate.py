"""
Simulation script for ML Pipeline - Simplified and Robust Version
"""
import os
import sys
import traceback
from dotenv import load_dotenv
from sqlalchemy import text
import pandas as pd

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from etl import get_engine
from sentiment_model import train_model, save_predictions_to_db

# Configuration - Real IDs from the DB
USERS = {
    "carlos":  "67aaf2e5-e18b-45a1-b28a-5129f890cd1c",
}
ESTABLISHMENTS = {
    "Guajaquenito": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
}

TEST_REVIEWS = [
    {
        "user_id": USERS["carlos"],
        "establishment_id": ESTABLISHMENTS["Guajaquenito"],
        "food": 5, "service": 5, "price": 5,
        "comment": "Increible lugar, el Guajaquenito nunca falla. La comida es de 10."
    }
]

# Ensure stdout handles UTF-8 correctly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def clean_print(text_str):
    """Print text, falling back to ASCII if necessary."""
    try:
        print(text_str)
    except UnicodeEncodeError:
        print(text_str.encode('ascii', 'ignore').decode('ascii'))

engine = get_engine()

print("=" * 60)
print("INICIANDO SIMULACION ROBUSTA")
print("=" * 60)

try:
    inserted_ids = []
    
    # Use a single connection for the sequence
    with engine.connect() as conn:
        print("--- PASO 1: Insertando datos ---")
        for r in TEST_REVIEWS:
            # Clean up old review for this user/est pair
            with conn.begin():
                conn.execute(text("""
                    DELETE FROM sentiment_results WHERE review_id IN (
                        SELECT id FROM reviews WHERE user_id = :uid AND establishment_id = :eid
                    )
                """), {"uid": r["user_id"], "eid": r["establishment_id"]})
                
                conn.execute(text("DELETE FROM reviews WHERE user_id = :uid AND establishment_id = :eid"),
                             {"uid": r["user_id"], "eid": r["establishment_id"]})

                result = conn.execute(text("""
                    INSERT INTO reviews (user_id, establishment_id, food_score, service_score, price_score, comment)
                    VALUES (:uid, :eid, :f, :s, :p, :c)
                    RETURNING id
                """), {
                    "uid": r["user_id"], "eid": r["establishment_id"],
                    "f": r["food"], "s": r["service"], "p": r["price"],
                    "c": r["comment"]
                })
                new_id = result.scalar()
                inserted_ids.append(str(new_id))
                print(f"OK: Resena insertada ID={new_id}")

        print("\n--- PASO 2: Procesando con ML ---")
        # Load exactly these reviews
        id_list_str = ", ".join([f"'{i}'" for i in inserted_ids])
        df = pd.read_sql(text(f"SELECT * FROM reviews WHERE id::text IN ({id_list_str})"), conn)
        
        if df.empty:
            print("ERROR: No se encontraron las resenas recien insertadas.")
            sys.exit(1)

        model = train_model()
        save_predictions_to_db(df, model, engine)
        print("OK: Sentimientos analizados y guardados.")

        print("\n--- PASO 3: Verificando resultados ---")
        view_query = text("""
            SELECT r.comment, sr.predicted_label, sr.probability
            FROM reviews r
            JOIN sentiment_results sr ON r.id = sr.review_id
            WHERE r.id::text IN (""" + id_list_str + """)
        """)
        results = conn.execute(view_query).fetchall()

        for row in results:
            print(f"Comentario: {row[0]}")
            print(f"Sentimiento: {row[1].upper()} (Confianza: {float(row[2]):.2%})")
            print("-" * 30)

    print("\n" + "=" * 60)
    print("SIMULACION COMPLETADA EXITOSAMENTE")
    print("=" * 60)

except Exception as e:
    print(f"\nERROR CRITICO: {e}")
    traceback.print_exc()
