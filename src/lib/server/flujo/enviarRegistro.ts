import { correoInstitucionalSchema, telefonoSchema } from '$lib/validation/contacto';
import { crearEsquemaArchivoPdf } from '$lib/validation/archivo';
import { MAX_PDF_SIZE_BYTES } from '$lib/server/config';
import {
	verificarDisponibilidadAlumno,
	reclamarAlumnoParaRegistro,
	revertirReclamoAlumno,
	crearAmpliacionesParaAlumno
} from '$lib/server/repositories/alumno';
import { AlumnoNoDisponibleError } from '$lib/server/repositories/errors';
import { validarSeleccionUeas } from './validarSeleccionUeas';
import { guardarDocumentosAlumno, eliminarDocumentosAlumno } from '$lib/server/files/documentos';
import { registroEstaAbierto } from './periodoRegistro';

export interface EnviarRegistroInput {
	matricula: string;
	correo: unknown;
	telefono: unknown;
	idUeas: unknown;
	credencial: unknown;
	solicitud: unknown;
}

export type CampoConError =
	'alumno' | 'correo' | 'telefono' | 'idUeas' | 'credencial' | 'solicitud' | 'periodo';

export type ResultadoEnvioRegistro =
	{ ok: true } | { ok: false; campo: CampoConError; mensaje: string };

const MENSAJE_YA_REGISTRADO = 'El alumno ya realizó la solicitud.';
const MENSAJE_PERIODO_CERRADO = 'El periodo de registro ya terminó.';

/**
 * Orquesta el flujo completo de envio del registro (Fase 17).
 *
 * El orden de los pasos 9-12 de la especificacion original (crear
 * directorio, guardar archivos, actualizar alumno, crear ampliaciones) se
 * reordeno deliberadamente: la reclamacion atomica del alumno ("actualizar
 * alumno") ocurre ANTES de guardar los archivos, no despues. Motivo (ver
 * discusion con el usuario en la Fase 17): con el orden original, dos envios
 * concurrentes para el mismo alumno podian pasar ambos la verificacion previa
 * (una simple lectura) y empezar a escribir archivos en la MISMA carpeta
 * (matricula_nombre) antes de que la base de datos decidiera cual gana; el
 * que pierde ejecutaba el rollback de archivos y borraba la carpeta
 * completa, incluyendo los archivos que el ganador ya habia guardado. Al
 * mover la reclamacion atomica antes de tocar el sistema de archivos, solo
 * una solicitud puede ganarla, asi que solo esa llega a escribir archivos:
 * la condicion de carrera queda eliminada de raiz. El resultado visible para
 * el alumno no cambia.
 */
export async function enviarRegistro(input: EnviarRegistroInput): Promise<ResultadoEnvioRegistro> {
	// 0. Condicion adicional (seccion 18 de /administrador/configuracion): el
	// periodo debe estar abierto en el momento exacto de guardar, no solo
	// cuando se cargo /registro (seccion 19 - evita que un formulario abierto
	// antes del cierre se pueda enviar despues). No reemplaza ninguna regla
	// existente de disponibilidad del alumno, es una condicion mas.
	if (!(await registroEstaAbierto())) {
		return { ok: false, campo: 'periodo', mensaje: MENSAJE_PERIODO_CERRADO };
	}

	// 2-3. Validar alumno / que no este registrado previamente. Pre-chequeo
	// rapido (simple lectura) para rechazar temprano el caso comun sin
	// ejecutar el resto de las validaciones; NO es la autoridad final.
	const disponibilidad = await verificarDisponibilidadAlumno(input.matricula);
	if (disponibilidad.estado !== 'disponible') {
		return {
			ok: false,
			campo: 'alumno',
			mensaje:
				disponibilidad.estado === 'no_existe'
					? 'El alumno no tiene autorización para solicitar ampliación.'
					: MENSAJE_YA_REGISTRADO
		};
	}
	const alumno = disponibilidad.alumno;

	// 4. Validar correo
	const correoValidado = correoInstitucionalSchema.safeParse(input.correo);
	if (!correoValidado.success) {
		return { ok: false, campo: 'correo', mensaje: correoValidado.error.issues[0].message };
	}

	// 5. Validar telefono
	const telefonoValidado = telefonoSchema.safeParse(input.telefono);
	if (!telefonoValidado.success) {
		return { ok: false, campo: 'telefono', mensaje: telefonoValidado.error.issues[0].message };
	}

	// 6. Validar UEA (formato + existencia real en base de datos)
	const seleccionValidada = await validarSeleccionUeas(input.idUeas);
	if (!seleccionValidada.ok) {
		return {
			ok: false,
			campo: 'idUeas',
			mensaje:
				seleccionValidada.razon === 'formato_invalido'
					? 'Selecciona una o varias UEA válidas, sin repetir.'
					: 'Una o más UEA seleccionadas ya no existen.'
		};
	}

	// 7-8. Validar PDF credencial / solicitud (firma real del archivo + tamaño)
	const esquemaPdf = crearEsquemaArchivoPdf(MAX_PDF_SIZE_BYTES);

	const credencialValidada = await esquemaPdf.safeParseAsync(input.credencial);
	if (!credencialValidada.success) {
		return { ok: false, campo: 'credencial', mensaje: credencialValidada.error.issues[0].message };
	}

	const solicitudValidada = await esquemaPdf.safeParseAsync(input.solicitud);
	if (!solicitudValidada.success) {
		return { ok: false, campo: 'solicitud', mensaje: solicitudValidada.error.issues[0].message };
	}

	// Reclamacion atomica (contenido del paso 11 "actualizar alumno",
	// adelantado antes de tocar archivos por la razon explicada arriba).
	try {
		await reclamarAlumnoParaRegistro({
			matricula: alumno.matricula,
			correo: correoValidado.data,
			telefono: telefonoValidado.data
		});
	} catch (error) {
		if (error instanceof AlumnoNoDisponibleError) {
			return { ok: false, campo: 'alumno', mensaje: MENSAJE_YA_REGISTRADO };
		}
		throw error;
	}

	// 9-10. Crear directorio + guardar archivos
	try {
		await guardarDocumentosAlumno({
			matricula: alumno.matricula,
			nombre: alumno.nombre,
			credencial: credencialValidada.data,
			solicitud: solicitudValidada.data
		});
	} catch (error) {
		await revertirReclamoAlumno(alumno.matricula);
		throw error;
	}

	// 12. Crear ampliaciones
	try {
		await crearAmpliacionesParaAlumno(
			alumno.matricula,
			seleccionValidada.ueas.map((uea) => uea.id)
		);
	} catch (error) {
		// Rollback completo: la reclamacion y los archivos ya se guardaron
		// pero crear las ampliaciones fallo.
		await eliminarDocumentosAlumno(alumno.matricula, alumno.nombre);
		await revertirReclamoAlumno(alumno.matricula);
		throw error;
	}

	// 13. Confirmar operacion
	return { ok: true };
}
