<script lang="ts">
	import { resolve } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Table from '$lib/components/Table.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Panel administrativo</title>
</svelte:head>

<main>
	<Header>
		<span
			>Sesión iniciada como {data.administrador.nombre} ({data.administrador.numeroEconomico})</span
		>
		<a href={resolve('/administrador/cuentas')}>Crear cuenta de administrador</a>
		<a href={resolve('/administrador/registro')}>Importar información</a>
		<a href={resolve('/api/administrador/excel')}>Descargar información actual</a>
		<a href={resolve('/administrador/configuracion')}>Configuración del registro</a>
		<form method="POST" action="?/cerrarSesion">
			<Button type="submit" variant="secundario">Cerrar sesión</Button>
		</form>
	</Header>

	<h1>Panel administrativo</h1>

	<Table>
		<table>
			<thead>
				<tr>
					<th>Matrícula</th>
					<th>Nombre</th>
					<th>UEA</th>
					<th>Horario</th>
					<th>Credencial</th>
					<th>Solicitud</th>
					<th>Estado</th>
				</tr>
			</thead>
			<tbody>
				{#each data.alumnos as alumno (alumno.matricula)}
					{#if alumno.ampliaciones.length === 0}
						<tr>
							<td>{alumno.matricula}</td>
							<td>{alumno.nombre}</td>
							<td colspan="4">Sin registrar</td>
							<td><StatusBadge estado={alumno.estado} tipo="alumno" /></td>
						</tr>
					{:else}
						{#each alumno.ampliaciones as ampliacion, i (ampliacion.id)}
							<tr>
								{#if i === 0}
									<td rowspan={alumno.ampliaciones.length}>{alumno.matricula}</td>
									<td rowspan={alumno.ampliaciones.length}>{alumno.nombre}</td>
								{/if}
								<td
									>{ampliacion.uea.clave} — {ampliacion.uea.nombre} (Grupo {ampliacion.uea
										.grupo})</td
								>
								<td>
									<ul>
										{#each ampliacion.uea.horarios as horario (horario.id)}
											<li>{horario.dia} {horario.inicio}–{horario.fin}</li>
										{/each}
									</ul>
								</td>
								{#if i === 0}
									<td rowspan={alumno.ampliaciones.length}>
										<a
											href={resolve('/api/documentos/[matricula]/credencial', {
												matricula: alumno.matricula
											})}>Descargar</a
										>
									</td>
									<td rowspan={alumno.ampliaciones.length}>
										<a
											href={resolve('/api/documentos/[matricula]/solicitud', {
												matricula: alumno.matricula
											})}>Descargar</a
										>
									</td>
								{/if}
								{#if i === 0}
									<td rowspan={alumno.ampliaciones.length}>
										<StatusBadge estado={alumno.estado} tipo="alumno" />
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				{/each}
			</tbody>
		</table>
	</Table>
</main>
