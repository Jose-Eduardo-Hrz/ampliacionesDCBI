import { prisma } from '$lib/server/db';
import { Prisma } from '$lib/server/generated/prisma/client';
import type { AdministradorModel } from '$lib/server/generated/prisma/models';
import { AdministradorYaExisteError } from './errors';

export function buscarAdministradorPorNumeroEconomico(
	numeroEconomico: string
): Promise<AdministradorModel | null> {
	return prisma.administrador.findUnique({ where: { numeroEconomico } });
}

export interface CrearAdministradorInput {
	numeroEconomico: string;
	nombre: string;
	/** Ya debe venir hasheada (ver src/lib/server/auth/password.ts); nunca texto plano. */
	password: string;
}

/**
 * Crea un administrador. En vez de verificar existencia con una consulta
 * previa (chequeo-y-luego-escribe, vulnerable a condiciones de carrera),
 * intenta crear directamente y traduce la violacion de la restriccion unica
 * de numeroEconomico (P2002) en un error de dominio - mismo enfoque atomico
 * que reclamarAlumnoParaRegistro.
 */
export async function crearAdministrador({
	numeroEconomico,
	nombre,
	password
}: CrearAdministradorInput): Promise<void> {
	try {
		await prisma.administrador.create({ data: { numeroEconomico, nombre, password } });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
			throw new AdministradorYaExisteError();
		}
		throw error;
	}
}
