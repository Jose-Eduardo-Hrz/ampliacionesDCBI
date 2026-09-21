import { z } from 'zod';

const EXTENSIONES_PERMITIDAS = ['.xlsx', '.xls', '.csv'];

function tieneExtensionPermitida(nombre: string): boolean {
	const nombreMinuscula = nombre.toLowerCase();
	return EXTENSIONES_PERMITIDAS.some((extension) => nombreMinuscula.endsWith(extension));
}

/**
 * Mismo enfoque que crearEsquemaArchivoPdf (Fase 7): nunca se confia
 * solamente en el atributo accept del input ni en el Content-Type que
 * declare el navegador. Aqui la extension SI se revisa (ademas del tamano),
 * y el contenido real se valida despues al intentar leerlo (XLSX.read
 * lanza si el archivo no es un Excel/CSV valido) - a diferencia de un PDF,
 * un CSV es texto plano sin una firma binaria fija que inspeccionar.
 */
export const archivoImportacionSchema = z
	.instanceof(File, { message: 'Debes seleccionar un archivo.' })
	.refine((archivo) => archivo.size > 0, { message: 'El archivo está vacío.' })
	.refine((archivo) => tieneExtensionPermitida(archivo.name), {
		message: 'Formato no permitido. Usa un archivo .xlsx, .xls o .csv.'
	});
