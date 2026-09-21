import { z } from 'zod';

// Firma binaria real de un PDF ("%PDF-"). No basta con el nombre de archivo
// ni con el Content-Type declarado por el navegador (ambos los controla
// quien sube el archivo): se inspecciona el contenido real.
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

async function esRealmentePdf(file: File): Promise<boolean> {
	const encabezado = new Uint8Array(await file.slice(0, FIRMA_PDF.length).arrayBuffer());
	return FIRMA_PDF.every((byte, i) => encabezado[i] === byte);
}

/**
 * El limite maximo en bytes lo define la Fase 8 (variable de entorno
 * MAX_PDF_SIZE_MB, centralizada); esta funcion solo recibe el valor ya
 * resuelto para no depender de como se configura.
 */
export function crearEsquemaArchivoPdf(maxSizeBytes: number) {
	return z
		.instanceof(File, { message: 'Debes adjuntar un archivo.' })
		.refine((file) => file.size > 0, { message: 'El archivo esta vacio.' })
		.refine((file) => file.size <= maxSizeBytes, {
			message: `El archivo supera el tamano maximo permitido (${Math.round(
				maxSizeBytes / (1024 * 1024)
			)} MB).`
		})
		.refine(esRealmentePdf, { message: 'El archivo debe ser un PDF valido.' });
}
