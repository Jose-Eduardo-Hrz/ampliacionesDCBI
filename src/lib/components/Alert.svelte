<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'error' | 'exito';
		children: Snippet;
	}

	let { variant = 'error', children }: Props = $props();
</script>

<p role="alert" class="alerta {variant}">
	{@render children()}
</p>

<style>
	.alerta {
		padding: var(--espacio-2) var(--espacio-3);
		border-radius: var(--radio-borde);
		border: 1px solid;
		margin-block: var(--espacio-3);
	}

	.error {
		background: var(--color-error-fondo);
		border-color: var(--color-error-borde);
		color: var(--color-error-texto);
	}

	.exito {
		background: var(--color-exito-fondo);
		border-color: var(--color-exito-borde);
		color: var(--color-exito-texto);
	}
</style>
