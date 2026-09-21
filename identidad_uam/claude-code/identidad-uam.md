---
description: Query the UAM graphic-identity manual (Acuerdo 06/2012) for official colours per Unidad, typography, minimum sizes and safety areas, stationery measurements and misuse rules, citing numeral and page.
argument-hint: <pregunta sobre identidad gráfica>
allowed-tools: Bash, Read
---
# Consulta a la Identidad Gráfica Institucional UAM

Responde preguntas sobre las reglas oficiales de identidad visual de la UAM
(*Reglas para la Aplicación de los Elementos de Identidad Institucional*,
Acuerdo 06/2012, dic. 2012, 99 pp.) citando numeral y página exactos, usando
el catálogo + RAG (*Retrieval-Augmented Generation*) construido en
`~/identidad_uam/` (32/32 subsecciones citables
del manual).

Úsalo cuando el usuario, o el agente `design-identity`, necesiten verificar el
valor oficial exacto de un color institucional o de Unidad Universitaria,
una tipografía permitida, un tamaño mínimo/área de seguridad del emblema,
una medida de papelería (tarjeta, hoja membretada, sobre, fólder), una regla
de uso incorrecto, o la convivencia del conjunto con otros logotipos — antes
de aplicar cualquiera de estos valores en un documento institucional real
(constancias, oficios, papelería, materiales que vayan a Rectoría o a otra
Unidad Universitaria).

## Pasos

1. Ejecuta el pipeline de consulta (carga modelos en frío la primera vez del
   proceso, toma unos segundos):
   ```
   python3 ~/identidad_uam/scripts/query.py "$ARGUMENTS" --top 5
   ```
   Si `$ARGUMENTS` está vacío, pide al usuario que formule la pregunta.

2. Lee la salida: cada resultado trae numeral, título, capítulo, páginas
   impresas, los puntajes (`rrf`, `semántico`, `léxico`) y el texto completo
   de la subsección.

