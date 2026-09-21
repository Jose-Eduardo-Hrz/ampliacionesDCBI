# Catálogo + RAG — Identidad Gráfica Institucional UAM

> **Andamio compartido (2026-09-06).** La maquinaria de recuperación de `scripts/query.py`
> --- índice TF-IDF con raíces españolas, ranking semántico y fusión Reciprocal Rank Fusion
> (RRF) --- vive en `scripts/rag_hibrido.py`. En el equipo de origen es una librería
> compartida entre los pipelines de Legislación, Gestión Estratégica e Identidad Gráfica; en
> este paquete distribuible viaja junto a los demás scripts, para que el proyecto sea
> autocontenido. Este proyecto conserva lo suyo: de dónde carga el corpus, qué texto indexa
> de cada nodo y cómo cita en la salida.

> **Instalación.** Ver `INSTALL.md` --- dependencias, prueba de humo y registro del comando
> `/identidad-uam` en Claude Code.


Convierte *Reglas para la Aplicación de los Elementos de Identidad
Institucional* (UAM, Acuerdo 06/2012 del 3 de diciembre de 2012, 99 pp.) en
un catálogo consultable por RAG (*Retrieval-Augmented Generation*) híbrido
(semántico + léxico). Cobertura: **32/32 subsecciones citables** (secciones
1 a 8 más los cuatro anexos del índice general).

## Arquitectura

```
contexto/reglas-completo.pdf          (fuente)
        │  pdftotext -layout
        ▼
data/full_text.txt                    (texto completo, páginas separadas por \f)
        │  scripts/parse_identidad.py  (usa el índice del propio documento
        │                               como fuente canónica de numerales/títulos)
        ▼
data/unidades.json                    (32 unidades: numeral, título, capítulo,
        │                               páginas impresas, texto)
        │  scripts/embed_unidades.py
        ▼
data/embeddings.npz                   (un vector por unidad)
        │
        ▼
scripts/query.py "pregunta"           (RAG: semántico + léxico, fusión RRF)
```

`parse_identidad.py` reconstruye todo desde cero a partir de
`data/full_text.txt` en cada ejecución — no hay estado incremental. Para
regenerar tras una edición: `python3 scripts/parse_identidad.py && python3
scripts/embed_unidades.py`.

A diferencia del pipeline de `Admin_duties/Legislación/` (1605 artículos,
con referencias cruzadas entre reglamentos), este corpus es pequeño y plano
— 32 unidades, sin citas cruzadas entre subsecciones — así que `query.py`
usa solo dos canales (semántico + léxico con TF-IDF y raíces gramaticales
en español) fusionados por *Reciprocal Rank Fusion*, sin reranker
cross-encoder ni grafo: para este tamaño de documento habrían sido
sobre-ingeniería.

## Scripts

### `scripts/parse_identidad.py`
Sin argumentos. Lee la sección "Contenido" del propio PDF para obtener la
lista canónica de 32 numerales y títulos, localiza el encabezado real de
cada uno en el cuerpo del documento, agrupa las páginas de continuación y
limpia pies de página y la pestaña lateral repetida (numeral+título
impreso en vertical junto al margen, que se repite en cada página de una
subsección). Escribe `data/unidades.json`.

