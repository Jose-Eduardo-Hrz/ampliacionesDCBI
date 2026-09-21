import { describe, it, expect } from 'vitest';
import { crearEsquemaArchivoPdf } from './archivo';

const LIMITE = 1024; // 1 KB, para no manejar archivos grandes en la prueba

function archivo(bytes: number[], size = bytes.length, nombre = 'archivo.pdf') {
	const contenido = new Uint8Array(size);
	contenido.set(bytes.slice(0, size));
	return new File([contenido], nombre, { type: 'application/pdf' });
}

describe('crearEsquemaArchivoPdf', () => {
	const esquema = crearEsquemaArchivoPdf(LIMITE);

	it('acepta un PDF valido (firma %PDF-)', async () => {
		const pdf = archivo([0x25, 0x50, 0x44, 0x46, 0x2d, 0x0a], 100);
		const resultado = await esquema.safeParseAsync(pdf);
		expect(resultado.success).toBe(true);
	});

	it('rechaza un JPG aunque se llame .pdf', async () => {
		const jpg = archivo([0xff, 0xd8, 0xff, 0xe0]);
		const resultado = await esquema.safeParseAsync(jpg);
		expect(resultado.success).toBe(false);
	});

	it('rechaza un PNG aunque se llame .pdf', async () => {
		const png = archivo([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const resultado = await esquema.safeParseAsync(png);
		expect(resultado.success).toBe(false);
	});

	it('rechaza un archivo que excede el limite de tamano', async () => {
		const pdfGrande = archivo([0x25, 0x50, 0x44, 0x46, 0x2d], LIMITE + 1);
		const resultado = await esquema.safeParseAsync(pdfGrande);
		expect(resultado.success).toBe(false);
	});

	it('rechaza un archivo vacio', async () => {
		const vacio = archivo([], 0);
		const resultado = await esquema.safeParseAsync(vacio);
		expect(resultado.success).toBe(false);
	});
});
