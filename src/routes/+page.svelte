<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { matriculaSchema } from '$lib/validation/matricula';
	import Header from '$lib/components/Header.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let matricula = $state('');
	let errorLocal = $state('');
	let enviando = $state(false);

	function validarLocal(): boolean {
		const resultado = matriculaSchema.safeParse(matricula);
		errorLocal = resultado.success ? '' : resultado.error.issues[0].message;
		return resultado.success;
	}
</script>

<svelte:head>
	<title>Solicitud de ampliación de cupo - UAM Azcapotzalco</title>
</svelte:head>

<main>
	<Header />

	<h1>Solicitud de ampliación de cupo de grupo</h1>

	<p>
		Este sistema permite a los alumnos de la Unidad Azcapotzalco solicitar la ampliación de cupo en
		una o varias Unidades de Enseñanza Aprendizaje (UEA).
	</p>

	<section>
		<h2>Instrucciones</h2>
		<ol>
			<li>Introduce tu matrícula (10 dígitos) y presiona "Continuar".</li>
			<li>
				Si tu matrícula es válida y aún no has enviado tu solicitud, podrás continuar al registro.
			</li>
			<li>
				En el registro deberás capturar tu correo institucional, tu teléfono, seleccionar las UEA y
				adjuntar tu credencial y tu solicitud en PDF.
			</li>
			<li>Una vez enviada tu solicitud, no podrás modificarla.</li>
		</ol>
	</section>

	{#if data.registroAbierto}
		<form
			method="POST"
			action={resolve('/')}
			use:enhance={({ cancel }) => {
				if (!validarLocal()) {
					cancel();
					return;
				}
				enviando = true;
				return async ({ update }) => {
					await update();
					enviando = false;
				};
			}}
		>
			<TextField
				id="matricula"
				name="matricula"
				label="Matrícula"
				inputmode="numeric"
				maxlength={10}
				autocomplete="off"
				bind:value={matricula}
				oninput={validarLocal}
				error={errorLocal}
				required
			/>

			{#if !errorLocal && form?.error}
				<Alert>{form.error}</Alert>
			{/if}

			<Button type="submit" disabled={enviando}>
				{enviando ? 'Validando...' : 'Continuar'}
			</Button>
		</form>
	{:else}
		<Alert>El periodo de registro no está disponible actualmente.</Alert>
	{/if}
</main>