### `scripts/embed_unidades.py`
Sin argumentos. Genera un embedding por unidad con
`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (mismo
modelo cacheado localmente que usa `Legislación`, sin descarga).

### `scripts/query.py`
```
python3 scripts/query.py "pregunta en lenguaje natural" [--top N]
```
Recuperación semántica (similitud coseno) + léxica (TF-IDF con
`SnowballStemmer` español), fusionadas por RRF. Cada resultado imprime
numeral, título, capítulo, páginas impresas y el texto completo de la
unidad.

### `scripts/extraer_logos.py`
Sin argumentos. Renderiza bajo demanda (con `pdftoppm -r 300`, hacia la
carpeta desechable `assets/render/`, que se regenera sola si no existe) las
13 páginas del PDF que contienen las variantes oficiales del emblema/
conjunto, recorta cada variante por una región aproximada y la ajusta
automáticamente descartando el margen blanco puro sobrante (sin tocar
fondos grises/negros propios del recorte, como la versión sobre espacio
negativo). Escribe los PNG en `assets/logos/` y el catálogo estructurado en
`assets/logos_manifest.json` (categoría, modo positivo/negativo, color,
Unidad Universitaria, numeral y página de origen). Las coordenadas de cada
región están ajustadas a mano contra el render a 300 dpi de este PDF
específico — si se reemplaza `contexto/reglas-completo.pdf` por una versión
con otra maquetación, hay que reajustarlas.

## Variantes oficiales del logo (imágenes)

`assets/logos/` contiene 13 recortes PNG de las variantes del emblema y el
conjunto que el manual reconoce como oficiales — no incluye usos incorrectos
ni diagramas de construcción reticular, solo lo efectivamente aplicable en
un documento. Catálogo estructurado en `assets/logos_manifest.json`.

| Archivo | Categoría | Modo | Color / Unidad | Numeral (pág.) |
|---|---|---|---|---|
| `emblema_base.png` | Emblema solo | positivo | negro | 1.1 (7) |
| `conjunto_base_negro.png` | Conjunto completo (emblema+lema+denominación) | positivo | negro | 2.2 (14) |
| `conjunto_color_rojo.png` | Conjunto completo | positivo | un color sólido (ejemplo en rojo) | 2.3 (15) |
| `conjunto_positivo.png` | Conjunto completo | positivo | negro, con su caja de referencia | 2.4 (16) |
| `conjunto_negativo.png` | Conjunto completo | negativo | blanco sobre negro | 2.4 (16) |
| `variacion1_positivo.png` | Variación 1 (emblema+lema, sin denominación) | positivo | negro | 2.7 (19) |
| `variacion1_negativo.png` | Variación 1 | negativo | blanco sobre negro | 2.7 (19) |
| `variacion2_positivo.png` | Variación 2 (solo emblema) | positivo | negro | 2.7 (20) |
| `variacion2_negativo.png` | Variación 2 | negativo | blanco sobre negro | 2.7 (20) |
| `unidad_xochimilco.png` | Variación 3 (conjunto + Unidad, apilado) | positivo | negro / Xochimilco | 5.2 (47) |
| `unidad_lerma.png` | Variación 5 (conjunto + Unidad, apilado compacto) | positivo | negro / Lerma | 5.2 (47) |
| `unidad_cuajimalpa.png` | Variación 6 (conjunto + Unidad, lateral con filete) | positivo | negro / Cuajimalpa | 5.2 (48) |
| `unidad_azcapotzalco.png` | Variación 7 (conjunto + Unidad, arco tipográfico) | positivo | negro / Azcapotzalco | 5.2 (48) |
| `logo_UAM_oficial.png` | Conjunto + Unidad Azcapotzalco — **el logo oficial efectivamente usado en los documentos generados** | positivo | negro + rojo ("Azcapotzalco" en rojo) | *oficial, no extraído de este PDF* |
| `logo_oficial_extenso.png` | Conjunto base apilado (emblema+lema+denominación), sin retícula — **referencia autoritativa de tamaño/espaciado del lema** | positivo | negro | *oficial, no extraído de este PDF* |
| `logo_uam_oficial_reconstruido.png` ⭐ | Conjunto + Unidad Azcapotzalco — **LOGO OFICIAL RECOMENDADO para documentos nuevos** | positivo | negro + rojo ("Azcapotzalco") | *generado, ver `assets/tikz/`* |

**⭐ Sobre `logo_uam_oficial_reconstruido.png` — el logo a usar en documentos
nuevos**: es el render de referencia de
`assets/tikz/logo_uam_reconstruido.{tex,pdf}` (el archivo vectorial real;
este PNG es solo para vista rápida o para pegar en documentos que no
compilan LaTeX). César lo designó (2026-07) como el logo oficial
recomendado en vez de `logo_UAM_oficial.png`, porque este sí cumple
Helvetica Neue Condensed Bold (§1.2/§1.3) y las proporciones lema/
denominación/espaciado medidas sobre `logo_oficial_extenso.png` — ver la
sección "Reconstrucción vectorial en TikZ" más abajo para el historial
completo de cómo se construyó y ajustó. Vinculado al skill
`/identidad-uam` (`~/.claude/commands/identidad-uam.md`) y al agente
`design-identity`
(un agente del equipo de origen, no incluido en este paquete), que
lo usan como el logo por defecto al generar documentos institucionales
UAM nuevos. `logo_UAM_oficial.png` se conserva en el catálogo como
referencia histórica de lo que ya está embebido en plantillas existentes,
no como recomendación para trabajo nuevo.

**Sobre `logo_UAM_oficial.png`**: es copia de `contexto/logo_UAM.png`, el
archivo que las plantillas LaTeX institucionales del equipo de origen
referencian por ruta fija para portadas de reporte. Es oficial — simplemente no es uno de
los recortes extraídos de `contexto/reglas-completo.pdf`, sino un asset
provisto directamente, por eso se cataloga aparte. `scripts/extraer_logos.py`
lo copia a `assets/logos/` en cada corrida para que el catálogo sea
autocontenido; el original en `Personal/` no se toca, porque las plantillas
ya lo referencian ahí.

**Sobre `logo_oficial_extenso.png`**: provisto directamente por César,
ya en `assets/logos/` (no requiere copia). Es el conjunto base limpio
(sin líneas de retícula) en su disposición apilada — emblema arriba,
lema y denominación abajo a la izquierda. Se usa en
`scripts/generar_lockup.py` como fuente del tamaño del lema (medido por
análisis de píxeles: emblema 163px, lema 37px de cap-height) — más
confiable que los diagramas de construcción del manual (p. 13/14), cuya
razón lema:denominación de 1:3.3 este mismo conjunto oficial no sigue en
la práctica (aquí es ~1:1.62; el tamaño de la denominación ya no se deriva
de esa razón, ver más abajo). El espaciado vertical, en cambio, sí se toma
del diagrama de construcción del manual — ver `assets/proportion.png` y
la sección "Reconstrucción vectorial en TikZ" más abajo.

**Sobre `proportion.png`**: recorte del diagrama de retícula oficial del
manual (p. 13/14, Acuerdo 06/2012) que César proporcionó para calibrar el
espaciado vertical del lockup. Etiqueta explícitamente los huecos
emblema→lema y lema→denominación como "(x)" (el mismo módulo) y el
cap-height de la denominación como "(3.3 x)" — es decir, ambos huecos y el
tamaño de la denominación comparten una sola unidad. Medido por análisis
de píxeles sobre las líneas de retícula del propio diagrama: `scripts/
generar_lockup.py` usa esta razón para derivar los gaps del cap-height ya
calculado de la denominación en vez de una fracción fija del alto del
emblema. Ver la sección "Reconstrucción vectorial en TikZ" para el detalle
completo.

**Sobre `proportion_v2.png`**: segundo recorte del mismo diagrama de
construcción oficial (p. 13/14), que extiende la vista un renglón más
abajo para mostrar el nombre de Unidad — "Unidad Iztapalapa", en mayúscula
inicial (no todo en mayúsculas como la denominación), alineado a la
derecha bajo "METROPOLITANA", con una anotación "(4x)" que mide el tramo
completo desde el cap-top de la denominación hasta la base del renglón de
Unidad. César proporcionó esta imagen para corregir una discrepancia ya
documentada: la reconstrucción usaba solo "Azcapotzalco", sin el prefijo
"Unidad " que exige §5.1 y que este diagrama confirma visualmente. Se usó
únicamente para corregir el TEXTO ("Unidad Azcapotzalco" en
`scripts/generar_lockup.py`); la anotación "(4x)" no se explotó para
recalibrar tamaño/posición del renglón de Unidad en ese momento — ver
`proportion_v3.png` más abajo, que sí se usó para eso.

**Sobre `proportion_v3.png`**: lockup REAL "Unidad Azcapotzalco" (no un
diagrama genérico con "Iztapalapa" como placeholder) que César proporcionó
para medir el tamaño y la posición exactos del renglón de Unidad — más
autoritativo que la razón genérica de §5.1 (3x/3.3x) usada hasta entonces.
Medido por análisis de píxeles con trazos sólidos ("U" de UNIVERSIDAD/
Unidad, "A" de Azcapotzalco, promediado sobre más de 200 columnas para
reducir ruido, ya que esta imagen es de menor resolución que
`proportion.png`/`proportion_v2.png`): cap-height de la denominación =
45px = 3.3x (re-confirma independientemente el módulo x ya usado para los
gaps emblema→lema y lema→denominación, que en esta misma imagen miden
14px cada uno, ≈ x=13.6px); cap-height de "Unidad Azcapotzalco" = 38px,
razón 38/45 = 0.844 respecto a la denominación (notablemente menor que
3/3.3 = 0.909, que sobredimensionaba el renglón de Unidad); separación
denominación→Unidad = 12px, razón 12/45 = 0.267 del cap-height de la
denominación — **menor** que el módulo x (0.303), es decir este hueco NO
comparte el mismo módulo que los otros dos, a diferencia de lo que se
asumía antes "por consistencia" sin medición propia. En
`scripts/generar_lockup.py`: `UNIDAD_CAPHEIGHT_RATIO_DENOM = 38/45` y
`GAP_DENOMINACION_UNIDAD_RATIO_DENOM = 12/45`, ambas aplicadas sobre
`denom_capheight_cm`. Verificado con medición de píxeles en el PDF final
(600dpi): razón de cap-height 0.848 (objetivo 0.844) y razón de
separación 0.292 (objetivo 0.267). El color rojo NO se tocó — César pidió
notar solo posición y tamaño de letra; sigue siendo la discrepancia
pendiente documentada (el manual no define un color para esta línea en el
conjunto base).

**Nota sobre Iztapalapa**: el manual solo muestra su lockup con líneas de
construcción/retícula superpuestas (§5.1, p. 46), a diferencia de las otras
cuatro Unidades que además tienen una versión limpia en §5.2 — no se generó
un recorte para Iztapalapa porque no hay una versión sin retícula en la
fuente. Su layout es el mismo esquema apilado que `unidad_xochimilco.png`
(Variación 3).

**Nota sobre numeración**: el manual salta de "Variación 2" (§2.7) a
"Variación 3" (§5.2) sin una "Variación 4" — igual que la errata "Anexo V"
ya documentada más abajo, parece un salto de numeración propio del PDF
fuente, no un recorte faltante de este catálogo.

Para regenerar o ajustar los recortes: `python3 scripts/extraer_logos.py`.

## Reconstrucción vectorial en TikZ (`assets/tikz/`)

El emblema es arte vectorial dentro del PDF (no una imagen embebida, ver
`pdfimages -list` sobre el manual), así que en vez de incrustar un PNG en
documentos LaTeX se puede reproducir como trazo TikZ nativo — escalable sin
pérdida, editable, y sin depender de un archivo de imagen externo.

```
assets/logos/emblema_base.png
        │  convert -threshold 50% -> .pbm ; potrace -b svg
        ▼
