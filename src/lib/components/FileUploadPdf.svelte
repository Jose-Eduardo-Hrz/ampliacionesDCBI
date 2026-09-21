<script lang="ts">
	import { crearEsquemaArchivoPdf } from '$lib/validation/archivo';

	interface Props {
		id: string;
		name: string;
		label: string;
		maxSizeMb: number;
		onchange?: (archivo: File | null) => void;
	}

	let { id, name, label, maxSizeMb, onchange }: Props = $props();

	let archivo = $state<File | null>(null);
	let error = $state('');
	let validando = $state(false);

	function formatearTamano(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	async function manejarSeleccion(event: Event) {
		const input = event.target as HTMLInputElement;
		const seleccionado = input.files?.[0] ?? null;
		archivo = seleccionado;
		error = '';

		if (!seleccionado) {
			onchange?.(null);
			return;
		}

		validando = true;
		// Mismo esquema (Fase 7) que revalidara el servidor: nunca se confia
		// unicamente en accept="application/pdf" ni en esta comprobacion del
		// cliente, pero da retroalimentacion inmediata sin esperar al envio.
		const esquema = crearEsquemaArchivoPdf(maxSizeMb * 1024 * 1024);
		const resultado = await esquema.safeParseAsync(seleccionado);
		validando = false;

		if (!resultado.success) {
			error = resultado.error.issues[0].message;
			onchange?.(null);
			return;
		}

		onchange?.(seleccionado);
	}
</script>

<div class="campo-archivo">
	<label for={id}>{label}</label>
	<input {id} {name} type="file" accept="application/pdf" onchange={manejarSeleccion} required />

	{#if validando}
		<p class="detalle">Validando archivo…</p>
	{:else if archivo && !error}
		<p class="detalle">{archivo.name} ({formatearTamano(archivo.size)})</p>
	{/if}

	{#if error}
		<p role="alert" class="error-campo">{error}</p>
	{/if}
</div>

<style>
	.detalle {
		font-size: 0.9rem;
		color: var(--color-texto-claro);
		margin: var(--espacio-1) 0 0;
	}
</style>
