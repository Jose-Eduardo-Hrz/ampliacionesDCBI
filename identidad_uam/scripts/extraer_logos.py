"""Extrae y recorta las variantes oficiales del emblema/conjunto UAM desde
el PDF fuente (contexto/reglas-completo.pdf), renderizando bajo demanda (con
pdftoppm -r 300) solo las páginas necesarias a assets/render/ (carpeta
desechable, se regenera sola). Cada recorte se define por una región
aproximada (en coordenadas de la imagen mostrada por la herramienta de
lectura, 1536 px de ancho); el script la escala a la resolución real
(2540 px, factor 1.65) y luego recorta automáticamente cualquier margen
blanco puro sobrante, sin tocar fondos grises/negros propios del recorte
(versión negativa, cajas de ejemplo)."""
import json
import subprocess
from pathlib import Path

from PIL import Image

BASE = Path(__file__).parent.parent
PDF = BASE / "contexto" / "reglas-completo.pdf"
RENDER = BASE / "assets" / "render"
OUT = BASE / "assets" / "logos"
OUT.mkdir(parents=True, exist_ok=True)

SCALE = 2540 / 1536  # displayed -> resolución real de pdftoppm -r 300

# (archivo_pagina, x0, y0, x1, y1) en coordenadas mostradas (1536 de ancho)
REGIONES = {
    "emblema_base": ("p-07.png", 180, 660, 1420, 1270),
    "conjunto_base_negro": ("p-14.png", 195, 1080, 1420, 1420),
    "conjunto_color_rojo": ("p-15.png", 190, 1195, 1420, 1465),
    "conjunto_positivo": ("p-16.png", 195, 375, 1410, 705),
    "conjunto_negativo": ("p-16.png", 195, 770, 1410, 1155),
    "variacion1_positivo": ("p-19.png", 195, 450, 800, 760),
    "variacion1_negativo": ("p-19.png", 330, 1222, 670, 1500),
    "variacion2_positivo": ("p-20.png", 195, 215, 800, 475),
    "variacion2_negativo": ("p-20.png", 330, 1185, 700, 1410),
    "unidad_xochimilco": ("p-47.png", 195, 865, 1290, 1170),
    "unidad_lerma": ("p-47.png", 860, 1250, 1360, 1785),
    "unidad_cuajimalpa": ("p-48.png", 195, 610, 1130, 875),
    "unidad_azcapotzalco": ("p-48.png", 855, 960, 1410, 1375),
}

CLASIFICACION = {
    "emblema_base": {"categoria": "emblema_solo", "modo": "positivo", "color": "negro", "unidad": None, "numeral": "1.1", "pagina": 7},
    "conjunto_base_negro": {"categoria": "conjunto_completo", "modo": "positivo", "color": "negro", "unidad": None, "numeral": "2.2", "pagina": 14},
    "conjunto_color_rojo": {"categoria": "conjunto_completo", "modo": "positivo", "color": "un_color_solido (rojo, ejemplo)", "unidad": None, "numeral": "2.3", "pagina": 15},
    "conjunto_positivo": {"categoria": "conjunto_completo", "modo": "positivo", "color": "negro", "unidad": None, "numeral": "2.4", "pagina": 16},
    "conjunto_negativo": {"categoria": "conjunto_completo", "modo": "negativo", "color": "negro (invertido a blanco sobre fondo negro)", "unidad": None, "numeral": "2.4", "pagina": 16},
    "variacion1_positivo": {"categoria": "variacion_1 (emblema+lema)", "modo": "positivo", "color": "negro", "unidad": None, "numeral": "2.7", "pagina": 19},
    "variacion1_negativo": {"categoria": "variacion_1 (emblema+lema)", "modo": "negativo", "color": "negro (invertido)", "unidad": None, "numeral": "2.7", "pagina": 19},
    "variacion2_positivo": {"categoria": "variacion_2 (solo emblema)", "modo": "positivo", "color": "negro", "unidad": None, "numeral": "2.7", "pagina": 20},
    "variacion2_negativo": {"categoria": "variacion_2 (solo emblema)", "modo": "negativo", "color": "negro (invertido)", "unidad": None, "numeral": "2.7", "pagina": 20},
    "unidad_xochimilco": {"categoria": "variacion_3 (conjunto + Unidad, apilado)", "modo": "positivo", "color": "negro", "unidad": "Xochimilco", "numeral": "5.2", "pagina": 47},
    "unidad_lerma": {"categoria": "variacion_5 (conjunto + Unidad, apilado compacto)", "modo": "positivo", "color": "negro", "unidad": "Lerma", "numeral": "5.2", "pagina": 47},
    "unidad_cuajimalpa": {"categoria": "variacion_6 (conjunto + Unidad, lateral con filete)", "modo": "positivo", "color": "negro", "unidad": "Cuajimalpa", "numeral": "5.2", "pagina": 48},
    "unidad_azcapotzalco": {"categoria": "variacion_7 (conjunto + Unidad, arco tipográfico)", "modo": "positivo", "color": "negro", "unidad": "Azcapotzalco", "numeral": "5.2", "pagina": 48},
}

