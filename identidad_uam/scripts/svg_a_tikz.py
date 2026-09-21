"""Convierte el path SVG (M/m, l, c, z) que produce potrace en código TikZ
directamente dibujable, sin depender de \\pgfpathsvg (no disponible en esta
distribución de TeX Live). Aplica el volteo vertical y = alto - y para pasar
del sistema de coordenadas de imagen (origen arriba-izquierda, y crece hacia
abajo) al sistema matemático de TikZ (y crece hacia arriba) — el mismo
volteo que el propio <g transform="scale(1,-1) translate(...)"> del SVG de
potrace ya aplica para el renderizado.
"""
import re
import sys


def parsear_path(d, alto=0):
    # Nota: el <path> crudo de potrace ya está en convención matemática
    # (y crece hacia arriba, origen abajo-izquierda) — es el <g transform=
    # "scale(1,-1) translate(...)"> que lo envuelve el que lo convierte a
    # la convención SVG (y crece hacia abajo) para el renderizado. Como
    # TikZ usa la misma convención que el path crudo, no hay que voltear
    # nada; se mantiene el parámetro `alto` sin usar por compatibilidad.
    tokens = re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d)
    i = 0
    x = y = 0.0
    subpaths = []
    actual = None
    cmd = None
    while i < len(tokens):
        tok = tokens[i]
        if re.match(r"[A-Za-z]", tok):
            cmd = tok
            i += 1
            continue
        if cmd in ("M", "m"):
            nx, ny = float(tokens[i]), float(tokens[i + 1])
            i += 2
            if cmd == "m":
                x, y = x + nx, y + ny
            else:
                x, y = nx, ny
            if actual is not None:
                subpaths.append(actual)
            actual = {"inicio": (x, y), "segmentos": []}
            cmd = "l" if cmd == "m" else "L"  # moveto implícito repetido = lineto
        elif cmd in ("L", "l"):
            nx, ny = float(tokens[i]), float(tokens[i + 1])
            i += 2
            if cmd == "l":
                x, y = x + nx, y + ny
            else:
                x, y = nx, ny
            actual["segmentos"].append(("L", (x, y)))
        elif cmd in ("C", "c"):
            vals = [float(tokens[i + k]) for k in range(6)]
            i += 6
            if cmd == "c":
                c1 = (x + vals[0], y + vals[1])
                c2 = (x + vals[2], y + vals[3])
                nx, ny = x + vals[4], y + vals[5]
            else:
                c1 = (vals[0], vals[1])
                c2 = (vals[2], vals[3])
                nx, ny = vals[4], vals[5]
            x, y = nx, ny
            actual["segmentos"].append(
                ("C", c1, c2, (x, y))
            )
        elif cmd in ("Z", "z"):
            if actual is not None:
                subpaths.append(actual)
                actual = None
            i += 1
        else:
            raise ValueError(f"Comando SVG no soportado: {cmd!r}")
    if actual is not None:
        subpaths.append(actual)
    return subpaths


def subpaths_a_tikz(subpaths, decimales=1):
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
        lineas.append("  " + " ".join(partes))
    return "\n".join(lineas)


def main():
    svg_path, alto_str = sys.argv[1], sys.argv[2]
    alto = float(alto_str)
    svg = open(svg_path, encoding="utf-8").read()
    d = re.search(r'<path d="(.*?)"/>', svg, re.S).group(1)
    subpaths = parsear_path(d, alto)
    print(f"% {len(subpaths)} subrutas extraídas de {svg_path}", file=sys.stderr)
    print(subpaths_a_tikz(subpaths))


if __name__ == "__main__":
    main()
