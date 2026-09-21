<script lang="ts">
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import Alert from '$lib/components/Alert.svelte';
</script>

<svelte:head>
	<title>Registro exitoso - UAM Azcapotzalco</title>
</svelte:head>

<main>
	<Header />

	<h1>Los datos se han registrado correctamente</h1>

	<Alert variant="exito">Tu solicitud fue guardada correctamente y no puede modificarse.</Alert>

	<p><a href={resolve('/')}>Regresar al inicio</a></p>
</main>
