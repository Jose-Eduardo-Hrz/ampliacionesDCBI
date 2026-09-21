// Caracteres invalidos/peligrosos en nombres de archivo o carpeta en Windows y
// POSIX, incluyendo el separador de ruta (defensa adicional contra path
// traversal, aunque el nombre venga de la base de datos y no del usuario).
// Los caracteres de control se excluyen deliberadamente.
// eslint-disable-next-line no-control-regex
const CARACTERES_INVALIDOS = /[\\/:*?"<>|\x00-\x1f]/g;

/**
 * Convierte el nombre de un alumno en un segmento de ruta seguro para usar
 * como nombre de carpeta. Nunca produce separadores de ruta, por lo que el
 * resultado siempre queda contenido dentro del directorio en el que se use.
 */
export function sanitizarNombreCarpeta(nombre: string): string {
	const limpio = nombre
		.normalize('NFC')
		.replace(CARACTERES_INVALIDOS, '')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/[.\s]+$/, ''); // Windows no permite terminar en punto o espacio

	if (!limpio) {
		throw new Error('El nombre del alumno no produce un nombre de carpeta valido.');
	}

	return limpio;
}
