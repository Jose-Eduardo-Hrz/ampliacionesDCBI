import { prisma } from '$lib/server/db';

export async function listarAmpliacionesPorAlumno(matricula: string) {
	const ampliaciones = await prisma.ampliacion.findMany({
		where: { matricula },
		select: { estado: true, uea: { include: { horarios: true } } }
	});
	return ampliaciones.map((item) => ({
		...item.uea,
		estado: item.estado
	}));
}

export function listarUeasConHorarios() {
	return prisma.uea.findMany({
		orderBy: [{ clave: 'asc' }, { grupo: 'asc' }],
		include: {
			horarios: { orderBy: [{ dia: 'asc' }, { inicio: 'asc' }] }
		}
	});
}

/**
 * Usado para revalidar en el servidor una seleccion de UEA que llega del
 * cliente (Fase 15): nunca se confia en que los ids enviados existan.
 */
export function buscarUeasPorIds(idUeas: number[]) {
	return prisma.uea.findMany({ where: { id: { in: idUeas } } });
}
