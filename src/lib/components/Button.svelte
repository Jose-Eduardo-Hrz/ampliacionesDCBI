<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'button' | 'submit';
		variant?: 'primario' | 'secundario';
		disabled?: boolean;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		type = 'button',
		variant = 'primario',
		disabled = false,
		onclick,
		children
	}: Props = $props();
</script>

<button {type} class="boton {variant}" {disabled} {onclick}>
	{@render children()}
</button>

<style>
	.boton {
		display: inline-block;
		padding: var(--espacio-2) var(--espacio-4);
		font-size: 1rem;
		font-weight: bold;
		border-radius: var(--radio-borde);
		border: 2px solid transparent;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.boton:disabled {
		cursor: not-allowed;
		opacity: 0.65;
	}

	.primario {
		background: var(--color-uam-azcapotzalco);
		color: var(--color-fondo);
	}

	.primario:not(:disabled):hover {
		background: #a8022a;
	}

	.secundario {
		background: var(--color-fondo);
		color: var(--color-uam-negro);
		border-color: var(--color-uam-negro);
	}

	.secundario:not(:disabled):hover {
		background: var(--color-fondo-alterno);
	}
</style>
