import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { requireAdministrador } from './guard';

describe('requireAdministrador', () => {
	it('sin sesion -> rechaza con 401', () => {
		try {
			requireAdministrador({ administrador: null });
			expect.unreachable('deberia haber lanzado un error 401');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) {
				expect(error.status).toBe(401);
			}
		}
	});

	it('con sesion valida -> devuelve el administrador', () => {
		const administrador = { numeroEconomico: 'ADMIN001', nombre: 'Administrador de Prueba' };
		expect(requireAdministrador({ administrador })).toEqual(administrador);
	});
});
