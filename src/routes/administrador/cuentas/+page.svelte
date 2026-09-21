<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let numeroEconomico = $state('');
	let nombre = $state('');
	let password = $state('');
	let enviando = $state(false);
</script>

<svelte:head>
	<title>Crear cuenta de administrador</title>
</svelte:head>

<main>
	<Header>
		<span
			>Sesión iniciada como {data.administrador.nombre} ({data.administrador.numeroEconomico})</span
		>
		<a href={resolve('/administrador/datos')}>Volver al panel</a>
	</Header>

	<h1>Crear cuenta de administrador</h1>

	<form
		method="POST"
		action={resolve('/administrador/cuentas')}
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				await update();
				enviando = false;
				if (form?.success) {
					numeroEconomico = '';
					nombre = '';
					password = '';
				}
			};
		}}
	>
		<TextField
			id="numeroEconomico"
			name="numeroEconomico"
			label="Número económico"
			autocomplete="off"
			bind:value={numeroEconomico}
			required
		/>

		<TextField
			id="nombre"
			name="nombre"
			label="Nombre del empleado"
			autocomplete="off"
			bind:value={nombre}
			required
		/>

		<TextField
			id="password"
			name="password"
			label="Contraseña"
			type="password"
			autocomplete="new-password"
			bind:value={password}
			required
		/>

		{#if form?.error}
			<Alert>{form.error}</Alert>
		{/if}

		{#if form?.success}
			<Alert variant="exito">Cuenta de administrador creada correctamente.</Alert>
		{/if}

		<Button type="submit" disabled={enviando}>
			{enviando ? 'Guardando...' : 'Guardar'}
		</Button>
	</form>
</main>