# Assets que NO se extraen del PDF (no son recortes de esta fuente), pero se
# catalogan aquí porque son el logo oficial realmente en uso en los
# documentos que generamos (portadas de reportes, plantillas LaTeX
# institucionales, etc.). Se copian a assets/logos/ para que el catálogo sea
# autocontenido; el original en Personal/ se deja intacto porque las
# plantillas de ~/.claude/CLAUDE.md ya lo referencian por esa ruta fija.
EXTERNOS = [
    {
        "nombre": "logo_UAM_oficial",
        "archivo_original": "contexto/logo_UAM.png",
        "archivo": "assets/logos/logo_UAM_oficial.png",
        "categoria": "conjunto + Unidad Azcapotzalco (logo oficial en uso en los documentos generados)",
        "modo": "positivo",
        "color": "negro + rojo (\"Azcapotzalco\" en rojo)",
        "unidad": "Azcapotzalco",
        "numeral": None,
        "pagina": None,
        "fuente": "oficial, provisto directamente — no extraído de contexto/reglas-completo.pdf",
    },
]

# Assets provistos directamente por César y colocados ya en assets/logos/
# (no requieren copia, a diferencia de EXTERNOS) — solo se catalogan.
PROVISTOS = [
    {
        "nombre": "logo_oficial_extenso",
        "archivo": "assets/logos/logo_oficial_extenso.png",
        "categoria": "conjunto base (emblema+lema+denominación), apilado — referencia autoritativa de tamaño/espaciado para el lema",
        "modo": "positivo",
        "color": "negro",
        "unidad": None,
        "numeral": None,
        "pagina": None,
        "fuente": "oficial, provisto directamente por César — no extraído de contexto/reglas-completo.pdf",
        "nota": (
            "Usado en scripts/generar_lockup.py como fuente de las razones de "
            "tamaño/espaciado del lema y la denominación (medidas por análisis "
            "de píxeles: emblema 163px, lema 37px, denominación 60px, ambas "
            "separaciones 18px) — más confiable que los diagramas de "
            "construcción del manual (p. 13/14), cuya razón lema:denominación "
            "de 1:3.3 este mismo conjunto oficial no sigue en la práctica "
            "(aquí es ~1:1.62)."
        ),
    },
    {
        "nombre": "logo_uam_oficial_reconstruido",
        "archivo": "assets/logos/logo_uam_oficial_reconstruido.png",
        "categoria": "LOGO OFICIAL RECOMENDADO — conjunto base vectorial (emblema+lema+denominación+Unidad Azcapotzalco), generado, no extraído ni provisto",
        "modo": "positivo",
        "color": "negro + rojo (\"Azcapotzalco\")",
        "unidad": "Azcapotzalco",
        "numeral": None,
        "pagina": None,
        "fuente": (
            "generado por scripts/generar_lockup.py: emblema trazado con potrace "
            "desde emblema_base.png + texto en Helvetica Neue Condensed Bold real "
            "(fontspec), con tamaño y espaciado del lema/denominación medidos "
            "sobre logo_oficial_extenso.png. Fuente vectorial en "
            "assets/tikz/logo_uam_reconstruido.{tex,pdf} — este PNG es solo un "
            "render de referencia rápida."
        ),
        "nota": (
            "Designado por César (2026-07) como el logo oficial a usar en "
            "documentos nuevos, en vez de logo_UAM_oficial.png (que no sigue la "
            "tipografía Helvetica Neue Condensed Bold exigida por el manual "
            "§1.2/§1.3 ni la proporción lema:denominación real de logo_oficial_"
            "extenso.png). Vinculado al skill /identidad-uam y al agente "
            "design-identity — ver sus respectivos archivos de definición."
        ),
    },
]


