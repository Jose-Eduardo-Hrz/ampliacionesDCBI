<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!--
	Envoltura reutilizable para tablas: el scroll horizontal queda contenido
	en la tabla misma cuando no cabe en pantallas angostas (p. ej. el panel
	administrativo), sin que la pagina completa se desborde.
-->
<div class="table-scroll">
	{@render children()}
</div>

<style>
	.table-scroll {
		width: 100%;
		overflow-x: auto;
	}
</style>
