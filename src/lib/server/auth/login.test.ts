import { describe, it, expect } from 'vitest';
import { iniciarSesionAdministrador } from './login';

// Administrador del seed (prisma/seed.ts).
const NUMERO_ECONOMICO = 'ADMIN001';
const PASSWORD_CORRECTA = 'CambiaEstaClave123!';

describe('iniciarSesionAdministrador', () => {
	it('usuario inexistente -> no_existe', async () => {
		const resultado = await iniciarSesionAdministrador('NOEXISTE', 'cualquiera');
		expect(resultado).toMatchObject({ ok: false, razon: 'no_existe' });
	});

	it('contrasena incorrecta -> password_incorrecta', async () => {
		const resultado = await iniciarSesionAdministrador(NUMERO_ECONOMICO, 'incorrecta');
		expect(resultado).toMatchObject({ ok: false, razon: 'password_incorrecta' });
	});

	it('credenciales correctas -> sesion creada', async () => {
		const resultado = await iniciarSesionAdministrador(NUMERO_ECONOMICO, PASSWORD_CORRECTA);
		expect(resultado.ok).toBe(true);
		if (resultado.ok) {
			expect(resultado.administrador.numeroEconomico).toBe(NUMERO_ECONOMICO);
			expect(typeof resultado.token).toBe('string');
		}
	});
});
