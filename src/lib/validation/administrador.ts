import { z } from 'zod';

// La especificacion no define un formato para el numero economico ni
// requisitos de complejidad de contrasena; aqui solo se exige que no vengan
// vacios. La verificacion real (existe / contrasena correcta) es logica de
// negocio del servidor, no de este esquema.
export const loginAdministradorSchema = z.object({
	numeroEconomico: z.string().trim().min(1, 'Ingresa tu numero economico.'),
	password: z.string().min(1, 'Ingresa tu contrasena.')
});

// Para crear una cuenta nueva (no solo para iniciar sesion). El numero
// economico se trata siempre como texto (nunca se convierte a numero):
// puede contener caracteres que sean significativos como tal.
export const crearAdministradorSchema = z.object({
	numeroEconomico: z.string().trim().min(1, 'El numero economico es obligatorio.'),
	nombre: z.string().trim().min(1, 'El nombre del empleado es obligatorio.'),
	password: z.string().min(1, 'La contrasena es obligatoria.')
});