assets/tikz/emblema_base.svg           (trazo vectorial, 4 subrutas:
        │                                contorno externo + 3 huecos)
        │  scripts/svg_a_tikz.py
        ▼
assets/tikz/emblema_path.tikz          (mismo trazo, ya como coordenadas
        │                                TikZ absolutas — ver nota abajo
        │                                sobre por qué no \pgfpathsvg)
        │  scripts/generar_lockup.py
        │    ├─ mide con xelatex (\settowidth) el ancho real de "Casa
        │    │  abierta al tiempo" y de "UNIVERSIDAD" para resolver el
        │    │  tamaño de la denominación por restricción de alineado
        │    ├─ compila CADA texto (lema/denominación/Unidad) como su
        │    │  PROPIO PDF suelto en assets/tikz/piezas/ — ver más abajo
        │    │  por qué, no son \node de texto en la misma imagen
        │    └─ calcula en Python las posiciones (esquina, nunca centro
        │       ni referencia entre nodos TikZ) a partir de los anchos/
        │       altos reales medidos de cada pieza compilada
        ▼
assets/tikz/piezas/{lema,denominacion,unidad}.pdf  (cada texto, suelto)
assets/tikz/logo_uam_reconstruido.tex  (documento standalone, solo
                                         emblema + 3 \includegraphics —
                                         compila con pdflatex, no necesita
                                         xelatex ni fontspec)
