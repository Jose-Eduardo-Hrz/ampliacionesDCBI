"""Consulta RAG sobre las Reglas para la Aplicación de los Elementos de
Identidad Institucional (UAM, dic. 2012), en dos etapas fusionadas:

  1. Recuperación semántica: similitud coseno de embeddings
     (paraphrase-multilingual-MiniLM-L12-v2).
  2. Recuperación léxica: TF-IDF con raíces gramaticales en español (stemmer
     Snowball), para anclar coincidencias exactas (nombres de Unidades,
     códigos de color, medidas) que el canal semántico puede subponderar.

Ambos canales se fusionan con Reciprocal Rank Fusion (RRF). El corpus es
pequeño (32 unidades citables, sin referencias cruzadas entre subsecciones),
así que a diferencia del pipeline de Legislación no se usa reranker cross-
encoder ni grafo — serían sobre-ingeniería para este tamaño de documento.

Uso:
    python3 scripts/query.py "¿qué colores usa la Unidad Azcapotzalco?"
    python3 scripts/query.py "tamaño mínimo del emblema" --top 5
"""
import argparse
import json
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent))
from rag_hibrido import (RRF_K, cargar_embeddings, fusion_rrf, indice_tfidf,
                          modelo, ranking_lexico, ranking_semantico)

DATA_DIR = Path(__file__).parent.parent / "data"
EMB_PATH = DATA_DIR / "embeddings.npz"
UNIDADES_PATH = DATA_DIR / "unidades.json"


def cargar():
    ids, vectores = cargar_embeddings(EMB_PATH)
    unidades = {u["numeral"]: u for u in json.loads(UNIDADES_PATH.read_text(encoding="utf-8"))}
    return ids, vectores, unidades


def texto_indexable(numeral, unidades):
    u = unidades[numeral]
    return f"{u['capitulo']} {u['titulo']} {u['texto']}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pregunta")
    parser.add_argument("--top", type=int, default=3)
    args = parser.parse_args()

    ids, vectores, unidades = cargar()
    model = modelo()
    vectorizer, matriz = indice_tfidf(ids, lambda i: texto_indexable(i, unidades))

    r_sem = ranking_semantico(args.pregunta, ids, vectores, model)
    r_lex = ranking_lexico(args.pregunta, ids, vectorizer, matriz)
    puntajes_sem = dict(r_sem)
    puntajes_lex = dict(r_lex)

    fusionado = fusion_rrf([r_sem, r_lex])[: args.top]

    print(f"\nPregunta: {args.pregunta}\n")
    for uid, rrf_score in fusionado:
        u = unidades[uid]
        sem = puntajes_sem.get(uid, 0.0)
        lex = puntajes_lex.get(uid, 0.0)
        paginas = ", ".join(str(p) for p in u["paginas_impresas"])
        print(f"— {u['numeral']} {u['titulo']}  ({u['capitulo']}, p. {paginas})")
        print(f"  [rrf={rrf_score:.4f}  semántico={sem:.3f}  léxico={lex:.3f}]")
        print(f"  {u['texto'][:500]}{'...' if len(u['texto']) > 500 else ''}")
        print()


if __name__ == "__main__":
    main()
