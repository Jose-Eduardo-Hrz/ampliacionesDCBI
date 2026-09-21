<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import Alert from '$lib/components/Alert.svelte';

	const titulo = $derived(
		page.status === 404
			? 'Página no encontrada'
			: page.status === 401 || page.status === 403
				? 'Acceso no autorizado'
				: 'Ocurrió un error'
	);
</script>

<svelte:head>
	<title>{titulo} - UAM Azcapotzalco</title>
</svelte:head>

<main>
	<Header />

	<h1>{titulo}</h1>

	<Alert>{page.error?.message ?? 'Ocurrió un error inesperado.'}</Alert>

	{#if page.error?.errorId}
		<p class="referencia">Código de referencia: {page.error.errorId}</p>
	{/if}

	<p><a href={resolve('/')}>Regresar al inicio</a></p>
</main>

<style>
	.referencia {
		font-size: 0.85rem;
		color: var(--color-texto-claro);
	}
</style>
