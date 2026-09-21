"""Genera logo_uam_reconstruido.tex: reconstruye el lockup completo (emblema
+ "Casa abierta al tiempo" + "Universidad Autónoma Metropolitana" + nombre
de Unidad) usando el trazo TikZ del emblema (emblema_path.tikz) más nodos de
texto cuya tipografía, tamaño y espaciado satisfacen las reglas del manual
catalogadas en data/unidades.json — no las proporciones de
logo_UAM_oficial.png, que se usó solo como referencia de qué elementos van y
en qué disposición general (emblema + lema a la derecha, denominación abajo
a todo lo ancho, nombre de Unidad abajo alineado a la derecha), pero cuya
tipografía y relación de tamaños lema:denominación NO son compliant (ver
README, sección "Reconstrucción vectorial en TikZ").

Reglas aplicadas (numeral → regla):
  §1.2/§1.3  Lema y denominación: Helvetica Neue Condensed Bold, ambos —
             la MISMA familia y peso, no una regular y otra bold suelta.
  §2.1       Tamaño del lema: medido por análisis de píxeles directamente
             sobre assets/logos/logo_oficial_extenso.png — el conjunto
             base limpio (sin líneas de retícula) que César proporcionó
             como referencia autoritativa, en vez de los diagramas de
             construcción del manual (p. 13/14). Medido (1550×405px):
             emblema 163px de alto; cap-height del lema ("C" de "Casa")
             37px. Relativo al alto del emblema (163px = 1.0).
  §2.1       Espaciado vertical (emblema→lema y lema→denominación): medido
             directamente sobre el diagrama de retícula del propio manual
             (assets/proportion.png, p. 13/14) en vez de logo_oficial_
             extenso.png — ese diagrama etiqueta explícitamente ambos
             huecos como "(x)" y el cap-height de la denominación como
             "(3.3 x)", es decir, el mismo módulo x. Medido por análisis de
             píxeles sobre las líneas de retícula (9 líneas horizontales,
             separación uniforme ≈39.4px = 1x): gap emblema→lema = 40.0px
             = 1.016x; gap lema→denominación = 39.5px = 1.003x — ambos
             huecos son, dentro del margen de medición, exactamente 1x.
             Por tanto, en vez de fijar los gaps como fracción del alto del
             emblema, se derivan en tiempo de ejecución del cap-height ya
             calculado de la denominación: x = denom_capheight_cm / 3.3,
             y ambos gaps = x. Esto ata el espaciado vertical a la relación
             que el propio manual define entre denominación y separaciones,
             en vez de una medida de píxeles de un logo distinto.
  (ajuste)   Tamaño de la denominación: YA NO por razón de cap-height
             (3.3x del lema, que ni siquiera logo_oficial_extenso.png
             sigue — ahí es ~1.62x) sino por una restricción de alineado
             que pidió César explícitamente: el ancho de la primera
             palabra sola, "UNIVERSIDAD", debe coincidir con el ancho de
             todo el lema "Casa abierta al tiempo", para que la "D" final
             quede alineada con la "o" de "tiempo" (ya que ambas líneas
             comparten el margen izquierdo, la "U" bajo la "C"). El ancho
             no se puede calcular a mano — depende de las métricas exactas
             de cada glifo — así que se mide compilando con xelatex
             (\\settowidth) vía medir_ancho_pt().
  §5.1       Nombre de Unidad: Helvetica Neue Bold Condensed, tamaño y
             separación medidos directamente sobre assets/proportion_v3.png
             — el lockup real "Unidad Azcapotzalco" (no el diagrama
             genérico del manual con "Iztapalapa" como placeholder), más
             autoritativo que la razón genérica de §5.1 (3x/3.3x) usada
             antes: cap-height 38/45=0.844 de la denominación (no 0.909);
             separación denominación→Unidad 12/45=0.267 del cap-height de
             la denominación (no comparte el módulo x de los otros dos
             huecos). Lleva el prefijo "Unidad " ("Unidad Azcapotzalco", no
             solo "Azcapotzalco") — corregido a partir de
             assets/proportion_v2.png, que muestra el renglón completo
             "Unidad Iztapalapa" en el diagrama de construcción oficial
             (antes se omitía el prefijo, heredado de logo_UAM_oficial.png;
             ver README para el historial de esta discrepancia, ya resuelta).
             (El color rojo de "Unidad Azcapotzalco" se conserva tal cual
             está en logo_UAM_oficial.png — fuera del alcance de este
             ajuste, que es solo fuente/espaciado/tamaño; ver advertencia
             en el README.)

Fuente real: "Helvetica Neue" con estilo "Condensed Bold" (disponible en
macOS, /System/Library/Fonts/HelveticaNeue.ttc), cargada por nombre exacto
vía fontspec — requiere compilar con xelatex o lualatex, NO pdflatex.
Calibración cap-height/tamaño nominal medida empíricamente: 0.732.
"""
import re
import subprocess
import tempfile
from pathlib import Path

