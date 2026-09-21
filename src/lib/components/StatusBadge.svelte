<script lang="ts">
	import {
		ETIQUETAS_ESTADO_ALUMNO,
		ETIQUETAS_ESTADO_AMPLIACION,
		ETIQUETAS_ESTADO_PERIODO
	} from '$lib/estados';

	interface Props {
		estado: string;
		tipo: 'alumno' | 'ampliacion' | 'periodo';
	}

	let { estado, tipo }: Props = $props();

	const ETIQUETAS_POR_TIPO = {
		alumno: ETIQUETAS_ESTADO_ALUMNO,
		ampliacion: ETIQUETAS_ESTADO_AMPLIACION,
		periodo: ETIQUETAS_ESTADO_PERIODO
	} as const;

	const etiqueta = $derived(ETIQUETAS_POR_TIPO[tipo][estado]);
</script>

<span class="insignia {estado}">{etiqueta}</span>

<style>
	/* Colores funcionales de estado (no forman parte de la paleta
	   institucional, que solo define colores de marca). */
	.insignia {
		display: inline-block;
		padding: 0.15em 0.6em;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: bold;
		white-space: nowrap;
	}

	.EnEspera {
		background: #ececec;
		color: #444444;
	}

	.Registrado,
	.Autorizado {
		background: #e2f3e6;
		color: #1e5c2a;
	}

	.Pendiente {
		background: #fdf3d8;
		color: #7a5c00;
	}

	.NoAutorizado {
		background: var(--color-error-fondo);
		color: var(--color-error-texto);
	}

	.PasarOficinaEnlace {
		background: #ffe8d6;
		color: #8a4b00;
	}

	.sin_configurar,
	.cerrado {
		background: #ececec;
		color: #444444;
	}

	.abierto {
		background: #e2f3e6;
		color: #1e5c2a;
	}

	.finalizado {
		background: var(--color-error-fondo);
		color: var(--color-error-texto);
	}
</style>
