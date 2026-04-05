from typing import List

# Stop words en español para análisis de sentimiento en reseñas de restaurantes.
# IMPORTANTE: Se excluyen deliberadamente palabras con carga sentimental:
#   bueno, malo, mejor, peor, rico, delicioso, pesimo, excelente, horrible, etc.
SPANISH_STOP_WORDS: List[str] = [
    # Artículos
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    # Preposiciones
    "de", "del", "en", "con", "por", "para", "a", "al",
    "ante", "bajo", "cabe", "desde", "durante", "entre",
    "hacia", "hasta", "mediante", "segun", "sin", "sobre", "tras",
    # Conjunciones
    "y", "e", "o", "u", "ni", "pero", "sino", "aunque",
    "porque", "como", "cuando", "donde", "que", "si", "pues", "ya",
    # Pronombres personales y posesivos
    "yo", "tu", "el", "ella", "nosotros", "ellos", "ellas",
    "me", "te", "se", "lo", "le", "nos", "les",
    "mi", "su", "mis", "sus",
    # Pronombres demostrativos
    "este", "esta", "estos", "estas",
    "ese", "esa", "esos", "esas", "eso",
    "aquel", "aquella", "aquellos", "aquellas",
    # Auxiliares y copulativos
    "es", "esta", "son", "estan", "fue", "era", "eran",
    "ser", "estar", "hay", "ha", "he", "han", "haber",
    "tener", "tiene", "tengo", "tienen",
    "sido", "estado",
    # Adverbios funcionales (sin carga sentimental)
    "muy", "mas", "menos", "ya", "aun", "tambien",
    "tampoco", "aqui", "ahi", "alli", "asi",
    # Cuantificadores funcionales
    "todo", "toda", "todos", "todas",
    "algo", "nada", "mucho", "poco",
    "tanto", "tanta", "tantos", "tantas",
    "cada", "otro", "otra", "otros", "otras",
    # Verbos auxiliares frecuentes
    "puede", "pueden", "debia", "debes", "deben",
    "voy", "va", "van", "fue", "ir",
    "hacer", "hace", "hice", "hizo",
    "dar", "da", "dio",
    # Palabras de tiempo sin juicio
    "vez", "veces", "siempre", "nunca", "hoy", "ayer",
    # Misceláneos funcionales
    "no", "si", "mas", "solo", "sola", "mismo", "misma",
    "igual", "que", "cual", "cuales", "quien", "quienes",
    "donde", "cuando", "como", "cuanto",
]