3. Sintetiza una respuesta en prosa que:
   - Cite el numeral y la página exactos para cada afirmación (p. ej. "según
     el numeral 5.3 (p. 49), el color de la Unidad Azcapotzalco es Pantone
     186 C / `#CD032E`").
   - Se base únicamente en el texto recuperado — no completes con
     conocimiento general de identidad gráfica ni inventes valores no
     presentes en los resultados.
   - Si la pregunta es sobre un color, distingue explícitamente si se pide
     el color oficial de una Unidad Universitaria (numeral 5.3) frente a
     otras paletas "rojo UAM" que circulan en otros documentos con
     propósitos distintos (paleta propia `nowhere_minimal` del agente
     `design-identity`, o el `uamred` de las plantillas LaTeX de reporte
     técnico en `~/.claude/CLAUDE.md`) — nunca asumas que coinciden.
   - Si el mejor resultado tiene relevancia dudosa, o ninguno responde
     realmente la pregunta, dilo explícitamente en vez de forzar una
     respuesta.
   - Si la pregunta trata sobre un diagrama de construcción reticular, una
     cenefa/textura decorativa por Unidad, o un ejemplo visual de
     correcto/incorrecto, aclara que el RAG recupera la explicación en
     prosa pero no el diagrama mismo — hay que abrir el PDF fuente
     (`~/identidad_uam/contexto/reglas-completo.pdf`)
     en la página indicada para reproducirlo.
   - Si la pregunta pide el logo/emblema mismo (no solo la regla escrita)
     para insertarlo en un documento, dirige a
     `~/identidad_uam/assets/logos/` — 13 PNG
     ya recortados de las variantes oficiales (emblema solo, conjunto
     completo positivo/negativo/color, Variación 1, Variación 2, y los
     lockups de las 4 Unidades con versión limpia en el manual). Catálogo
     estructurado en `assets/logos_manifest.json`; tabla legible en la
     sección "Variantes oficiales del logo (imágenes)" del README. No
     inventes ni redibujes el emblema — usa siempre uno de estos archivos.
   - `assets/logos/logo_UAM_oficial.png` es copia del archivo que las
     plantillas de reporte de `~/.claude/CLAUDE.md` ya referencian por ruta
     fija (`~/identidad_uam/contexto/logo_UAM.png`) en portadas — es
     oficial, simplemente no es un recorte extraído de
     `contexto/reglas-completo.pdf` sino un asset provisto directamente.

## Logo oficial recomendado para documentos nuevos (⭐ actualización 2026-07)

Desde julio de 2026 existe una **reconstrucción vectorial completa** del
emblema y el lockup institucional, verificada contra el manual (Acuerdo
06/2012, §1.2/§1.3) y contra un conjunto base oficial de referencia — no
solo un recorte rasterizado del PDF del manual. Es la recomendación por
defecto para **cualquier documento nuevo** que necesite insertar el logo,
en vez de `logo_UAM.png`/`logo_UAM_oficial.png`:

- **LaTeX/PDF** (uso normal, `\includegraphics`):
  `~/identidad_uam/assets/tikz/logo_uam_reconstruido.pdf`
- **Fuente TikZ** (si hay que editar, re-escalar o recolorear el lockup,
  regenerar con `python3 scripts/generar_lockup.py && cd assets/tikz &&
  pdflatex logo_uam_reconstruido.tex` — el archivo principal ya no
  depende de `fontspec`/`xelatex`; cada texto del lockup se compila por
  separado como su propio PDF y se incrusta vía `\includegraphics`):
  `~/identidad_uam/assets/tikz/logo_uam_reconstruido.tex`
- **PNG** (contextos que no compilan LaTeX — web, presentaciones no-Beamer,
  Word/PowerPoint, previsualización rápida):
  `~/identidad_uam/assets/logos/logo_uam_oficial_reconstruido.png`

Qué corrige frente a `logo_UAM.png`/`logo_UAM_oficial.png`: tipografía
Helvetica Neue Condensed Bold real (cargada por nombre vía `fontspec` desde
`/System/Library/Fonts/HelveticaNeue.ttc`, exigida por §1.2/§1.3 para el
lema y la denominación), emblema vectorial trazado con `potrace` desde el
PDF oficial (no rasterizado), y tamaño/espaciado del lema y la denominación
medidos por análisis de píxeles sobre un conjunto base oficial en vez de
sobre los diagramas de construcción del manual (que no coinciden con la
práctica real). Registrado en `assets/logos_manifest.json` como
`logo_uam_oficial_reconstruido` y marcado con ⭐ en el README del catálogo.

`logo_UAM.png`/`logo_UAM_oficial.png` **sigue siendo válido** — no lo
sustituyas en documentos ya existentes que lo referencian, para no
introducir inconsistencia visual dentro de una misma pieza ya iniciada.
Úsalo solo por continuidad, nunca como elección por defecto en trabajo
nuevo.

## Tipografía del cuerpo de documentos (⭐ decisión 2026-07)

El manual (numeral 4.1, Anexo II/III) define cuatro tipografías por tipo
de pieza, no intercambiables entre sí — ver la tabla completa en el README
del catálogo. Para el **cuerpo de texto de reportes/documentos** generados
bajo este sistema de identidad (la categoría "Primaria": folletos,
revistas, carteles y, por decisión editorial del equipo, cualquier reporte o
documento institucional que no sea estrictamente un oficio o papelería),
la tipografía es **siempre Helvetica Neue, en todas sus variantes**
(Regular/Italic/Bold/Bold Italic según la jerarquía tipográfica de cada
pieza) — nunca Arial Narrow (exclusiva de papelería) ni Arial (exclusiva
de oficios y comunicados, exigida por la Secretaría General), que siguen
aplicando solo a esos dos tipos de pieza.

En LaTeX se carga por nombre real vía `fontspec` (`\setmainfont{Helvetica
Neue}`, disponible en macOS en `/System/Library/Fonts/HelveticaNeue.ttc`),
lo que exige compilar con `xelatex` o `lualatex` — no `pdflatex`. Esto
reemplaza, para piezas nuevas bajo este sistema, la fuente sustituta usada
antes solo por disponibilidad en TeX Live: Latin Modern Sans en la
plantilla de reporte técnico institucional de `~/.claude/CLAUDE.md`, o TeX
Gyre Adventor/Heros en la plantilla museográfica alterna. **No sustituyas
la fuente en documentos ya existentes que usan esas plantillas** — aplica
esta decisión a documentos nuevos, igual que con el logo arriba, salvo que
el usuario pida explícitamente actualizar uno ya existente.

## Tipografía web (⭐ decisión 2026-07)

Para sitios web/multimedia bajo este sistema de identidad, la tipografía
es **obligatoria Verdana, en todas sus variantes** (Regular, Bold,
Italic) — coincide con la tabla del numeral 4.1, ahora fijado como
decisión explícita del usuario y no solo como referencia consultable. Las
alternativas de `font-family` en CSS, en este orden si Verdana no está
disponible en el sistema del visitante: Arial, luego Tahoma. No se
sustituye por Helvetica Neue (reservada a material primario impreso) ni
por las fuentes del sistema personal `nowhere_minimal` del agente
`design-identity` (Bricolage Grotesque/Space Mono/Inter) cuando la pieza
web requiere compliance institucional estricto — ese sistema personal
sigue siendo válido solo para piezas "Nowhere" no institucionales.

## Limitaciones a tener presentes

- El manual es de diciembre de 2012 (Acuerdo 06/2012) y no tiene versión
  posterior conocida en este repositorio — antes de aplicar cualquiera de
  estas reglas en un documento oficial nuevo, sugerir confirmar con la
  Coordinación de Extensión Universitaria o la Rectoría General que no
  exista una actualización no incorporada aún a este catálogo.
- Errata conocida en el PDF fuente: la pestaña lateral de las páginas
  impresas 98–99 dice "Anexo V", pero no existe tal anexo — ese contenido
  pertenece al Anexo IV (el índice general solo llega hasta el Anexo IV).
- Contenido visual (diagramas reticulares del emblema, cenefas/texturas por
  Unidad, ejemplos correcto/incorrecto) no está capturado como texto — el
  RAG recupera la unidad y su prosa, no el diagrama.
- Documentación completa del pipeline (arquitectura, cómo actualizar,
  tabla de referencia rápida de colores/tipografías/medidas) en
  `~/identidad_uam/README.md`; datos crudos de
  las 32 unidades en `data/unidades.json` si hace falta leerlas directamente
  sin pasar por el RAG.