def trim_white_border(img, tol=8):
    """Recorta filas/columnas de borde que sean blanco puro (o casi), sin
    tocar fondos grises/negros internos del recorte."""
    rgb = img.convert("RGB")
    px = rgb.load()
    w, h = rgb.size

    def row_is_white(y):
        return all(all(c >= 255 - tol for c in px[x, y]) for x in range(0, w, max(1, w // 200)))

    def col_is_white(x):
        return all(all(c >= 255 - tol for c in px[x, y]) for y in range(0, h, max(1, h // 200)))

    top = 0
    while top < h and row_is_white(top):
        top += 1
    bottom = h - 1
    while bottom > top and row_is_white(bottom):
        bottom -= 1
    left = 0
    while left < w and col_is_white(left):
        left += 1
    right = w - 1
    while right > left and col_is_white(right):
        right -= 1

    pad = 6
    return img.crop((max(0, left - pad), max(0, top - pad), min(w, right + 1 + pad), min(h, bottom + 1 + pad)))


def asegurar_render(pagina_png):
    out_path = RENDER / pagina_png
    if out_path.exists():
        return out_path
    RENDER.mkdir(parents=True, exist_ok=True)
    numero = int(pagina_png[2:4])
    prefix = RENDER / "p"
    subprocess.run(
        ["pdftoppm", "-png", "-r", "300", "-f", str(numero), "-l", str(numero), str(PDF), str(prefix)],
        check=True,
    )
    return out_path


def main():
    manifest = []
    paginas_usadas = {v[0] for v in REGIONES.values()}
    for p in paginas_usadas:
        asegurar_render(p)

    for nombre, (pagina_png, x0, y0, x1, y1) in REGIONES.items():
        img = Image.open(RENDER / pagina_png)
        box = tuple(int(v * SCALE) for v in (x0, y0, x1, y1))
        crop = img.crop(box)
        crop = trim_white_border(crop)
        out_path = OUT / f"{nombre}.png"
        crop.save(out_path)
        meta = dict(CLASIFICACION[nombre])
        meta["nombre"] = nombre
        meta["archivo"] = f"assets/logos/{nombre}.png"
        meta["dimensiones_px"] = crop.size
        manifest.append(meta)
        print(f"{nombre}: {crop.size} <- {pagina_png} {box}")

    for externo in EXTERNOS:
        meta = dict(externo)
        origen = Path(meta.pop("archivo_original"))
        destino = BASE / meta["archivo"]
        if origen.exists():
            destino.write_bytes(origen.read_bytes())
            meta["dimensiones_px"] = Image.open(destino).size
        else:
            meta["dimensiones_px"] = None
            print(f"AVISO: no se encontró {origen}, se cataloga sin copiar")
        manifest.append(meta)
        print(f"{meta['nombre']}: copiado de {origen} -> {destino}")

    for provisto in PROVISTOS:
        meta = dict(provisto)
        ruta = BASE / meta["archivo"]
        if ruta.exists():
            meta["dimensiones_px"] = Image.open(ruta).size
        else:
            meta["dimensiones_px"] = None
            print(f"AVISO: no se encontró {ruta}, se cataloga sin dimensiones")
        manifest.append(meta)
        print(f"{meta['nombre']}: ya presente en {ruta}")

    (OUT.parent / "logos_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nManifiesto: {OUT.parent / 'logos_manifest.json'}")


if __name__ == "__main__":
    main()