assets/tikz/logo_uam_reconstruido.pdf  (compilado de referencia)
```

**Por qué cada texto es su propio PDF, no un `\node` de texto TikZ**: se
probaron tres arquitecturas sucesivas dentro de una sola imagen TikZ con
tres `\node` de texto — `\fontsize` distinto por nodo, `inner sep`/`text
height`/`text depth` fijados a mano, y finalmente `\fontsize` fijo +
`scale=` de TikZ — y las tres tienen el mismo bug de fondo (ver "Notas
técnicas" abajo): en cuanto **conviven dos tamaños de fuente distintos**
(por `\fontsize` o por `scale`, da igual) **y uno de los textos contiene
un carácter acentuado** ("Ó" de "AUTÓNOMA" — probado con el Unicode
literal y con `\char"00D3`, igual de roto en ambos), el ancho ya
renderizado de OTRO nodo se corrompe silenciosamente y sin previo aviso
(una "Casa abierta al tiempo" que debía medir 154.9pt terminaba midiendo
219.5, 219.6 o hasta 494pt según la combinación exacta de nodos/orden —
verificado con más de diez casos mínimos aislados). Ni separar familias de
fuente con nombres distintos, ni quitar `\setmainfont`, ni reordenar los
nodos, ni cambiar cómo se escribe el acento evitan el bug. Compilar cada
texto por separado es inmune por construcción: cada compilación ve un
solo tamaño de fuente y un solo texto, así que no hay nada que corromper.
Efecto colateral positivo: el archivo principal ya no necesita `fontspec`
ni `xelatex` — solo ensambla PDFs ya compilados con `\includegraphics`,
así que compila con `pdflatex` corriente.

**Por qué no `\pgfpathsvg`**: sería el camino directo (pegar el `d="..."`
del SVG tal cual), pero esa macro no está disponible en esta distribución
de TeX Live (probado, falla con "Undefined control sequence"). En su lugar,
`scripts/svg_a_tikz.py` parsea a mano el subconjunto de comandos SVG que
produce potrace (`M`/`m`, `l`, `c`, `z`) y emite coordenadas TikZ absolutas
(`--` para líneas, `.. controls .. and .. ..` para las curvas bézier del
óvalo central), concatenando las 4 subrutas dentro de un solo `\path[fill=
...]` para que el hueco se recorte correctamente con la regla de relleno
por defecto de TikZ (nonzero, igual que SVG).

**Cumplimiento con las reglas del manual (fuente, tamaño, espaciado)**: la
primera versión de `generar_lockup.py` posicionaba y dimensionaba todo por
análisis de píxeles sobre `logo_UAM_oficial.png` (que no seguía las reglas
de tipografía ni de proporción del manual). Una segunda versión derivó
tamaño y espaciado del sistema de unidad *x* de los diagramas de
construcción del manual (p. 13/14: lema=1x, denominación=3.3x). La versión
**actual** usa como fuente `assets/logos/logo_oficial_extenso.png` — un
conjunto base limpio (sin líneas de retícula) que César proporcionó como
referencia más autoritativa, porque **el propio conjunto oficial no seguía
la razón 1:3.3 de los diagramas de construcción** (ahí la razón real
lema:denominación es ~1:1.62 — otra discrepancia interna del manual, del
mismo tipo que la errata "Anexo V"):

- **Tipografía (§1.2/§1.3/§5.1)**: lema, denominación y nombre de Unidad
  van los tres en **Helvetica Neue Condensed Bold** — la misma familia y
  peso para los tres, no una regular y otra bold sueltas. Cada uno se
  compila por separado (ver arriba) cargando la fuente por nombre real vía
  `fontspec` (`Helvetica Neue`, estilo `Condensed Bold`, disponible en
  `/System/Library/Fonts/HelveticaNeue.ttc` en macOS) — esa compilación
  puntual sí necesita `xelatex`, pero el archivo PRINCIPAL ya no.
- **Tamaño del lema (§2.1)**: medido por análisis de píxeles directamente
  sobre `logo_oficial_extenso.png` (1550×405px): emblema 163px de alto;
  cap-height del lema ("C" de "Casa") 37px — medida de una letra aislada
  (no de la caja completa de la palabra), para no confundir cap-height con
  el overshoot de letras redondas o la cola descendente de la "p" de
  "tiempo". Relativo al alto del emblema en `scripts/generar_lockup.py`,
  así que solo hay que fijar `EMBLEMA_ALTO_CM` para reescalar el conjunto.
