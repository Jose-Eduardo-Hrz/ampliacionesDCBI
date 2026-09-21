import { describe, it, expect } from 'vitest';
import { matriculaSchema } from './matricula';

describe('matriculaSchema', () => {
	it('acepta 10 numeros', () => {
		expect(matriculaSchema.safeParse('2181012345').success).toBe(true);
	});

	it('rechaza 9 numeros', () => {
		expect(matriculaSchema.safeParse('218101234').success).toBe(false);
	});

	it('rechaza 11 numeros', () => {
		expect(matriculaSchema.safeParse('218101234567').success).toBe(false);
	});

	it('rechaza letras', () => {
		expect(matriculaSchema.safeParse('218101234A').success).toBe(false);
	});
});
