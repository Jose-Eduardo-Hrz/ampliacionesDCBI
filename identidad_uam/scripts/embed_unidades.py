"""Genera un embedding por unidad citable (subsección) de data/unidades.json,
usando el modelo multilingüe local sentence-transformers/paraphrase-multilingual-
MiniLM-L12-v2 (cacheado en ~/.cache/huggingface, no requiere descarga). Se
recalculan todos los embeddings en cada ejecución para mantener el índice
consistente con el JSON existente."""
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

DATA_DIR = Path(__file__).parent.parent / "data"
EMB_PATH = DATA_DIR / "embeddings.npz"

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def main():
    unidades = json.loads((DATA_DIR / "unidades.json").read_text(encoding="utf-8"))

    ids, textos = [], []
    for u in unidades:
        ids.append(u["numeral"])
        textos.append(f"{u['capitulo']}. {u['numeral']} {u['titulo']}. {u['texto']}")

    print(f"Cargando modelo {MODEL_NAME} ...")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Generando embeddings para {len(textos)} unidades ...")
    vectores = model.encode(textos, show_progress_bar=True, normalize_embeddings=True)

    np.savez(EMB_PATH, ids=np.array(ids), vectores=vectores.astype(np.float32))
    print(f"Guardado en {EMB_PATH} (shape={vectores.shape})")


if __name__ == "__main__":
    main()
