import { describe, it, expect } from 'vitest';
import { env } from '$env/dynamic/private';
import { MAX_PDF_SIZE_MB } from './config';

describe('config del servidor bajo vitest', () => {
	it('resuelve MAX_PDF_SIZE_MB desde el entorno', () => {
		expect(MAX_PDF_SIZE_MB).toBeGreaterThan(0);
	});

	it('usa .env.test (no prisma/dev.db) durante las pruebas', () => {
		expect(env.DATABASE_URL).toBe('file:./prisma/test.db');
	});
});
