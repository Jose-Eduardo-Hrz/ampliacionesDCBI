<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let numeroEconomico = $state('');
	let password = $state('');
	let enviando = $state(false);
</script>

<svelte:head>
	<title>Acceso administrador</title>
</svelte:head>

<main>
	<Header />

	<h1>Acceso de administrador</h1>

	<form
		method="POST"
		action={resolve('/administrador')}
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				await update();
				enviando = false;
			};
		}}
	>
		<TextField
			id="numeroEconomico"
			name="numeroEconomico"
			label="Número económico"
			autocomplete="username"
			bind:value={numeroEconomico}
			required
		/>

		<TextField
			id="password"
			name="password"
			label="Contraseña"
			type="password"
			autocomplete="current-password"
			bind:value={password}
			required
		/>

		{#if form?.error}
			<Alert>{form.error}</Alert>
		{/if}

		<Button type="submit" disabled={enviando}>
			{enviando ? 'Entrando...' : 'Entrar'}
		</Button>
	</form>
</main>
