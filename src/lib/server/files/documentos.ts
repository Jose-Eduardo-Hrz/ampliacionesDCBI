import fs from 'node:fs/promises';
import { carpetaAlumno, rutaCredencial, rutaSolicitud } from './rutas';

export interface GuardarDocumentosInput {
	matricula: string;
	nombre: string;
	credencial: File;
	solicitud: File;
}

export interface DocumentosGuardados {
	credencialPath: string;
	solicitudPath: string;
}

/**
 * Crea la carpeta del alumno y guarda credencial + solicitud. Si falla a
 * medio camino (p. ej. la credencial se escribio pero la solicitud fallo),
 * elimina lo que ya se haya escrito antes de relanzar el error, para no
 * dejar un expediente incompleto.
 */
export async function guardarDocumentosAlumno({
	matricula,
	nombre,
	credencial,
	solicitud
}: GuardarDocumentosInput): Promise<DocumentosGuardados> {
	const carpeta = carpetaAlumno(matricula, nombre);
	const credencialPath = rutaCredencial(carpeta, matricula);
	const solicitudPath = rutaSolicitud(carpeta, matricula);

	await fs.mkdir(carpeta, { recursive: true });

	try {
		await fs.writeFile(credencialPath, Buffer.from(await credencial.arrayBuffer()));
		await fs.writeFile(solicitudPath, Buffer.from(await solicitud.arrayBuffer()));
	} catch (error) {
		await fs.rm(credencialPath, { force: true });
		await fs.rm(solicitudPath, { force: true });
		throw error;
	}

	return { credencialPath, solicitudPath };
}

/**
 * Elimina el expediente completo de un alumno. Se usa para revertir archivos
 * ya guardados cuando un paso posterior del flujo de registro (la escritura
 * en base de datos) falla despues de haberlos escrito.
 */
export async function eliminarDocumentosAlumno(matricula: string, nombre: string): Promise<void> {
	const carpeta = carpetaAlumno(matricula, nombre);
	await fs.rm(carpeta, { recursive: true, force: true });
}
