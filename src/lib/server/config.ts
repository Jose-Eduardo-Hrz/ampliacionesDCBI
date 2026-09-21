import path from 'node:path';
import { env } from '$env/dynamic/private';

const BYTES_POR_MB = 1024 * 1024;

function resolverMaxPdfSizeMb(): number {
	const valor = Number(env.MAX_PDF_SIZE_MB ?? '5');
	if (!Number.isFinite(valor) || valor <= 0) {
		throw new Error(
			`MAX_PDF_SIZE_MB debe ser un numero positivo, se recibio: "${env.MAX_PDF_SIZE_MB}"`
		);
	}
	return valor;
}

/** Limite maximo por archivo PDF subido, unica fuente de verdad (variable de entorno). */
export const MAX_PDF_SIZE_MB = resolverMaxPdfSizeMb();
export const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * BYTES_POR_MB;

/** Carpeta raiz donde se guardan credenciales y solicitudes de los alumnos. */
export const DOCUMENTOS_DIR = path.resolve(process.cwd(), 'documentos');

const LONGITUD_MINIMA_SESSION_SECRET = 32;

function resolverSessionSecret(): string {
	const valor = env.SESSION_SECRET;
	if (!valor || valor.length < LONGITUD_MINIMA_SESSION_SECRET) {
		throw new Error(
			`SESSION_SECRET debe estar definida y tener al menos ${LONGITUD_MINIMA_SESSION_SECRET} caracteres.`
		);
	}
	return valor;
}

/** Clave para firmar las cookies de sesion del administrador. Sin valor por defecto: debe configurarse explicitamente. */
export const SESSION_SECRET = resolverSessionSecret();

/** Duracion de una sesion de administrador. */
export const SESSION_MAX_AGE_SEGUNDOS = 8 * 60 * 60; // 8 horas
