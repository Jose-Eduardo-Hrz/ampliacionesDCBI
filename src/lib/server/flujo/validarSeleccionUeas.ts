import { seleccionUeasSchema } from '$lib/validation/uea';
import { buscarUeasPorIds } from '$lib/server/repositories/uea';
import type { UeaModel } from '$lib/server/generated/prisma/models';

export type ResultadoSeleccionUeas =
	{ ok: true; ueas: UeaModel[] } | { ok: false; razon: 'formato_invalido' | 'uea_inexistente' };

/**
 * Revalida en el servidor una seleccion de UEA que llega del cliente
 * (Fase 15): nunca se confia en que los ids enviados tengan el formato
 * correcto ni en que realmente existan en la base de datos. Se usara desde
 * la accion real de envio (Fase 17).
 */
export async function validarSeleccionUeas(idsCrudos: unknown): Promise<ResultadoSeleccionUeas> {
	const idsValidados = seleccionUeasSchema.safeParse(idsCrudos);
	if (!idsValidados.success) {
		return { ok: false, razon: 'formato_invalido' };
	}

	const ueasEncontradas = await buscarUeasPorIds(idsValidados.data);

	if (ueasEncontradas.length !== idsValidados.data.length) {
		return { ok: false, razon: 'uea_inexistente' };
	}

	return { ok: true, ueas: ueasEncontradas };
}
