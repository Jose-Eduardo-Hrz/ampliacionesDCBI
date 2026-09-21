import { describe, it, expect } from 'vitest';
import { correoInstitucionalSchema, telefonoSchema } from './contacto';

describe('correoInstitucionalSchema', () => {
	it('acepta un correo @azc.uam.mx', () => {
		expect(correoInstitucionalSchema.safeParse('usuario@azc.uam.mx').success).toBe(true);
	});

	it('rechaza un correo de otro dominio', () => {
		expect(correoInstitucionalSchema.safeParse('usuario@gmail.com').success).toBe(false);
	});

	it('normaliza mayusculas y espacios', () => {
		const resultado = correoInstitucionalSchema.safeParse('  Usuario@AZC.UAM.MX  ');
		expect(resultado.success && resultado.data).toBe('usuario@azc.uam.mx');
	});
});

describe('telefonoSchema', () => {
	it('acepta 10 digitos', () => {
		expect(telefonoSchema.safeParse('5511112222').success).toBe(true);
	});

	it('rechaza letras', () => {
		expect(telefonoSchema.safeParse('551111abcd').success).toBe(false);
	});
});
