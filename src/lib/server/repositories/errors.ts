/** El alumno no existe o ya completo su registro; no puede volver a registrarse. */
export class AlumnoNoDisponibleError extends Error {
	constructor() {
		super('El alumno no existe o ya realizo su registro.');
		this.name = 'AlumnoNoDisponibleError';
	}
}

/** Ya existe un administrador con ese numero economico. */
export class AdministradorYaExisteError extends Error {
	constructor() {
		super('Ya existe un administrador con ese numero economico.');
		this.name = 'AdministradorYaExisteError';
	}
}