BASE = Path(__file__).parent.parent

PT_POR_CM = 28.3465
CAPHEIGHT_FACTOR = 0.732  # medido: cap-height / tamaño nominal, Helvetica Neue Condensed Bold

# --- Proporciones medidas sobre assets/logos/logo_oficial_extenso.png ---
# (emblema=163px, lema=37px; ver docstring)
EMBLEMA_ALTO_CM = 2.0  # control maestro; todo lo demás es proporcional a esto

_REF_EMBLEMA_PX = 163
_REF_LEMA_PX = 37

LEMA_CAPHEIGHT_CM = EMBLEMA_ALTO_CM * _REF_LEMA_PX / _REF_EMBLEMA_PX
# El tamaño de la denominación y del nombre de Unidad YA NO se derivan de
# una razón de cap-height fija: César pidió en su lugar que el ancho de la
# palabra "UNIVERSIDAD" sola coincida con el ancho de todo el lema "Casa
# abierta al tiempo" (para que la "D" final quede alineada con la "o" de
# "tiempo", igual que la "U" ya queda alineada con la "C"). Ver
# medir_ancho_pt() y su uso en main() — esto requiere compilar con xelatex
# para medir anchos reales, así que ya no son constantes de módulo.

# El espaciado vertical (gaps emblema→lema y lema→denominación) tampoco es
# una constante de módulo: se deriva en main() del cap-height ya calculado
# de la denominación, según el módulo "x" del diagrama de retícula oficial
# del manual (assets/proportion.png) — ver docstring, regla §2.1.
MODULO_X_RATIO_DENOM = 3.3  # denominación_cap_height = 3.3x, según proportion.png


def capheight_a_pt(altura_cm):
    return altura_cm * PT_POR_CM / CAPHEIGHT_FACTOR


def medir_ancho_pt(texto, fontsize_pt):
    """Compila un documento mínimo con xelatex y usa \\settowidth para medir
    el ancho real renderizado de `texto` en Helvetica Neue Condensed Bold a
    `fontsize_pt`, en puntos — necesario porque el ancho de un texto no se
    puede calcular a mano sin conocer las métricas exactas de cada glifo."""
    tex = r"""\documentclass{article}
\usepackage{fontspec}
\newfontfamily\hncb{Helvetica Neue}[UprightFont={* Condensed Bold}]
\newlength{\w}
\begin{document}
{\hncb\fontsize{%s}{%s}\selectfont
\settowidth{\w}{%s}
\typeout{ANCHO=\the\w}
}
x
\end{document}
""" % (fontsize_pt, fontsize_pt, texto)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "medir.tex").write_text(tex, encoding="utf-8")
        resultado = subprocess.run(
            ["xelatex", "-interaction=nonstopmode", "medir.tex"],
            cwd=tmp, capture_output=True, text=True,
        )
        m = re.search(r"ANCHO=([\d.]+)pt", resultado.stdout)
        if not m:
            raise RuntimeError(f"No se pudo medir el ancho de {texto!r}:\n{resultado.stdout[-2000:]}")
        return float(m.group(1))


