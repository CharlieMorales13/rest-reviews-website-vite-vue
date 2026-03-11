# Restaurant Analytics - Python Analytics (ML)

Python service dedicated to data extraction (**ETL**) and **Sentiment Analysis** for reviews.

## 📁 Structure

- `etl.py`: Extraction and loading layer (Supabase -> Pandas).
- `sentiment_model.py`: **Scikit-learn** pipeline (TF-IDF + Logistic Regression).
- `config.py`: Environment configuration and SQLAlchemy sanitization.

## 🚀 Key Features

- **SQLAlchemy 2.0**: Professional database connection management.
- **Pandas**: Efficient data transformation for review analysis.
- **End-to-End Pipeline**: Automatically trains a base model, predicts sentiments, and persists results back to the database.

## 🛠️ Getting Started

1. `python -m venv venv`
2. `venv\Scripts\activate` (Windows)
3. `pip install -r requirements.txt`
4. Configure `.env` (Use `.env.example` as reference).
5. `python sentiment_model.py` (Run pipeline)

## 🔧 Dependencies

- `pandas`, `scikit-learn`, `sqlalchemy`, `psycopg2-binary`, `python-dotenv`.
