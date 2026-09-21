import { prisma } from '$lib/server/db';

const ID_CONFIGURACION = 1;

/**
 * Configuracion unica del periodo de registro (fila fija id=1). null cuando
 * el administrador todavia no ha configurado nada (seccion 17).
 */
export function obtenerConfiguracionRegistro() {
	return prisma.configuracionRegistro.findUnique({ where: { id: ID_CONFIGURACION } });
}

/**
 * Crea o actualiza la unica configuracion existente (upsert sobre la fila
 * fija): nunca se crea una segunda fila, evitando configuraciones en
 * conflicto (seccion 12).
 */
export function guardarConfiguracionRegistro(datos: { inicio: Date; fin: Date }) {
	return prisma.configuracionRegistro.upsert({
		where: { id: ID_CONFIGURACION },
		update: datos,
		create: { id: ID_CONFIGURACION, ...datos }
	});
}
