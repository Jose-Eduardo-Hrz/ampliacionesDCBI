#!/usr/bin/env python3
"""Convierte data/full_text.txt (pdftotext -layout del manual de identidad
gráfica UAM) en data/unidades.json: una unidad citable por subsección,
usando el índice (Contenido) como fuente canónica de números y títulos.
"""
import json
import re
from pathlib import Path

DATA = Path(__file__).parent.parent / "data"
FOOTER_RE = re.compile(
    r"^\s*Reglas para la Aplicación de los Elementos de Identidad Institucional \|\s*(\d+)\s*$"
)
CHAPTER_TITLES = {
    "1": "Elementos básicos",
    "2": "El conjunto base",
    "3": "El uso del conjunto base y sus variantes",
    "4": "Elementos de apoyo",
    "5": "Las Unidades Universitarias",
    "6": "Papelería",
    "7": "Aplicación en libros",
    "8": "Aplicación en promocionales",
    "Anexo": "Anexos",
}


def parse_toc(text):
    """Extrae (numeral, titulo, capitulo) de la sección 'Contenido'."""
    lines = text.replace("\f", "\n").split("\n")
    start = lines.index("Contenido")
    # El propio índice lista "Presentación" como su primera entrada; el
    # encabezado real de esa sección (fin del índice) es la SEGUNDA vez que
    # aparece la palabra sola en una línea.
    end = next(
        i for i in range(start + 2, len(lines)) if lines[i].strip() == "Presentación"
    )
    toc_lines = lines[start + 1 : end]

    entries = []
    i = 0
    while i < len(toc_lines):
        raw = toc_lines[i].strip()
        i += 1
        if not raw:
            continue
        m_sub = re.match(r"^(\d+\.\d+)\.\s+(.*)$", raw)
        m_anx = re.match(r"^(Anexo [IVXLC]+)\.\s+(.*)$", raw)
        m_chap = re.match(r"^(\d+)\.\s+(.*)$", raw)
        if m_sub or m_anx:
            numeral, titulo = (m_sub or m_anx).groups()
            # Los títulos largos (p. ej. Anexo III) se parten en dos líneas de TOC.
            while (
                i < len(toc_lines)
                and toc_lines[i].strip()
                and toc_lines[i].strip() != "Anexos"
                and not re.match(r"^\s*(\d+\.\d+\.|\d+\.|Anexo [IVXLC]+\.)", toc_lines[i])
            ):
                titulo += " " + toc_lines[i].strip()
                i += 1
            capitulo_num = numeral.split(".")[0] if m_sub else "Anexo"
            entries.append(
                {
                    "numeral": numeral,
                    "titulo": titulo,
                    "capitulo": CHAPTER_TITLES.get(capitulo_num, ""),
                }
            )
        elif m_chap:
            continue  # encabezado de capítulo, no es unidad citable
    return entries


def numeral_pattern(numeral):
    return re.compile(r"^\s*" + re.escape(numeral) + r"[\.\s]")


def clean_page(page_text, numeral, titulo, body_titulo):
    """Quita pies de página y las repeticiones de la pestaña lateral
    (el mismo numeral+título impreso en vertical junto al margen).
    Devuelve (texto_limpio, numero_pagina_impresa_o_None)."""
    tab_variants = {
        f"{numeral} {titulo}",
        f"{numeral}. {titulo}",
        titulo,
        f"{numeral} {body_titulo}",
        f"{numeral}. {body_titulo}",
        body_titulo,
    }
    out = []
    pagina = None
    for line in page_text.split("\n"):
        stripped = line.strip()
        m = FOOTER_RE.match(line)
        if m:
            pagina = int(m.group(1))
            continue
        if stripped in tab_variants:
            continue
        out.append(line.rstrip())
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text).strip("\n")
    return text, pagina


def main():
    full_text = (DATA / "full_text.txt").read_text()
    pages = full_text.split("\f")
    toc = parse_toc(full_text)

    # Ubicar la página de inicio de cada numeral (buscando su encabezado real
    # en el cuerpo, no en el índice ni en la pestaña lateral repetida).
    starts = {}
    body_titulos = {}
    for entry in toc:
        pat = numeral_pattern(entry["numeral"])
        found = None
        for pi, page in enumerate(pages):
            if pi <= 4:  # portada + índice + presentación, evitar falsos positivos
                continue
            first_lines = [l for l in page.split("\n") if l.strip()][:1]
            if first_lines and pat.match(first_lines[0]):
                found = pi
                # texto del encabezado tal como aparece en el cuerpo (puede
                # diferir del índice, p. ej. "Tipografía" vs "Tipografías").
                body_titulos[entry["numeral"]] = pat.sub("", first_lines[0]).strip()
                break
        if found is None:
            raise SystemExit(f"No se localizó el encabezado de {entry['numeral']!r} en el cuerpo")
        starts[entry["numeral"]] = found

    ordered = sorted(toc, key=lambda e: starts[e["numeral"]])
    unidades = []
    for idx, entry in enumerate(ordered):
        p_start = starts[entry["numeral"]]
        p_end = starts[ordered[idx + 1]["numeral"]] if idx + 1 < len(ordered) else len(pages)
        span = pages[p_start:p_end]
        cleaned = [
            clean_page(p, entry["numeral"], entry["titulo"], body_titulos[entry["numeral"]])
            for p in span
        ]
        texto = "\n\n".join(c for c, _ in cleaned if c)
        paginas = sorted({pg for _, pg in cleaned if pg is not None})
        unidades.append(
            {
                "numeral": entry["numeral"],
                "titulo": entry["titulo"],
                "capitulo": entry["capitulo"],
                "paginas_impresas": paginas,
                "texto": texto,
            }
        )

    (DATA / "unidades.json").write_text(
        json.dumps(unidades, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"{len(unidades)} unidades escritas en data/unidades.json")
    for u in unidades:
        print(f"  {u['numeral']:>10}  {u['titulo']}")


if __name__ == "__main__":
    main()
