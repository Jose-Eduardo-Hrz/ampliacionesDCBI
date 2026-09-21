"""Andamio común de los pipelines de recuperación híbrida (RAG,
*Retrieval-Augmented Generation*) de César.

Tres pipelines comparten la misma maquinaria de recuperación en dos canales
fusionados con Reciprocal Rank Fusion (RRF), y hasta el 2026-09-06 la tenían
copiada, con derivas cosméticas entre las copias: `IdentidadGrafica`
(identidad gráfica institucional), `Legislación` (legislación universitaria) y
`GestionEstrategica` (Plan de Gestión Estratégica). Este módulo es esa
maquinaria, y cada pipeline conserva lo suyo --- de dónde carga su corpus, qué
texto indexa de cada nodo, y cómo cita en la salida.

Dos pipelines más del mismo ecosistema **no** usan este módulo, y no es un
descuido: `Metanalisis/RAG_GrafoUEA2020` recupera sobre un grafo `networkx` con
un modelo de lenguaje en el circuito, y `Modificaciones2026/revisor` no tiene
etapa de recuperación vectorial. Unificarlos aquí forzaría una abstracción que
ninguno de los dos pide.

Los modelos se cargan de forma perezosa, así que importar el módulo no paga el
arranque en frío: solo lo paga quien llama a `modelo()` o a `reranker()`.

Uso típico, con el corpus ya cargado por el pipeline:

    from rag_hibrido import (cargar_embeddings, indice_tfidf, modelo,
                             ranking_semantico, ranking_lexico, fusion_rrf)

    ids, vectores = cargar_embeddings(EMB_PATH)
    corpus = mi_corpus()                       # propio de cada pipeline
    texto_de = lambda i: corpus[i]["texto"]    # propio de cada pipeline
    vectorizer, matriz = indice_tfidf(ids, texto_de)
    r_sem = ranking_semantico(pregunta, ids, vectores, modelo())
    r_lex = ranking_lexico(pregunta, ids, vectorizer, matriz)
    fusionado = fusion_rrf([r_sem, r_lex])[:top]
"""
import re

import numpy as np
from nltk.stem.snowball import SnowballStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

#══════════════════════════════════════════════════════
# Constantes compartidas
#══════════════════════════════════════════════════════

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
RERANKER_NAME = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"
RRF_K = 60   # constante estándar de Reciprocal Rank Fusion
POOL_K = 30  # candidatos que cada canal aporta antes de fusionar y reordenar

_STEMMER = SnowballStemmer("spanish")
_TOKEN_RE = re.compile(r"[a-záéíóúñü]+", re.IGNORECASE)

_modelo = None
_reranker = None


def modelo(nombre=MODEL_NAME):
    """El codificador de oraciones, cargado una sola vez por proceso."""
    global _modelo
    if _modelo is None:
        from sentence_transformers import SentenceTransformer
        _modelo = SentenceTransformer(nombre)
    return _modelo


def reranker(nombre=RERANKER_NAME):
    """El reordenador cross-encoder, cargado una sola vez por proceso."""
    global _reranker
    if _reranker is None:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder(nombre)
    return _reranker


#══════════════════════════════════════════════════════
# Corpus e índice léxico
#══════════════════════════════════════════════════════

def analizador_con_raiz(texto):
    """Tokeniza y reduce a raíz gramatical española, para el canal léxico.

    Anclar las coincidencias exactas en la raíz es lo que permite al canal
    léxico recuperar nombres propios, códigos de color y medidas que el canal
    semántico subpondera.
    """
    return [_STEMMER.stem(tok) for tok in _TOKEN_RE.findall(texto.lower())]


def cargar_embeddings(ruta):
    """Lee un `.npz` con las claves `ids` y `vectores`, ya normalizados."""
    emb = np.load(ruta, allow_pickle=True)
    return list(emb["ids"]), emb["vectores"]


def indice_tfidf(ids, texto_de):
    """Construye el índice TF-IDF sobre el texto indexable de cada id.

    `texto_de` es un invocable que recibe un id y devuelve la cadena a indexar.
    Ahí vive lo específico de cada corpus --- qué campos concatena y en qué
    orden --- y es la única parte que este módulo no decide.
    """
    textos = [texto_de(i) for i in ids]
    vectorizer = TfidfVectorizer(analyzer=analizador_con_raiz, min_df=1)
    return vectorizer, vectorizer.fit_transform(textos)


#══════════════════════════════════════════════════════
# Los dos canales y su fusión
#══════════════════════════════════════════════════════

def ranking_semantico(pregunta, ids, vectores, model, k=None):
    """Similitud coseno sobre los embeddings. Con `k=None` devuelve todo."""
    q_vec = model.encode([pregunta], normalize_embeddings=True)[0]
    similitudes = vectores @ q_vec
    orden = np.argsort(-similitudes)
    if k is not None:
        orden = orden[:k]
    return [(ids[i], float(similitudes[i])) for i in orden]


def ranking_lexico(pregunta, ids, vectorizer, matriz, k=None):
    """TF-IDF con raíces gramaticales. Con `k=None` devuelve todo."""
    q_vec = vectorizer.transform([pregunta])
    similitudes = linear_kernel(q_vec, matriz).flatten()
    orden = np.argsort(-similitudes)
    if k is not None:
        orden = orden[:k]
    return [(ids[i], float(similitudes[i])) for i in orden]


def fusion_rrf(rankings, k_rrf=RRF_K):
    """Reciprocal Rank Fusion: suma el recíproco del rango en cada canal.

    Fusiona por posición y no por puntaje, de modo que dos canales con escalas
    incomparables --- coseno y TF-IDF --- se combinan sin normalizar ninguno.
    """
    puntajes = {}
    for ranking in rankings:
        for rango, (uid, _) in enumerate(ranking):
            puntajes[uid] = puntajes.get(uid, 0.0) + 1.0 / (k_rrf + rango + 1)
    return sorted(puntajes.items(), key=lambda x: -x[1])


def rerank(pregunta, candidatos, texto_de, modelo_reranker):
    """Reordena los candidatos fusionados con el cross-encoder.

    `candidatos` son pares `(id, puntaje)` como los devuelve `fusion_rrf`, y
    `texto_de` el mismo invocable que alimenta el índice léxico.
    """
    pares = [(pregunta, texto_de(uid)) for uid, _ in candidatos]
    puntajes = modelo_reranker.predict(pares)
    return sorted(zip([c[0] for c in candidatos], puntajes), key=lambda x: -x[1])
