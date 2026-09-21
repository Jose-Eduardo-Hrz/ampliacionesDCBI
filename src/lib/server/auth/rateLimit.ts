// Limite de intentos de login en memoria (Fase 28: sin esto, un atacante
// podia intentar fuerza bruta contra el login de administrador sin
// friccion). Al ser un solo proceso Node (no hay multiples instancias
// detras de un balanceador), un Map en memoria es suficiente para esta
// aplicacion institucional pequena; se reinicia si el proceso se reinicia,
// lo cual es aceptable para este nivel de riesgo.
const MAX_INTENTOS = 5;
const VENTANA_BLOQUEO_MS = 5 * 60 * 1000;

interface Registro {
	conteo: number;
	bloqueadoHasta: number;
}

const intentos = new Map<string, Registro>();

export function estaBloqueado(clave: string): boolean {
	const registro = intentos.get(clave);
	if (!registro) return false;

	if (registro.bloqueadoHasta > Date.now()) {
		return true;
	}

	if (registro.bloqueadoHasta !== 0) {
		intentos.delete(clave);
	}

	return false;
}

export function registrarIntentoFallido(clave: string): void {
	const registro = intentos.get(clave) ?? { conteo: 0, bloqueadoHasta: 0 };
	registro.conteo += 1;

	if (registro.conteo >= MAX_INTENTOS) {
		registro.bloqueadoHasta = Date.now() + VENTANA_BLOQUEO_MS;
	}

	intentos.set(clave, registro);
}

export function registrarIntentoExitoso(clave: string): void {
	intentos.delete(clave);
}
