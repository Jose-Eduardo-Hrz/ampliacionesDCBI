// Los enums de Prisma se exponen en el cliente como identificadores sin
// espacios (p. ej. "NoAutorizado"); estas etiquetas son la version legible
// que se muestra en la interfaz. El texto real de negocio vive en la base
// de datos via @map (ver prisma/schema.prisma), esto es solo presentacion.

export const ETIQUETAS_ESTADO_ALUMNO: Record<string, string> = {
	Registrado: 'Registrado',
	EnEspera: 'En espera'
};

export const ETIQUETAS_ESTADO_AMPLIACION: Record<string, string> = {
	Pendiente: 'Pendiente',
	Autorizado: 'Autorizado',
	NoAutorizado: 'No Autorizado',
	PasarOficinaEnlace: 'Pasar a la oficina de enlace'
};

// Estado del periodo de /administrador/configuracion (ver
// src/lib/server/flujo/periodoRegistro.ts para la logica que lo calcula).
export const ETIQUETAS_ESTADO_PERIODO: Record<string, string> = {
	sin_configurar: 'Sin configurar',
	cerrado: 'Cerrado',
	abierto: 'Abierto',
	finalizado: 'Finalizado'
};
