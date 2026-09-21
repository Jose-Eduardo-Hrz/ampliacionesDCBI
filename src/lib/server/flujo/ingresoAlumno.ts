import { matriculaSchema } from '$lib/validation/matricula';
import { verificarDisponibilidadAlumno } from '$lib/server/repositories/alumno';
import type { AlumnoModel } from '$lib/server/generated/prisma/models';
import { crearTokenProcesoAlumno } from '$lib/server/auth/procesoAlumno';

export type ResultadoIngresoAlumno =
	| { ok: true; token: string; alumno: AlumnoModel }
	| { ok: false; razon: 'formato_invalido' | 'no_existe' | 'ya_registrado' };

/**
 * Backend del flujo de la Fase 12: valida el formato de la matricula,
 * verifica en base de datos si el alumno puede continuar, y si puede, emite
 * el token firmado que /registro debera exigir despues. Nunca confia en que
 * el navegador vuelva a mandar la misma matricula sin volver a pasar por
 * aqui (por eso esta funcion es el unico lugar que emite el token).
 */
export async function evaluarIngresoAlumno(
	matriculaIngresada: string
): Promise<ResultadoIngresoAlumno> {
	const matriculaValidada = matriculaSchema.safeParse(matriculaIngresada);
	if (!matriculaValidada.success) {
		return { ok: false, razon: 'formato_invalido' };
	}

	const disponibilidad = await verificarDisponibilidadAlumno(matriculaValidada.data);

	if (disponibilidad.estado === 'no_existe') {
		return { ok: false, razon: 'no_existe' };
	}

	if (disponibilidad.estado === 'ya_registrado') {
		return { ok: false, razon: 'ya_registrado' };
	}

	return {
		ok: true,
		token: crearTokenProcesoAlumno(disponibilidad.alumno.matricula),
		alumno: disponibilidad.alumno
	};
}
