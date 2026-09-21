# Instalación — Catálogo y consulta de la Identidad Gráfica Institucional UAM

Paquete autocontenido: el manual parseado en 32 subsecciones citables, los
embeddings ya calculados, el catálogo de logotipos extraídos y la
reconstrucción vectorial del conjunto institucional en TikZ. No hace falta
reconstruir nada para empezar a consultar.

## 1. Ubicación

El paquete asume que la carpeta queda en `~/identidad_uam`. Si la colocas en
otro sitio, ajusta la ruta en `claude-code/identidad-uam.md` (paso 3) --- los
scripts resuelven sus rutas de forma relativa y no necesitan cambios.

```bash
tar xzf identidad_uam.tar.gz -C ~
```

## 2. Dependencias

Python 3.11 o posterior. Entorno virtual recomendado.

```bash
cd ~/identidad_uam
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

`pillow` solo lo necesita `scripts/extraer_logos.py`, que reextrae el catálogo
de imágenes desde el PDF del manual; la consulta funciona sin él.

Prueba de humo --- la primera ejecución descarga de Hugging Face el modelo de
embeddings (`paraphrase-multilingual-MiniLM-L12-v2`, unos 500 MB) y tarda; las
siguientes resuelven en segundos con el modelo en caché.

```bash
python3 scripts/query.py "color de cada Unidad Universitaria Pantone" --top 3
```

La respuesta correcta encabeza con el numeral 5.3, "El color de cada Unidad
Universitaria" (p. 49-50), donde Azcapotzalco aparece como Pantone 186 C, CMYK
10/100/84/3, RGB 205/3/46.

Este pipeline recupera por dos canales --- semántico y léxico --- fusionados
con RRF, sin la etapa de reordenamiento con cross-encoder que sí tiene el
pipeline hermano de Legislación. La consecuencia práctica: conviene formular la
consulta con el vocabulario del manual. Preguntar "¿cuál es el color oficial de
la Unidad Azcapotzalco?" coloca primero el numeral 2.3, sobre el negro base del
conjunto, porque comparte el vocabulario de color sin ser la subsección
buscada. Nombrar "Unidad Universitaria" o "Pantone" basta para corregirlo.

## 3. Registrar el comando en Claude Code

```bash
mkdir -p ~/.claude/commands
cp ~/identidad_uam/claude-code/identidad-uam.md ~/.claude/commands/
```

A partir de ahí, `/identidad-uam <pregunta>` queda disponible en cualquier
proyecto. Si usas el entorno virtual del paso 2, edita la ruta del intérprete
en `~/.claude/commands/identidad-uam.md` para que apunte a su `python3`.

## 4. Qué contiene

| Ruta | Contenido |
|---|---|
| `scripts/query.py` | Consulta híbrida sobre las 32 subsecciones del manual |
| `scripts/rag_hibrido.py` | Recuperación compartida: TF-IDF con raíces españolas, semántica y fusión RRF |
| `scripts/parse_identidad.py`, `embed_unidades.py` | Reconstruyen `data/` desde el PDF |
| `scripts/extraer_logos.py` | Recorta el catálogo de logotipos del PDF |
| `scripts/svg_a_tikz.py`, `generar_lockup.py` | Reconstrucción vectorial del conjunto institucional |
| `data/` | Manual parseado, texto completo y embeddings |
| `assets/logos/` | 13 recortes en PNG: emblema, conjunto y variaciones por Unidad |
| `assets/tikz/` | Conjunto reconstruido en TikZ, con sus piezas y el PDF listo para incluir |
| `assets/demos/` | Documento de demostración que aplica el sistema |
| `contexto/reglas-completo.pdf` | El manual completo: Acuerdo 06/2012, fuente de toda cita |
| `contexto/logo_UAM.png` | Logotipo provisto, referenciado por plantillas ya existentes |

El paquete omite dos artículos académicos sobre tipografía que acompañan al
proyecto en el equipo de origen --- alimentan a un agente de diseño, no al
catálogo --- por ser material de terceros ajeno a la identidad institucional.

## 5. Reconstruir el corpus

Si aparece una edición nueva del manual, `scripts/parse_identidad.py` y
`scripts/embed_unidades.py` regeneran `data/`, y `scripts/extraer_logos.py`
vuelve a recortar el catálogo. El procedimiento completo, con el historial de
cómo se construyó y ajustó la reconstrucción vectorial, está en `README.md`.
