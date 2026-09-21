import { buscarAdministradorPorNumeroEconomico } from '$lib/server/repositories/administrador';
import { verifyPassword } from './password';
import { crearTokenSesion } from './session';

export type ResultadoLogin =
	| {
			ok: true;
			token: string;
			administrador: { numeroEconomico: string; nombre: string };
	  }
	| { ok: false; razon: 'no_existe' | 'password_incorrecta' };

// Hash senuelo de formato valido (nunca corresponde a una contrasena real).
// Se usa cuando el numeroEconomico no existe, para que verifyPassword corra
// de todas formas y la respuesta tarde aproximadamente lo mismo que cuando
// si existe (Fase 28: cierra un canal lateral de tiempo).
const HASH_SENUELO = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;

/**
 * Flujo de login del administrador (Fase 20): busca -> existe? -> verifica
 * password -> crea sesion. El resultado interno distingue "no_existe" de
 * "password_incorrecta" (asi lo exige la especificacion de negocio), pero
 * el TIEMPO de respuesta no debe distinguirlos, por eso se verifica la
 * password incluso cuando el usuario no existe.
 */
export async function iniciarSesionAdministrador(
	numeroEconomico: string,
	password: string
): Promise<ResultadoLogin> {
	const administrador = await buscarAdministradorPorNumeroEconomico(numeroEconomico);

	const passwordValida = await verifyPassword(password, administrador?.password ?? HASH_SENUELO);

	if (!administrador) {
		return { ok: false, razon: 'no_existe' };
	}

	if (!passwordValida) {
		return { ok: false, razon: 'password_incorrecta' };
	}

	return {
		ok: true,
		token: crearTokenSesion(administrador.numeroEconomico),
		administrador: {
			numeroEconomico: administrador.numeroEconomico,
			nombre: administrador.nombre
		}
	};
}
