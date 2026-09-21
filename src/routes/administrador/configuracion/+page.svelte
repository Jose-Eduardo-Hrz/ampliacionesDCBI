<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Los campos se inicializan una sola vez con la configuracion cargada por
	// el servidor y despues el administrador los edita libremente (untrack
	// evita que Svelte los reescriba si data cambia tras guardar).
	let fechaInicio = $state(untrack(() => data.configuracion?.fechaInicio ?? ''));
	let horaInicio = $state(untrack(() => data.configuracion?.horaInicio ?? ''));
	let fechaFin = $state(untrack(() => data.configuracion?.fechaFin ?? ''));
	let horaFin = $state(untrack(() => data.configuracion?.horaFin ?? ''));
	let enviando = $state(false);
</script>

<svelte:head>
	<title>Configuración del registro</title>
</svelte:head>

<main>
	<Header>
		<span
			>Sesión iniciada como {data.administrador.nombre} ({data.administrador.numeroEconomico})</span
		>
		<a href={resolve('/administrador/datos')}>Volver al panel</a>
	</Header>

	<h1>Configuración del registro</h1>

	<p>
		Define el periodo durante el cual los alumnos pueden iniciar y completar su registro en <code
			>/</code
		>
		y <code>/registro</code>. Fuera de este periodo, ambas páginas quedan cerradas automáticamente.
	</p>

	<form
		method="POST"
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				await update();
				enviando = false;
			};
		}}
	>
		<h2>Fecha y hora de inicio</h2>
		<TextField
			id="fechaInicio"
			name="fechaInicio"
			label="Fecha"
			type="date"
			bind:value={fechaInicio}
			required
		/>
		<TextField
			id="horaInicio"
			name="horaInicio"
			label="Hora"
			type="time"
			bind:value={horaInicio}
			required
		/>

		<h2>Fecha y hora de finalización</h2>
		<TextField
			id="fechaFin"
			name="fechaFin"
			label="Fecha"
			type="date"
			bind:value={fechaFin}
			required
		/>
		<TextField id="horaFin" name="horaFin" label="Hora" type="time" bind:value={horaFin} required />

		{#if form?.error}
			<Alert>{form.error}</Alert>
		{/if}

		{#if form?.success}
			<Alert variant="exito">Configuración guardada correctamente.</Alert>
		{/if}

		<Button type="submit" disabled={enviando}>
			{enviando ? 'Guardando...' : 'Guardar configuración'}
		</Button>
	</form>

	<section class="tarjeta">
		<h2>Periodo actual</h2>
		<p>Estado: <StatusBadge estado={data.estado} tipo="periodo" /></p>

		{#if data.configuracion}
			<dl class="periodo">
				<dt>Disponible desde</dt>
				<dd>{data.configuracion.fechaInicio} {data.configuracion.horaInicio}</dd>
				<dt>Hasta</dt>
				<dd>{data.configuracion.fechaFin} {data.configuracion.horaFin}</dd>
			</dl>
		{:else}
			<p>Todavía no existe una configuración. Guarda un periodo para habilitar el registro.</p>
		{/if}
	</section>
</main>

<style>
	.tarjeta {
		background: var(--color-fondo-alterno);
		padding: var(--espacio-3);
		border-radius: var(--radio-borde);
		margin-block-end: var(--espacio-4);
	}

	.periodo {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--espacio-1) var(--espacio-3);
		margin: 0;
	}

	.periodo dt {
		font-weight: bold;
	}

	.periodo dd {
		margin: 0;
	}
</style>
