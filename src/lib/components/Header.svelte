<script lang="ts">
	import Logo from './Logo.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<header class="encabezado">
	<Logo />
	{#if children}
		<div class="extra">
			{@render children()}
		</div>
	{/if}
</header>

<style>
	.encabezado {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--espacio-3);
		padding-block-end: var(--espacio-3);
		border-bottom: 3px solid var(--color-uam-azcapotzalco);
		margin-block-end: var(--espacio-3);
	}

	.extra {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--espacio-3);
		font-size: 0.9rem;
		color: var(--color-texto-claro);
	}
</style>
