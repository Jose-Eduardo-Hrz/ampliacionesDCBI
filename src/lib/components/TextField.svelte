<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		id: string;
		name: string;
		label: string;
		type?: string;
		value: string;
		error?: string;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		inputmode?: HTMLInputAttributes['inputmode'];
		maxlength?: number;
		oninput?: () => void;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(),
		error = '',
		required = false,
		autocomplete,
		inputmode,
		maxlength,
		oninput
	}: Props = $props();
</script>

<div class="campo">
	<label for={id}>{label}</label>
	<input
		{id}
		{name}
		{type}
		bind:value
		{required}
		{autocomplete}
		{inputmode}
		{maxlength}
		{oninput}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
	/>
	{#if error}
		<p id="{id}-error" role="alert" class="error-campo">{error}</p>
	{/if}
</div>

<style>
	.campo {
		margin-block-end: var(--espacio-2);
	}
</style>