- **Espaciado vertical (§2.1/§2.2, emblema→lema y lema→denominación)**:
  ya NO se mide como fracción fija del alto del emblema sobre
  `logo_oficial_extenso.png` (los 18px originales) sino que se deriva del
  diagrama de retícula oficial del propio manual, `assets/proportion.png`
  (p. 13/14) — César pidió explícitamente extraer la medida de ahí. Ese
  diagrama etiqueta ambos huecos como "(x)" y el cap-height de la
  denominación como "(3.3 x)": un solo módulo `x` gobierna ambas cosas.
  Medido por análisis de píxeles sobre las 9 líneas de retícula del
  diagrama (separación uniforme ≈39.4px = 1x, confirmado con las dos
  etiquetas "(x)" cayendo cada una sobre exactamente un hueco de retícula):
  gap emblema→lema = 40.0px = 1.02x; gap lema→denominación = 39.5px =
  1.00x — ambos, dentro del margen de medición, exactamente 1x. En
  `scripts/generar_lockup.py`, `MODULO_X_RATIO_DENOM = 3.3` y ambos gaps
  se calculan en tiempo de ejecución como `denom_capheight_cm / 3.3`, una
  vez que se conoce el cap-height real de la denominación (que a su vez
  depende de la restricción de ancho, ver más abajo) — ya no son
  constantes de módulo fijas.
- **Corrección por acento en la denominación**: al aplicar el nuevo
  espaciado se detectó que el hueco visible lema→denominación salía casi
  el doble de lo esperado. Causa: "AUTÓNOMA" lleva una "Ó" cuyo acento
  sobresale por encima de la línea de cap-height, así que el PDF de la
  pieza "denominacion" (`denom_h`) es más alto que el cap-height teórico
  (`denom_capheight_cm`) — confirmado comparando el alto de un PDF de
  prueba con y sin el acento a la misma fuente/tamaño (21.34pt vs 26.31pt,
  ~0.175cm de diferencia). Como el nodo se ancla por la esquina superior
  de la imagen (`north west`), no por la tinta, ese excedente empujaba la
  "U" real hacia abajo, agrandando el hueco visual. Se corrige sumando
  `denom_acento_cm = denom_h - denom_capheight_cm` a la posición vertical
  del nodo (y restándolo de nuevo al ubicar el nombre de Unidad debajo) —
  válido porque "UNIVERSIDAD AUTÓNOMA METROPOLITANA" no tiene descendentes,
  así que todo el excedente de `denom_h` sobre el cap-height teórico es
  espacio de acento, no cola. Verificado con medición de píxeles en el PDF
  final: el hueco pasó de ~0.43cm a ~0.25cm (módulo esperado: 0.227cm,
  dentro del margen de tolerancia de medición por antialiasing).
- **Tamaño de la denominación — restricción de alineado, no cap-height**:
  César pidió que el ancho de la primera palabra sola, "UNIVERSIDAD" (su
  "D" final), coincida con el ancho de todo el lema "Casa abierta al
  tiempo" (su "o" final), ya que ambas líneas comparten el margen
  izquierdo (la "U" bajo la "C"). El ancho de un texto no se puede
  calcular a mano — depende de las métricas exactas de cada glifo — así
  que se mide compilando con xelatex (`\settowidth`, función
  `medir_ancho_pt()`): se mide el ancho de "Casa abierta al tiempo" al
  tamaño del lema y el de "UNIVERSIDAD" a un tamaño de referencia (100pt),
  y se escala proporcionalmente para encontrar el tamaño de la
  denominación que iguala ambos anchos. Verificado con precisión de
  pocos píxeles: la "D" y la "o" quedan alineadas.
- **Nombre de Unidad (§5.1)**: `logo_oficial_extenso.png` no incluye
  nombre de Unidad. El tamaño y la separación ya NO se derivan de la razón
  genérica que da el manual (3x/3.3x) sino de `assets/proportion_v3.png` —
  el lockup real "Unidad Azcapotzalco" (ver la sección de assets más
  arriba para la medición completa): cap-height 0.844 de la denominación,
  separación 0.267 del cap-height de la denominación (un módulo propio,
  distinto del que comparten los otros dos huecos). El texto es
  **"Unidad Azcapotzalco"**, con el prefijo "Unidad " que exige §5.1 —
  corregido a partir de `assets/proportion_v2.png`, un segundo recorte del
  diagrama de construcción oficial que César proporcionó y que muestra el
  renglón completo "Unidad Iztapalapa" (antes se omitía el prefijo,
  heredado sin corregir de `logo_UAM_oficial.png`; ver "Fuera de alcance"
  abajo para lo que sigue sin cambiar).
- **Fuera de alcance** (sin cambiar, documentado en el propio `.tex`): el
  color rojo de "Unidad Azcapotzalco" — el manual no menciona un color
  especial para el nombre de Unidad en el conjunto base (el rojo es una
  regla aparte, §5.3, para cenefas/texturas decorativas por Unidad, no
  para esta línea de texto). Se hereda tal cual de `logo_UAM_oficial.png`
  porque queda fuera del alcance de "fuente/espaciado/tamaño" — anotado
  como discrepancia pendiente, no corregida unilateralmente.