def compilar_pieza_pdf(texto, fontsize_pt, nombre_salida, color_rgb=None):
    """Compila `texto` como su PROPIO PDF standalone (sin margen, recortado
    a la tinta exacta) en Helvetica Neue Condensed Bold a `fontsize_pt`, y
    lo guarda en assets/tikz/piezas/<nombre_salida>.pdf. Devuelve (ancho_cm,
    alto_cm) medidos del PDF resultante vía pdfinfo.

    El .tex fuente de cada pieza se escribe y conserva en
    assets/tikz/piezas/<nombre_salida>.tex (NO en un directorio temporal
    descartable) — es el script con el que se genera ese PDF, y por
    instrucción explícita de César no debe eliminarse del repositorio;
    queda ahí para poder inspeccionarlo o recompilarlo a mano
    (`xelatex <nombre>.tex`) sin pasar por este script. Solo se limpian
    los residuos de compilación (.aux/.log), nunca el .tex ni el .pdf.

    Por qué una pieza por elemento en vez de tres \\node de texto en la
    misma imagen: xelatex/fontspec tiene un bug real y reproducible (varios
    casos mínimos aislados) donde, en cuanto CONVIVEN dos tamaños de fuente
    distintos (vía \\fontsize O vía `scale` de TikZ, ambos probados) en una
    misma imagen Y uno de los textos contiene un carácter acentuado (p. ej.
    la "Ó" de "AUTÓNOMA" — probado con el carácter Unicode literal Y con
    \\char"00D3, ambos fallan igual), el ANCHO ya renderizado de OTRO nodo
    se corrompe silenciosamente (una "Casa abierta al tiempo" que debía
    medir 154.9pt terminaba midiendo 219.5, 219.6 o hasta 494pt según la
    combinación exacta). Ni separar familias de fuente, ni quitar
    `\\setmainfont`, ni reordenar los nodos, ni usar códigos de carácter en
    vez de Unicode evitan el bug. Compilar cada texto por separado y
    combinarlos como imágenes (`\\includegraphics`) es inmune por
    construcción: cada compilación solo ve UN tamaño y UN texto.
    """
    color_cmd = ""
    color_def = ""
    if color_rgb:
        color_def = r"\usepackage{xcolor}" + "\n" + f"\\definecolor{{c}}{{RGB}}{{{color_rgb[0]},{color_rgb[1]},{color_rgb[2]}}}"
        color_cmd = r"\color{c}"
    tex = r"""\documentclass[margin=0pt]{standalone}
\usepackage{fontspec}
\newfontfamily\hncb{Helvetica Neue}[UprightFont={* Condensed Bold}]
%s
\begin{document}
%s{\hncb\fontsize{%s}{%s}\selectfont %s}
\end{document}
""" % (color_def, color_cmd, fontsize_pt, fontsize_pt, texto)

    # El .tex de cada pieza se conserva en piezas/<nombre>.tex (NO en un
    # directorio temporal descartable) — es el script fuente con el que se
    # genera el PDF de esa pieza, y debe quedar en el repositorio junto al
    # PDF resultante para poder inspeccionarlo o recompilarlo a mano
    # (xelatex <nombre>.tex) sin pasar por generar_lockup.py.
    piezas_dir = BASE / "assets" / "tikz" / "piezas"
    piezas_dir.mkdir(parents=True, exist_ok=True)
    tex_path = piezas_dir / f"{nombre_salida}.tex"
    tex_path.write_text(tex, encoding="utf-8")

    resultado = subprocess.run(
        ["xelatex", "-interaction=nonstopmode", f"{nombre_salida}.tex"],
        cwd=piezas_dir, capture_output=True, text=True,
    )
    destino = piezas_dir / f"{nombre_salida}.pdf"
    if not destino.exists():
        raise RuntimeError(f"No se pudo compilar la pieza {texto!r}:\n{resultado.stdout[-2000:]}")
    # Limpiar solo los residuos de compilación (.aux/.log), nunca el .tex ni el .pdf
    for ext in (".aux", ".log"):
        residuo = piezas_dir / f"{nombre_salida}{ext}"
        if residuo.exists():
            residuo.unlink()

    info = subprocess.run(["pdfinfo", str(destino)], capture_output=True, text=True).stdout
    m = re.search(r"Page size:\s*([\d.]+)\s*x\s*([\d.]+)\s*pts", info)
    ancho_pt, alto_pt = float(m.group(1)), float(m.group(2))
    return ancho_pt / PT_POR_CM, alto_pt / PT_POR_CM


