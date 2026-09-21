import { prisma } from '$lib/server/db';

/**
 * Todas las Ampliacion con los datos de Alumno y Uea necesarios para el
 * Excel de /administrador/datos (una sola consulta con joins, sin N+1).
 * Ordenado por Alumno.matricula ascendente, igual que el resto del panel
 * (ver obtenerAlumnosConAmpliaciones en repositories/alumno.ts).
 */
export function listarAmpliacionesParaExportar() {
	return prisma.ampliacion.findMany({
		orderBy: [{ alumno: { matricula: 'asc' } }, { id: 'asc' }],
		select: {
			matricula: true,
			estado: true,
			solicitud: true,
			alumno: { select: { nombre: true } },
			uea: { select: { clave: true, nombre: true, grupo: true } }
		}
	});
}