- **Disposición (híbrida, ajustada varias veces)**: se probó primero el
  layout ancho completo de `logo_UAM_oficial.png` (emblema + lema a la
  derecha, denominación abajo a todo lo ancho). Luego se probó apilar y
  centrar TODO (como `logo_oficial_extenso.png`). César aclaró que **solo
  el lema debía ir centrado**, y que además la denominación debía alinearse
  por la izquierda con el propio lema (no con el borde del emblema).
  Layout final: emblema arriba a la izquierda; "Casa abierta al tiempo"
  centrado justo debajo, sobre el ancho del emblema (único elemento
  centrado); "UNIVERSIDAD AUTÓNOMA METROPOLITANA" alineada a la izquierda
  con la "C" de "Casa" — no con el borde del emblema — y "Unidad
  Azcapotzalco" alineado a la derecha bajo "Metropolitana". Con la arquitectura de
  piezas sueltas (ver arriba), el centrado/alineado ya no depende de
  anclas TikZ (`anchor=north`, `lema.west`, etc.) sino de aritmética
  simple en Python sobre los anchos/altos reales medidos de cada PDF
  compilado — más simple y más robusto que las tres versiones anteriores.

**Notas técnicas (historial de bugs de TikZ/xelatex/fontspec ya
resueltos)** — se dejan documentadas porque el patrón (varios tamaños de
fuente + texto acentuado conviviendo en una imagen) puede reaparecer en
cualquier otro lockup TikZ con texto:
1. *Espaciado emblema→lema ~60% más grande de lo calculado*: el `inner
   sep` por defecto de los nodos TikZ (`0.3333em`) se resuelve con el
   tamaño de fuente *externo* activo al invocar `\node` (el de
   `\documentclass`), no el `\fontsize` del nodo — margen casi constante
   (~0.13cm) en vez de escalar. Ya no aplica: los nodos de texto se
   reemplazaron por `\includegraphics` de PDFs ya recortados.
2. *Gap lema→denominación ~88% más grande, con `inner sep=0pt` ya puesto*:
   TikZ infiere mal el alto/profundidad de un nodo de texto en cuanto
   **dos `\fontsize` distintos conviven en la misma imagen** — no
   documentado, reproducido con casos mínimos aislados.
3. *El mismo bug con `scale=` en vez de `\fontsize`, y agravado por un
   carácter acentuado*: cambiar a un `\fontsize` fijo + `scale=` por nodo
   pareció evitarlo con 2 nodos sin acento, pero en cuanto había 3 nodos
   **o** un carácter acentuado ("Ó" de "AUTÓNOMA" — probado con Unicode
   literal y con `\char"00D3`, igual de roto), el ancho de un nodo
   *anterior* se corrompía (154.9pt medían 219.5, 219.6 o hasta 494pt
   según la combinación). Ni familias de fuente separadas, ni quitar
   `\setmainfont`, ni reordenar los nodos lo evitaron.
   **Solución definitiva**: dejar de usar `\node` de texto por completo.
   Cada texto se compila como su propio PDF aislado (`compilar_pieza_pdf()`
   en `generar_lockup.py`) y se inserta con `\includegraphics` — inmune
   por construcción, porque cada compilación ve un solo tamaño y un solo
   texto, sin nada que corromper entre sí.

Para regenerar tras un cambio: `python3 scripts/generar_lockup.py && cd
assets/tikz && pdflatex logo_uam_reconstruido.tex` (el archivo principal
ya no necesita `xelatex`, solo el script de generación al compilar las
piezas de texto). Si cambia `emblema_base.png`, hay que volver a trazar
primero: `convert assets/logos/emblema_base.png -threshold 50% /tmp/e.pbm
&& potrace -b svg -a 0.2 -O 0.05 -u 1 /tmp/e.pbm -o
assets/tikz/emblema_base.svg`.

**Verificación de inserción** (`assets/tikz/prueba_insercion.tex`/`.pdf`):
documento de prueba que incrusta `logo_uam_reconstruido.pdf` vía
`\includegraphics` a dos tamaños (5cm y 10cm) dentro de un `article`
normal, compilado con `pdflatex` (no `xelatex`) — confirma que el PDF ya
compilado se incrusta sin depender del motor ni de las fuentes usadas
para generarlo, y que el emblema conserva nitidez vectorial y el texto es
legible a tamaño reducido.

## Referencia rápida

### Colores institucionales

| Uso | Pantone | CMYK | RGB | Hex |
|---|---|---|---|---|
| Conjunto base (negro institucional) | Process Black C | 0,0,0,100 | 0,0,0 | `#000000` |
| Unidad Azcapotzalco | 186 C | 10,100,84,3 | 205,3,46 | `#CD032E` |
| Unidad Cuajimalpa | 144 C | 0,60,100,0 | 240,130,0 | `#F08200` |
| Unidad Iztapalapa | 369 C | 70,5,100,0 | 87,165,25 | `#57A519` |
| Unidad Lerma | 253 C | 47,87,0,0 | 173,37,168 | `#AD25A8` |
| Unidad Xochimilco | 285 C | 85,50,0,0 | 0,114,206 | `#0072CE` |

El conjunto puede reproducirse en un solo color alterno (tinta plana) si el
material impreso lo requiere, pero nunca con colores distintos entre sus
componentes (§2.3). Nota para el resto del ecosistema de proyectos de
César: el rojo institucional real de la UAM-Azcapotzalco (`#CD032E`) **no**
coincide con el `uamred` (RGB 200,45,35) definido en las plantillas LaTeX
institucionales de `~/.claude/CLAUDE.md` — ese `uamred` es una decisión de
paleta propia de esas plantillas, no una cita del manual oficial; conviene
tenerlo presente si algún documento necesita reproducir el rojo exacto de
Azcapotzalco en vez de la paleta de reporte.

