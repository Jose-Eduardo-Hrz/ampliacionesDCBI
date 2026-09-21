import { crearAdministrador } from '$lib/server/repositories/administrador';
import { AdministradorYaExisteError } from '$lib/server/repositories/errors';
import { hashPassword } from './password';

export type ResultadoCrearAdministrador = { ok: true } | { ok: false; razon: 'ya_existe' };

export interface CrearCuentaAdministradorInput {
	numeroEconomico: string;
	nombre: string;
	password: string;
}

/**
 * Crea una cuenta de administrador nueva, usando el mismo mecanismo de hash
 * (scrypt, password.ts) que ya usa el resto de la aplicacion. La contrasena
 * en texto plano nunca se guarda ni se devuelve: se hashea aqui mismo antes
 * de tocar la base de datos.
 */
export async function crearCuentaAdministrador({
	numeroEconomico,
	nombre,
	password
}: CrearCuentaAdministradorInput): Promise<ResultadoCrearAdministrador> {
	const passwordHasheada = await hashPassword(password);

	try {
		await crearAdministrador({ numeroEconomico, nombre, password: passwordHasheada });
	} catch (error) {
		if (error instanceof AdministradorYaExisteError) {
			return { ok: false, razon: 'ya_existe' };
		}
		throw error;
	}

	return { ok: true };
}
