import * as XLSX from 'xlsx';

export type FilaImportada = Record<string, string>;

export interface HojaLeida {
	/** Nombres de columna normalizados (mayusculas, sin espacios sobrantes). */
	columnas: string[];
	filas: FilaImportada[];
}

/**
 * Lee un archivo .xlsx/.xls/.csv (una sola libreria para los tres formatos,
 * ver seccion 18 de la especificacion) y devuelve sus filas como objetos,
 * con las claves de columna normalizadas para que la comparacion de
 * columnas sea robusta ante diferencias razonables de mayusculas/minusculas
 * y espacios accidentales (seccion 3.1).
 *
 * Si el archivo no es realmente un Excel/CSV valido, XLSX.read lanza un
 * error, que el llamador debe traducir a un mensaje comprensible (nunca se
 * confia solo en la extension del archivo).
 */
export function leerHojaDeCalculo(buffer: ArrayBuffer): HojaLeida {
	const libro = XLSX.read(buffer, { type: 'array' });
	const nombreHoja = libro.SheetNames[0];

	if (!nombreHoja) {
		return { columnas: [], filas: [] };
	}

	const hoja = libro.Sheets[nombreHoja];

	// Primero como matriz para obtener los encabezados reales, incluso si el
	// archivo no tiene ninguna fila de datos debajo.
	const filasComoMatriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
		header: 1,
		raw: false,
		defval: ''
	});
	const columnas = (filasComoMatriz[0] ?? []).map((valor) =>
		String(valor ?? '')
			.trim()
			.toUpperCase()
	);

	const filasCrudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, {
		raw: false,
		defval: ''
	});

	const filas = filasCrudas.map((filaCruda) => {
		const filaNormalizada: FilaImportada = {};
		for (const [columna, valor] of Object.entries(filaCruda)) {
			filaNormalizada[columna.trim().toUpperCase()] = String(valor ?? '').trim();
		}
		return filaNormalizada;
	});

	return { columnas, filas };
}

/** Columnas requeridas que no aparecen en el archivo (comparacion ya normalizada). */
export function encontrarColumnasFaltantes(
	columnasDelArchivo: string[],
	columnasRequeridas: readonly string[]
): string[] {
	const disponibles = new Set(columnasDelArchivo);
	return columnasRequeridas.filter((requerida) => !disponibles.has(requerida));
}