### Tipografías (§4.1, Anexo II, Anexo III)

| Uso | Tipografía | Notas |
|---|---|---|
| Emblema, lema, denominación | Helvetica Neue Condensed Bold | única permitida para el conjunto base (§1.2, §1.3) |
| Primaria (folletos, revistas, carteles, etc.) | Helvetica Neue (todas sus variantes) | prohibido combinarla con la secundaria; prohibida en papelería/oficios |
| Secundaria (papelería institucional) | Arial Narrow (Regular/Bold/Italic/Bold Italic) | exclusiva de papelería; prohibida en texto corrido u oficios |
| Oficios y comunicados | Arial (todas sus variantes) | exigida por la Secretaría General; formato detallado en Anexo III |
| Sitios web / multimedia | Verdana (Regular/Bold/Italic) | alternativas en CSS, en este orden: Arial, Tahoma |

**Decisión (2026-07)**: para el cuerpo de texto de reportes/documentos
generados bajo este sistema de identidad (la categoría "Primaria" de la
tabla de arriba), la tipografía es **siempre Helvetica Neue, en todas sus
variantes** (Regular/Italic/Bold/Bold Italic/Condensed/Condensed Bold,
según la jerarquía tipográfica de cada pieza) — nunca Arial Narrow
(exclusiva de papelería) ni Arial (exclusiva de oficios y comunicados,
exigida por la Secretaría General), que siguen aplicando solo a esos dos
tipos de pieza según manda el manual. En LaTeX se carga por nombre real
vía `fontspec` (`\newfontfamily` o `\setmainfont{Helvetica Neue}`,
disponible en macOS en `/System/Library/Fonts/HelveticaNeue.ttc`), lo que
exige compilar con `xelatex` o `lualatex`, no `pdflatex` — mismo
requisito ya documentado para el lockup del logo en la sección de
"Reconstrucción vectorial en TikZ". Esta decisión reemplaza, para piezas
que pasen por este sistema de identidad, cualquier fuente sustituta usada
antes solo por conveniencia de disponibilidad en TeX Live (Latin Modern
Sans en la plantilla de reporte técnico institucional de
`~/.claude/CLAUDE.md`, TeX Gyre Adventor/Heros en la plantilla
museográfica) — ver advertencia en el skill `/identidad-uam` sobre qué
piezas ya existentes conservan su fuente heredada por continuidad.

**Decisión (2026-07), tipografía web**: para sitios web/multimedia bajo
este sistema de identidad, la tipografía es **obligatoria Verdana, en
todas sus variantes** (Regular, Bold, Italic) — coincide con lo que ya
exige el manual en la tabla de arriba, ahora fijado como decisión
explícita de César en vez de solo referencia consultable. Las
alternativas de `font-family` en CSS, en este orden si Verdana no está
disponible en el sistema del visitante, son Arial y luego Tahoma (ya
documentadas en la tabla). No se sustituye por ninguna otra sans-serif
(ni siquiera Helvetica Neue, reservada a material primario impreso) ni
por las fuentes personales del sistema `nowhere_minimal` del agente
`design-identity` (Bricolage Grotesque/Space Mono/Inter) cuando la pieza
web es de compliance institucional estricto.

### Tamaños mínimos y área de seguridad (§2.5–§2.7)

| Variante | Tamaño mínimo | Área de seguridad |
|---|---|---|
| Conjunto completo (emblema + lema + denominación) | 4.4 cm / 320 px | 3 unidades de retícula (3x) |
| Variación 1 (emblema + lema) | 1.5 cm / 110 px | 3x |
| Variación 2 (solo emblema) | 1 cm / 98 px | 3x |

Cualquier medida menor se considera incorrecta; ningún elemento externo
puede invadir el área de seguridad.

### Papelería — medidas (§6.2–§6.5)

| Pieza | Medida |
|---|---|
| Tarjeta de presentación | 9 × 5 cm |
| Hoja membretada, tamaño carta | 21.5 × 28 cm |
| Hoja membretada, tamaño oficio | 21.5 × 35 cm |
| Sobre tamaño A | 24 × 10.5 cm |
| Sobre tamaño B | 15.8 × 24.4 cm |
| Sobre tamaño C | 34 × 26 cm (ventana 32 × 24.5 cm) |
| Sobre tamaño D | ver §6.4 |
| Fólder | extendido 45–46 × 29.5–35.5 cm; cerrado 22.5 × 29.5 cm; cartulina sulfatada blanca de 12 puntos |

### Reglas de uso incorrecto más citadas (§3.2)

- No usar solo emblema + denominación (si aparece la denominación, el lema es obligatorio).
- No deformar, escalar de forma no proporcional, ni aplicar efectos al conjunto o a sus partes.
- No modificar ningún componente del conjunto ni cambiar su tipografía.
- No alterar el orden ni el tamaño relativo de los tres elementos.

### Convivencia con otros logotipos (§3.4)

Si la UAM organiza o es el mayor participante de un evento, el conjunto
base va resaltado, de mayor tamaño, y siempre arriba o a la izquierda de
logotipos externos — nunca debajo ni a la derecha. Si la UAM es solo un
participante más entre varios logotipos, se usa la variación que mejor
preserve la identidad institucional dentro del espacio disponible.

