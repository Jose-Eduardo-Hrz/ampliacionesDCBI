<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Table from '$lib/components/Table.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let enviandoAlumnos = $state(false);
	let enviandoHorarios = $state(false);

	const formAlumnos = $derived(form?.seccion === 'alumnos' ? form : undefined);
	const formHorarios = $derived(form?.seccion === 'horarios' ? form : undefined);
</script>

<svelte:head>
	<title>Importar información</title>
</svelte:head>

<main>
	<Header>
		<span
			>Sesión iniciada como {data.administrador.nombre} ({data.administrador.numeroEconomico})</span
		>
		<a href={resolve('/administrador/datos')}>Volver al panel</a>
	</Header>

	<h1>Importar información</h1>

	<section class="tarjeta">
		<h2>Subir alumnos con UEAs</h2>
		<form
			method="POST"
			action="?/importarAlumnos"
			enctype="multipart/form-data"
			use:enhance={() => {
				enviandoAlumnos = true;
				return async ({ update }) => {
					await update();
					enviandoAlumnos = false;
				};
			}}
		>
			<div class="campo-archivo">
				<label for="archivoAlumnos">Seleccionar archivo</label>
				<input
					id="archivoAlumnos"
					name="archivoAlumnos"
					type="file"
					accept=".xlsx,.xls,.csv"
					required
				/>
			</div>

			{#if formAlumnos?.error}
				<Alert>{formAlumnos.error}</Alert>
			{/if}

			{#if formAlumnos?.success && formAlumnos.resumen}
				{@const r = formAlumnos.resumen}
				<Alert variant="exito">
					Importación completada: {r.filasLeidas} filas leídas, {r.alumnosCreados} alumnos creados,
					{r.alumnosReutilizados} alumnos reutilizados, {r.ueasCreadas} UEA creadas, {r.ueasReutilizadas}
					UEA reutilizadas, {r.ampliacionesCreadas} ampliaciones creadas, {r.omitidas} omitidas.
				</Alert>

				{#if r.errores.length > 0}
					<p>Filas con errores (no se importaron):</p>
					<Table>
						<table>
							<thead>
								<tr>
									<th>Fila</th>
									<th>Error</th>
								</tr>
							</thead>
							<tbody>
								{#each r.errores as error (error.fila)}
									<tr>
										<td>{error.fila}</td>
										<td>{error.mensaje}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</Table>
				{/if}
			{/if}

			<Button type="submit" disabled={enviandoAlumnos}>
				{enviandoAlumnos ? 'Enviando...' : 'Enviar'}
			</Button>
		</form>
	</section>

	<section class="tarjeta">
		<h2>Subir horarios de UEAs</h2>
		<form
			method="POST"
			action="?/importarHorarios"
			enctype="multipart/form-data"
			use:enhance={() => {
				enviandoHorarios = true;
				return async ({ update }) => {
					await update();
					enviandoHorarios = false;
				};
			}}
		>
			<div class="campo-archivo">
				<label for="archivoHorarios">Seleccionar archivo</label>
				<input
					id="archivoHorarios"
					name="archivoHorarios"
					type="file"
					accept=".xlsx,.xls,.csv"
					required
				/>
			</div>

			{#if formHorarios?.error}
				<Alert>{formHorarios.error}</Alert>
			{/if}

			{#if formHorarios?.success && formHorarios.resumen}
				{@const r = formHorarios.resumen}
				<Alert variant="exito">
					Importación completada: {r.filasLeidas} filas leídas, {r.horariosCreados} horarios creados,
					{r.horariosOmitidos} omitidos.
				</Alert>

				{#if r.errores.length > 0}
					<p>Filas con errores:</p>
					<Table>
						<table>
							<thead>
								<tr>
									<th>Fila</th>
									<th>Error</th>
								</tr>
							</thead>
							<tbody>
								{#each r.errores as error (error.fila)}
									<tr>
										<td>{error.fila}</td>
										<td>{error.mensaje}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</Table>
				{/if}
			{/if}

			<Button type="submit" disabled={enviandoHorarios}>
				{enviandoHorarios ? 'Enviando...' : 'Enviar'}
			</Button>
		</form>
	</section>
</main>

<style>
	.tarjeta {
		background: var(--color-fondo-alterno);
		padding: var(--espacio-3);
		border-radius: var(--radio-borde);
		margin-block-end: var(--espacio-4);
	}
</style>