def leer_subpaths_emblema():
    import sys

    sys.path.insert(0, str(BASE / "scripts"))
    from svg_a_tikz import parsear_path

    svg = (BASE / "assets" / "tikz" / "emblema_base.svg").read_text()
    d = re.search(r'<path d="(.*?)"/>', svg, re.S).group(1)
    return parsear_path(d)


def bbox_subpaths(subpaths):
    xs, ys = [], []
    for sp in subpaths:
        xs.append(sp["inicio"][0])
        ys.append(sp["inicio"][1])
        for seg in sp["segmentos"]:
            if seg[0] == "L":
                xs.append(seg[1][0])
                ys.append(seg[1][1])
            else:
                for pt in seg[1:]:
                    xs.append(pt[0])
                    ys.append(pt[1])
    return min(xs), max(xs), min(ys), max(ys)


def transformar_subpaths(subpaths, ex0, ey0, s, tx, ty):
    def tr(pt):
        return (tx + (pt[0] - ex0) * s, ty + (pt[1] - ey0) * s)

    out = []
    for sp in subpaths:
        nsp = {"inicio": tr(sp["inicio"]), "segmentos": []}
        for seg in sp["segmentos"]:
            if seg[0] == "L":
                nsp["segmentos"].append(("L", tr(seg[1])))
            else:
                nsp["segmentos"].append(("C", tr(seg[1]), tr(seg[2]), tr(seg[3])))
        out.append(nsp)
    return out


def subpaths_a_tikz(subpaths, decimales=3):
    def fmt(pt):
        return f"({pt[0]:.{decimales}f},{pt[1]:.{decimales}f})"

    lineas = []
    for sp in subpaths:
        partes = [fmt(sp["inicio"])]
        for seg in sp["segmentos"]:
            if seg[0] == "L":
                partes.append(f"-- {fmt(seg[1])}")
            else:
                _, c1, c2, end = seg
                partes.append(f".. controls {fmt(c1)} and {fmt(c2)} .. {fmt(end)}")
        partes.append("-- cycle")
        lineas.append("    " + " ".join(partes))
    return "\n".join(lineas)


