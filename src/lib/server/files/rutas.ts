import path from 'node:path';
import { DOCUMENTOS_DIR } from '$lib/server/config';
import { sanitizarNombreCarpeta } from './sanitizar';

const MATRICULA_REGEX = /^\d{10}$/;

/**
 * Construye la ruta de carpeta de un alumno dentro de documentos/ y verifica
 * que el resultado quede realmente contenido ahi dentro. Nunca acepta una
 * ruta arbitraria: matricula y nombre son los unicos insumos, y ambos se
 * validan/sanitizan antes de tocar el sistema de archivos.
 */
export function carpetaAlumno(matricula: string, nombre: string): string {
	if (!MATRICULA_REGEX.test(matricula)) {
		throw new Error('Matricula invalida para construir la ruta de documentos.');
	}

	const nombreSanitizado = sanitizarNombreCarpeta(nombre);
	const carpeta = path.join(DOCUMENTOS_DIR, `${matricula}_${nombreSanitizado}`);

	asegurarDentroDeDocumentos(carpeta);

	return carpeta;
}

export function rutaCredencial(carpetaAlumnoPath: string, matricula: string): string {
	return path.join(carpetaAlumnoPath, `${matricula}_credencial.pdf`);
}

export function rutaSolicitud(carpetaAlumnoPath: string, matricula: string): string {
	return path.join(carpetaAlumnoPath, `${matricula}_solicitud.pdf`);
}

function asegurarDentroDeDocumentos(rutaAbsoluta: string): void {
	const resuelta = path.resolve(rutaAbsoluta);
	const base = path.resolve(DOCUMENTOS_DIR) + path.sep;

	if (!resuelta.startsWith(base)) {
		throw new Error('Ruta de documentos fuera del directorio permitido.');
	}
}
