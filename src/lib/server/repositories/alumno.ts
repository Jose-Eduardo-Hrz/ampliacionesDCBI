import { prisma } from '$lib/server/db';
import type { AlumnoModel } from '$lib/server/generated/prisma/models';
import { AlumnoNoDisponibleError } from './errors';

export type DisponibilidadAlumno =
	| { estado: 'no_existe' }
	| { estado: 'ya_registrado'; alumno: AlumnoModel }
	| { estado: 'disponible'; alumno: AlumnoModel };

export function buscarAlumnoPorMatricula(matricula: string): Promise<AlumnoModel | null> {
	return prisma.alumno.findUnique({ where: { matricula } });
}

/**
 * Regla de negocio del flujo inicial (Fase 12): un alumno solo puede continuar
 * a /registro si existe y aun no ha completado su registro (estado EnEspera).
 */
export async function verificarDisponibilidadAlumno(
	matricula: string
): Promise<DisponibilidadAlumno> {
	const alumno = await buscarAlumnoPorMatricula(matricula);

	if (!alumno) {
		return { estado: 'no_existe' };
	}

	if (alumno.estado === 'Registrado') {
		return { estado: 'ya_registrado', alumno };
	}

	return { estado: 'disponible', alumno };
}

export interface ReclamarAlumnoInput {
	matricula: string;
	correo: string;
	telefono: string;
}

/**
 * Reclama atomicamente el registro de un alumno (Fase 17): marca su estado
 * como Registrado y guarda correo/telefono en una sola escritura condicionada
 * (updateMany con where estado: 'EnEspera', no un chequeo-y-luego-escribe).
 * Si dos solicitudes concurrentes intentan registrar al mismo alumno, solo
 * una actualiza una fila (count = 1); la otra ve count = 0 y lanza
 * AlumnoNoDisponibleError SIN haber tocado el sistema de archivos todavia,
 * porque este paso se ejecuta antes de guardar credencial/solicitud.
 */
export async function reclamarAlumnoParaRegistro({
	matricula,
	correo,
	telefono
}: ReclamarAlumnoInput): Promise<void> {
	const { count } = await prisma.alumno.updateMany({
		where: { matricula, estado: 'EnEspera' },
		data: { correo, telefono, estado: 'Registrado' }
	});

	if (count === 0) {
		throw new AlumnoNoDisponibleError();
	}
}

/** Deshace una reclamacion (rollback) si un paso posterior del envio falla. */
export async function revertirReclamoAlumno(matricula: string): Promise<void> {
	await prisma.alumno.update({
		where: { matricula },
		data: { estado: 'EnEspera', correo: null, telefono: null }
	});
}

export async function crearAmpliacionesParaAlumno(
	matricula: string,
	idUeas: number[]
): Promise<void> {
	// await prisma.ampliacion.createMany({
	// 	data: idUeas.map((idUea) => ({ matricula, idUea }))
	// });
	await prisma.ampliacion.updateMany({
		where: { matricula, idUea: { in: idUeas } },
		data: { solicitud: 'Aceptar' }
	});
}

export function obtenerAlumnosConAmpliaciones() {
	return prisma.alumno.findMany({
		orderBy: { matricula: 'asc' },
		include: {
			ampliaciones: {
				orderBy: { id: 'asc' },
				where: { solicitud: 'Aceptar' },
				include: {
					uea: {
						include: {
							horarios: { orderBy: [{ dia: 'asc' }, { inicio: 'asc' }] }
						}
					}
				}
			}
		}
	});
}
