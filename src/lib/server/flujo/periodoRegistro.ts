import { obtenerConfiguracionRegistro } from '$lib/server/repositories/configuracionRegistro';

export type EstadoPeriodoRegistro = 'sin_configurar' | 'cerrado' | 'abierto' | 'finalizado';

export interface ConfiguracionPeriodo {
	inicio: Date;
	fin: Date;
}

/**
 * Unica fuente de verdad de si / y /registro deben permitir a un alumno
 * iniciar/completar su registro (secciones 6 y 10). La aplicacion no define
 * una zona horaria explicita (no hay TZ ni libreria de fechas en el
 * proyecto): "inicio"/"fin" son objetos Date que se comparan directamente
 * contra "ahora" (tambien un Date), ambos evaluados en la hora local del
 * proceso de Node que ejecuta el servidor - igual que el resto de la app
 * (ver logging.ts). No hay estado "cerrado" persistido en base de datos: se
 * recalcula en cada peticion a partir de inicio/fin y la hora actual, sin
 * tareas en segundo plano.
 */
export function calcularEstadoPeriodo(
	configuracion: ConfiguracionPeriodo | null,
	ahora: Date = new Date()
): EstadoPeriodoRegistro {
	if (!configuracion) return 'sin_configurar';
	if (ahora < configuracion.inicio) return 'cerrado';
	if (ahora >= configuracion.fin) return 'finalizado';
	return 'abierto';
}

/**
 * Punto unico reutilizado por / (mostrar/ocultar el formulario de entrada),
 * /registro (mostrar/ocultar el formulario de registro) y enviarRegistro (el
 * guardado final): evita duplicar la comparacion de fechas en cada lugar.
 */
export async function registroEstaAbierto(ahora: Date = new Date()): Promise<boolean> {
	const configuracion = await obtenerConfiguracionRegistro();
	return calcularEstadoPeriodo(configuracion, ahora) === 'abierto';
}
