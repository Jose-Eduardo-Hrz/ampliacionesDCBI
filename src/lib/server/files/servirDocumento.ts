import fs from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import { matriculaSchema } from '$lib/validation/matricula';
import { buscarAlumnoPorMatricula } from '$lib/server/repositories/alumno';
import { carpetaAlumno, rutaCredencial, rutaSolicitud } from './rutas';

export type TipoDocumento = 'credencial' | 'solicitud';

/**
 * Localiza y lee el PDF de un alumno para servirlo desde un endpoint
 * protegido (Fase 10). La matricula del parametro de ruta nunca se usa
 * directamente para construir una ruta: primero se valida su formato, luego
 * se busca al alumno real en base de datos (su nombre es lo que determina
 * la carpeta, via rutas.ts) y solo entonces se localiza el archivo.
 */
export async function leerDocumentoAlumno(
	matriculaParam: string,
	tipo: TipoDocumento
): Promise<{ buffer: Buffer; nombreArchivo: string }> {
	const matriculaValidada = matriculaSchema.safeParse(matriculaParam);
	if (!matriculaValidada.success) {
		error(400, 'Matricula invalida.');
	}

	const alumno = await buscarAlumnoPorMatricula(matriculaValidada.data);
	if (!alumno) {
		error(404, 'Alumno no encontrado.');
	}

	const carpeta = carpetaAlumno(alumno.matricula, alumno.nombre);
	const ruta =
		tipo === 'credencial'
			? rutaCredencial(carpeta, alumno.matricula)
			: rutaSolicitud(carpeta, alumno.matricula);

	try {
		const buffer = await fs.readFile(ruta);
		return { buffer, nombreArchivo: `${alumno.matricula}_${tipo}.pdf` };
	} catch {
		error(404, 'Documento no encontrado.');
	}
}
