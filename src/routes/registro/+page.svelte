<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { correoInstitucionalSchema, telefonoSchema } from '$lib/validation/contacto';
	import Header from '$lib/components/Header.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Table from '$lib/components/Table.svelte';
	import FileUploadPdf from '$lib/components/FileUploadPdf.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let correo = $state('');
	let telefono = $state('');
	let errorCorreo = $state('');
	let errorTelefono = $state('');
	let errorSeleccion = $state('');
	const seleccionadas = new SvelteSet<number>();
	let credencial = $state<File | null>(null);
	let solicitud = $state<File | null>(null);
	let enviando = $state(false);

	function validarCorreo() {
		const resultado = correoInstitucionalSchema.safeParse(correo);
		errorCorreo = resultado.success ? '' : resultado.error.issues[0].message;
	}

	function validarTelefono() {
		const resultado = telefonoSchema.safeParse(telefono);
		errorTelefono = resultado.success ? '' : resultado.error.issues[0].message;
	}

	function alternarSeleccion(idUea: number) {
		if (seleccionadas.has(idUea)) {
			seleccionadas.delete(idUea);
		} else {
			seleccionadas.add(idUea);
		}
	}

	function validarAntesDeEnviar(): boolean {
		validarCorreo();
		validarTelefono();
		// errorSeleccion = seleccionadas.size === 0 ? 'Debes seleccionar al menos una UEA.' : '';

		return (
			!errorCorreo && !errorTelefono && !errorSeleccion && credencial !== null && solicitud !== null
		);
	}
</script>

<svelte:head>
	<title>Registro de solicitud - UAM Azcapotzalco</title>
</svelte:head>

<main>
	<Header />

	{#if data.yaRegistrado}
		<h1>Ya has completado tu registro</h1>
		<p>Tu solicitud ya fue enviada anteriormente y no puede modificarse.</p>
		<p><a href={resolve('/')}>Regresar al inicio</a></p>
	{:else if data.periodoCerrado}
		<h1>Registro de solicitud de ampliación</h1>
		<Alert>El periodo de registro no está disponible actualmente.</Alert>
		<p><a href={resolve('/')}>Regresar al inicio</a></p>
	{:else}
		<h1>Registro de solicitud de ampliación</h1>

		<dl class="datos-alumno">
			<dt>Nombre</dt>
			<dd>{data.alumno.nombre}</dd>
			<dt>Matrícula</dt>
			<dd>{data.alumno.matricula}</dd>
		</dl>

		{#if form?.error}
			<Alert>{form.error}</Alert>
		{/if}

		<form
			method="POST"
			action={resolve('/registro')}
			enctype="multipart/form-data"
			use:enhance={({ cancel }) => {
				if (!validarAntesDeEnviar()) {
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
				id="correo"
				name="correo"
				label="Correo institucional"
				type="email"
				autocomplete="email"
				bind:value={correo}
				oninput={validarCorreo}
				error={errorCorreo}
				required
			/>

			<TextField
				id="telefono"
				name="telefono"
				label="Teléfono"
				type="tel"
				inputmode="numeric"
				maxlength={10}
				autocomplete="tel"
				bind:value={telefono}
				oninput={validarTelefono}
				error={errorTelefono}
				required
			/>

			<h2>UEA disponibles para ampliación</h2>
			<Table>
				<table>
					<thead>
						<tr>
							<th>Clave</th>
							<th>Nombre</th>
							<th>Grupo</th>
							<th>Ampliación</th>
							<th>Horario</th>
							<th>Seleccionar</th>
						</tr>
					</thead>
					<tbody>
						{#each data.ueas as uea (uea.id)}
							<tr>
								<td>{uea.clave}</td>
								<td>{uea.nombre}</td>
								<td>{uea.grupo}</td>
								<td>
									<ul>
										{#each uea.horarios as horario (horario.id)}
											<li>{horario.dia} {horario.inicio}–{horario.fin}</li>
										{/each}
									</ul>
								</td>
								<td> <StatusBadge estado={uea.estado.toString()} tipo="ampliacion" /> </td>
								<td>
									{#if uea.estado.toString() === 'Autorizado'}
										<input
											type="checkbox"
											name="idUeas"
											value={uea.id}
											checked={seleccionadas.has(uea.id)}
											onchange={() => alternarSeleccion(uea.id)}
											aria-label={`Seleccionar ${uea.nombre} grupo ${uea.grupo}`}
										/>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</Table>
			{#if errorSeleccion}
				<Alert>{errorSeleccion}</Alert>
			{/if}

			<h2>Documentos</h2>
			<FileUploadPdf
				id="credencial"
				name="credencial"
				label="Credencial"
				maxSizeMb={data.maxPdfSizeMb}
				onchange={(archivo) => (credencial = archivo)}
			/>
			<FileUploadPdf
				id="solicitud"
				name="solicitud"
				label="Solicitud"
				maxSizeMb={data.maxPdfSizeMb}
				onchange={(archivo) => (solicitud = archivo)}
			/>

			<Button type="submit" disabled={enviando}>
				{enviando ? 'Enviando...' : 'Enviar solicitud'}
			</Button>
		</form>
	{/if}
</main>

<style>
	.datos-alumno {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--espacio-1) var(--espacio-3);
		background: var(--color-fondo-alterno);
		padding: var(--espacio-3);
		border-radius: var(--radio-borde);
		margin-block-end: var(--espacio-3);
	}

	.datos-alumno dt {
		font-weight: bold;
	}

	.datos-alumno dd {
		margin: 0;
	}
</style>
