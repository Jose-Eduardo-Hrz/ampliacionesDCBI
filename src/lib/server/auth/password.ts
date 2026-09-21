import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hashing de contraseñas con scrypt (nativo de Node, sin dependencias externas).
 * Formato almacenado: "scrypt:<saltHex>:<hashHex>" para permitir migrar de
 * algoritmo en el futuro sin romper contraseñas ya guardadas.
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
	return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [algorithm, saltHex, keyHex] = storedHash.split(':');
	if (algorithm !== 'scrypt' || !saltHex || !keyHex) {
		return false;
	}

	const salt = Buffer.from(saltHex, 'hex');
	const storedKey = Buffer.from(keyHex, 'hex');
	const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

	if (derivedKey.length !== storedKey.length) {
		return false;
	}

	return timingSafeEqual(derivedKey, storedKey);
}