## Índice completo de unidades citables

| Numeral | Título | Capítulo | Págs. impresas |
|---|---|---|---|
| 1.1 | El emblema institucional | Elementos básicos | 7–9 |
| 1.2 | El lema institucional | Elementos básicos | 10 |
| 1.3 | La denominación institucional | Elementos básicos | 11 |
| 2.1 | El emblema y el lema | El conjunto base | 13 |
| 2.2 | El emblema, el lema y la denominación | El conjunto base | 14 |
| 2.3 | El color | El conjunto base | 15 |
| 2.4 | Espacios positivos y negativos | El conjunto base | 16 |
| 2.5 | Tamaño mínimo permitido | El conjunto base | 17 |
| 2.6 | Área de seguridad | El conjunto base | 18 |
| 2.7 | Variaciones permitidas del conjunto | El conjunto base | 19–26 |
| 3.1 | El conjunto sobre fondos variables | Uso del conjunto y variantes | 28–29 |
| 3.2 | Usos incorrectos | Uso del conjunto y variantes | 30–32 |
| 3.3 | El uso en medios electrónicos | Uso del conjunto y variantes | 33 |
| 3.4 | Convivencia con otros logotipos | Uso del conjunto y variantes | 34–36 |
| 4.1 | Tipografía | Elementos de apoyo | 38–42 |
| 4.2 | Gráficos especiales | Elementos de apoyo | 43–44 |
| 5.1 | La Unidad Universitaria en el conjunto base | Las Unidades Universitarias | 46 |
| 5.2 | Las variaciones del conjunto con la Unidad Universitaria | Las Unidades Universitarias | 47–48 |
| 5.3 | El color de cada Unidad Universitaria | Las Unidades Universitarias | 49–50 |
| 5.4 | Gráficos decorativos por Unidad Universitaria | Las Unidades Universitarias | 51–56 |
| 6.1 | Lineamientos generales | Papelería | 58 |
| 6.2 | Tarjeta de presentación | Papelería | 59–61 |
| 6.3 | Hoja membretada | Papelería | 62–67 |
| 6.4 | Sobres | Papelería | 68–75 |
| 6.5 | Fólders | Papelería | 76–81 |
| 7.1 | Aplicación en libros | Aplicación en libros | 83–85 |
| 8.1 | Lineamientos | Aplicación en promocionales | 87–89 |
| 8.2 | Ejemplos prácticos | Aplicación en promocionales | 90–91 |
| Anexo I | Uso del conjunto o sus partes en la portada del Semanario | Anexos | 93 |
| Anexo II | La página web | Anexos | 94–95 |
| Anexo III | Lineamientos de escritura y presentación para documentos oficiales | Anexos | 96–97 |
| Anexo IV | El directorio institucional | Anexos | 98–99 |

## Cómo actualizar

Este manual no tiene versión posterior conocida en este repositorio. Si
aparece una revisión nueva: reemplazar `contexto/reglas-completo.pdf`,
volver a correr `pdftotext -layout contexto/reglas-completo.pdf
data/full_text.txt`, y luego `parse_identidad.py` + `embed_unidades.py`.
El parser depende de que el nuevo PDF conserve la misma estructura de
índice ("Contenido" → numerales `N.N` / `Anexo N` → segunda aparición de
"Presentación"); si cambia, revisar `parse_toc()` antes de confiar en la
salida.

## Limitaciones y advertencias de alcance

- **Vigencia**: el manual es de diciembre de 2012 (Acuerdo 06/2012). Antes
  de aplicar cualquiera de estas reglas en un documento oficial nuevo,
  confirmar con la Coordinación de Extensión Universitaria o la Rectoría
  General que no exista una actualización posterior no incorporada aún a
  este catálogo.
- **Errata detectada en el PDF fuente**: la pestaña lateral de las últimas
  dos páginas del Anexo IV (páginas impresas 98–99) dice "Anexo V", pero no
  existe tal anexo — el índice general solo llega hasta el Anexo IV, y el
  contenido de esas páginas (continuación del directorio institucional y
  colofón editorial) pertenece inequívocamente al Anexo IV. Se dejó el
  texto tal cual aparece en el documento fuente; es una nota para no
  confundirse si se contrasta contra el PDF original.
- **Contenido visual no capturado como texto**: los diagramas de
  construcción reticular del emblema (§1.1), las cenefas/texturas
  decorativas por Unidad (§5.4) y los ejemplos de "correcto/incorrecto"
  dependen de la imagen misma, no solo de su etiqueta textual — el RAG
  recupera la unidad correcta y su explicación en prosa, pero para
  reproducir el diagrama hay que abrir el PDF en la página indicada. Las
  variantes oficiales del logo en sí (emblema, conjunto, variaciones 1/2,
  y los lockups por Unidad) sí están extraídas como imagen en
  `assets/logos/` — ver la sección correspondiente arriba.
- Dado el tamaño del corpus (32 unidades), preguntas muy genéricas
  ("¿cómo se usa el logo?") pueden traer de vuelta 2–3 unidades igualmente
  relevantes sin un ganador claro — es la naturaleza de un manual de
  diseño con muchas reglas co-iguales, no un defecto del pipeline.