def main():
    subpaths = leer_subpaths_emblema()
    ex0, ex1, ey0, ey1 = bbox_subpaths(subpaths)
    ancho_nativo, alto_nativo = ex1 - ex0, ey1 - ey0

    s = EMBLEMA_ALTO_CM / alto_nativo  # cm por unidad nativa del trazo
    emblema_ancho_cm = ancho_nativo * s

    # Emblema con esquina inferior izquierda en el origen (layout ancho,
    # como en logo_UAM_oficial.png). Lo único que va centrado es el lema,
    # justo debajo del emblema — instrucción explícita de César: "es lo
    # único que debía ir centrado, el resto estaba bien en la versión
    # anterior" (denominación a todo lo ancho desde x=0, nombre de Unidad
    # alineado a la derecha bajo la denominación).
    emblema_final = transformar_subpaths(subpaths, ex0, ey0, s, 0.0, 0.0)
    emblema_tikz = subpaths_a_tikz(emblema_final)
    emblema_centro_x = emblema_ancho_cm / 2

    pt_lema = capheight_a_pt(LEMA_CAPHEIGHT_CM)

    # Tamaño de la denominación: NO por razón de cap-height (3.3x) sino por
    # restricción de alineado explícita de César — el ancho de la primera
    # palabra sola, "UNIVERSIDAD" (su "D" final), debe coincidir con el
    # ancho de todo el lema "Casa abierta al tiempo" (su "o" final), ya que
    # ambas líneas comparten el margen izquierdo ("U" bajo "C"). Se mide el
    # ancho real de ambos textos con xelatex (\settowidth) en vez de
    # calcularlo a mano, porque depende de las métricas exactas de cada
    # glifo en Helvetica Neue Condensed Bold.
    w_lema_pt = medir_ancho_pt("Casa abierta al tiempo", pt_lema)
    w_universidad_100pt = medir_ancho_pt("UNIVERSIDAD", 100.0)
    pt_denominacion = w_lema_pt * 100.0 / w_universidad_100pt

    # Nombre de Unidad: tamaño y separación medidos directamente sobre
    # assets/proportion_v3.png — el lockup real "Unidad Azcapotzalco" (no
    # el diagrama genérico del manual con "Iztapalapa" como placeholder),
    # así que es más autoritativo que la razón genérica de §5.1 (3x/3.3x)
    # usada antes. Medido por análisis de píxeles con trazos sólidos ("U"
    # de UNIVERSIDAD/Unidad, "A" de Azcapotzalco, promediado sobre >200
    # columnas): cap-height de la denominación = 45px; cap-height de
    # "Unidad Azcapotzalco" = 38px (razón 38/45 = 0.844, notablemente
    # menor que 3/3.3 = 0.909); separación denominación→Unidad = 12px
    # (razón 12/45 = 0.267 del cap-height de la denominación — más
    # pequeña que el módulo x = 1/3.3 = 0.303 de los otros dos huecos,
    # así que este gap NO comparte el mismo módulo x, a diferencia de lo
    # que se asumía antes "por consistencia").
    UNIDAD_CAPHEIGHT_RATIO_DENOM = 38.0 / 45.0
    GAP_DENOMINACION_UNIDAD_RATIO_DENOM = 12.0 / 45.0
    pt_unidad = pt_denominacion * UNIDAD_CAPHEIGHT_RATIO_DENOM

    # Módulo "x" del diagrama de retícula oficial (assets/proportion.png):
    # denominación_cap_height = 3.3x, y los dos gaps verticales (emblema→
    # lema, lema→denominación) son cada uno exactamente 1x — confirmado por
    # análisis de píxeles sobre las líneas de retícula del propio diagrama
    # (ver docstring, regla §2.1) y re-confirmado de forma independiente en
    # proportion_v3.png (denom_capheight=45px=3.3x da x=13.6px; gaps
    # emblema-lema y lema-denominación miden 14px cada uno en esa imagen).
    # Se deriva de denom_capheight_cm en vez de medirlo aparte, para no
    # introducir una segunda fuente de calibración.
    denom_capheight_cm = pt_denominacion * CAPHEIGHT_FACTOR / PT_POR_CM
    modulo_x_cm = denom_capheight_cm / MODULO_X_RATIO_DENOM
    GAP_EMBLEMA_LEMA_CM = modulo_x_cm
    GAP_LEMA_DENOMINACION_CM = modulo_x_cm
    GAP_DENOMINACION_UNIDAD_CM = denom_capheight_cm * GAP_DENOMINACION_UNIDAD_RATIO_DENOM

    # --- Cada texto se compila como su PROPIO PDF y se inserta como imagen
    # (\includegraphics), en vez de convivir como \node de texto en una
    # sola imagen TikZ. Motivo: bug real y reproducible de xelatex/fontspec
    # donde, en cuanto conviven dos tamaños de fuente (por \fontsize O por
    # `scale` de TikZ, ambos probados) en una imagen Y uno de los textos
    # tiene un carácter acentuado ("Ó" de "AUTÓNOMA" — probado con Unicode
    # literal y con \char"00D3, igual de roto en ambos casos), el ancho ya
    # renderizado de OTRO nodo se corrompe silenciosamente (verificado con
    # varios casos mínimos aislados: 154.9pt reales medían 219.5, 219.6 o
    # hasta 494pt según la combinación exacta de nodos/orden). Compilar
    # cada texto aparte es inmune por construcción: cada compilación ve
    # un solo tamaño y un solo texto. Ver compilar_pieza_pdf(). ---
    lema_w, lema_h = compilar_pieza_pdf("Casa abierta al tiempo", pt_lema, "lema")
    denom_w, denom_h = compilar_pieza_pdf(
        "UNIVERSIDAD AUT\\'ONOMA METROPOLITANA", pt_denominacion, "denominacion"
    )
    unidad_w, unidad_h = compilar_pieza_pdf(
        "Unidad Azcapotzalco", pt_unidad, "unidad", color_rgb=(205, 3, 46)
    )

    # --- Posiciones: todas calculadas en Python a partir de los anchos/altos
    # REALES medidos (no de aproximaciones de cap-height), y ancladas por
    # esquina (north west / north east) — nunca por centro, y nunca por
    # referencia a otro nodo TikZ (ver nota del bug arriba: cualquier
    # \node/anchor compartido entre textos de distinto tamaño es sospechoso). ---
    lema_x_left = emblema_centro_x - lema_w / 2
    lema_y_top = -GAP_EMBLEMA_LEMA_CM

    # Denominación: alineada a la izquierda con el lema (la "C" bajo la "U"),
    # separada 1x (módulo del manual) de la base del lema. La base se
    # aproxima con el cap-height calculado (no con lema_h completo, que
    # incluye la cola descendente de la "p" de "tiempo" — el hueco de
    # referencia se midió de cap a cap).
    #
    # Corrección por acento: "AUTÓNOMA" lleva una "Ó" cuyo acento sobresale
    # por encima de la línea de cap-height, así que el bounding box de la
    # pieza "denominacion" (denom_h) es MÁS ALTO que el cap-height teórico
    # (denom_capheight_cm) — verificado comparando el alto de un PDF con y
    # sin el acento a la misma fuente/tamaño (21.34pt vs 26.31pt, ~0.175cm
    # de diferencia). Como el ancla es north west (esquina superior de la
    # imagen, no de la tinta), sin corregir esto la "U" real queda
    # `denom_acento_cm` más abajo de lo previsto, agrandando visualmente el
    # hueco lema→denominación por encima del módulo x. Se compensa subiendo
    # el nodo ese mismo excedente. Válido porque "UNIVERSIDAD AUTÓNOMA
    # METROPOLITANA" no tiene descendentes (todo el excedente de denom_h
    # sobre denom_capheight_cm es acento, no cola).
    denom_acento_cm = denom_h - denom_capheight_cm
    denom_x_left = lema_x_left
    denom_y_top = lema_y_top - LEMA_CAPHEIGHT_CM - GAP_LEMA_DENOMINACION_CM + denom_acento_cm

    # Nombre de Unidad: alineado a la derecha con el final de la denominación
    # ("Metropolitana"), separado de su base con el mismo criterio. Se mide
    # desde la tinta real de la denominación (denom_y_top + denom_acento_cm
    # ya compensado arriba, así que aquí basta restar el cap-height y el gap).
    unidad_x_right = denom_x_left + denom_w
    unidad_y_top = denom_y_top - denom_acento_cm - denom_capheight_cm - GAP_DENOMINACION_UNIDAD_CM

    tex = f"""\\documentclass[margin=0.1cm]{{standalone}}
\\usepackage{{tikz}}
\\usepackage{{graphicx}}

% NOTA DE CUMPLIMIENTO — alcance de este archivo (fuente/espaciado/tamaño):
%   - Tipografía: Helvetica Neue Condensed Bold para lema, denominación y
%     nombre de Unidad (idéntica en los tres, según §1.2/§1.3/§5.1) — cada
%     una compilada por separado en assets/tikz/piezas/ (ver nota extensa
%     en generar_lockup.py sobre el bug de xelatex/fontspec que esto evita).
%   - Tamaño del lema: medido por análisis de píxeles sobre
%     assets/logos/logo_oficial_extenso.png (conjunto base limpio, sin
%     líneas de retícula) — emblema 163px, lema ("Casa abierta al tiempo")
%     37px de cap-height.
%   - Espaciado vertical (emblema-lema, lema-denominación): medido sobre el
%     diagrama de retícula oficial del manual (assets/proportion.png,
%     p. 13/14), que etiqueta ambos huecos como "(x)" y el cap-height de
%     la denominación como "(3.3 x)" — mismo módulo. Ambos gaps = x =
%     denom_capheight_cm / 3.3.
%   - Tamaño de la denominación: por restricción de ancho ("UNIVERSIDAD"
%     sola debe medir lo mismo que todo el lema, para que la "D" quede
%     alineada con la "o" de "tiempo"), no por razón de cap-height.
%   - Nombre de Unidad: "Unidad Azcapotzalco" (con el prefijo "Unidad ",
%     corregido a partir de assets/proportion_v2.png). Tamaño y separación
%     medidos sobre assets/proportion_v3.png (lockup real, no el genérico
%     con "Iztapalapa"): cap-height 0.844 de la denominación, separación
%     0.267 del cap-height de la denominación.
%   - FUERA de alcance (sin cambios, ver README): el color rojo de
%     "Unidad Azcapotzalco".

\\begin{{document}}
\\begin{{tikzpicture}}[x=1cm, y=1cm]

% --- Emblema (trazo vectorizado de emblema_base.png) ---
\\path[fill=black]
{emblema_tikz};

% --- Casa abierta al tiempo (lema, \\S1.2). ÚNICO elemento centrado —
%     debajo del emblema, sobre su ancho (centrado calculado en Python con
%     el ancho real medido, no con el ancla `north` de TikZ). ---
\\node[anchor=north west, inner sep=0pt] at ({lema_x_left:.4f},{lema_y_top:.4f})
  {{\\includegraphics{{piezas/lema.pdf}}}};

% --- Universidad Autónoma Metropolitana (denominación, \\S1.3). Alineada a
%     la izquierda con la "C" de "Casa abierta al tiempo" — NO con el
%     borde izquierdo del emblema (x=0). ---
\\node[anchor=north west, inner sep=0pt] at ({denom_x_left:.4f},{denom_y_top:.4f})
  {{\\includegraphics{{piezas/denominacion.pdf}}}};

% --- Nombre de Unidad (\\S5.1), "Unidad Azcapotzalco" (con el prefijo,
%     ver assets/proportion_v2.png), alineado a la derecha con
%     "Metropolitana" — NO centrado. El color rojo se conserva igual que
%     en logo_UAM_oficial.png — fuera de alcance de este ajuste, que es
%     solo fuente/espaciado/tamaño. ---
\\node[anchor=north east, inner sep=0pt] at ({unidad_x_right:.4f},{unidad_y_top:.4f})
  {{\\includegraphics{{piezas/unidad.pdf}}}};

\\end{{tikzpicture}}
\\end{{document}}
"""
    out_path = BASE / "assets" / "tikz" / "logo_uam_reconstruido.tex"
    out_path.write_text(tex, encoding="utf-8")
    print(f"Escrito {out_path}")
    print(f"pt_lema={pt_lema:.2f}  pt_denominacion={pt_denominacion:.2f}  pt_unidad={pt_unidad:.2f}")
    print(f"lema {lema_w:.3f}x{lema_h:.3f}cm  denom {denom_w:.3f}x{denom_h:.3f}cm  unidad {unidad_w:.3f}x{unidad_h:.3f}cm")
    print(f"emblema: {emblema_ancho_cm:.3f}cm x {EMBLEMA_ALTO_CM:.3f}cm")
    print(f"modulo_x (proportion.png) = {modulo_x_cm:.4f}cm  ->  gaps emblema-lema = lema-denom = {GAP_EMBLEMA_LEMA_CM:.4f}cm")


if __name__ == "__main__":
    main()
