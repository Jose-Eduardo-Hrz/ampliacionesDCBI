<script lang="ts">
	import { asset } from '$app/paths';
</script>

<!--
	El manual de identidad (numeral 2.5) fija 4.4 cm / 320 px como tamano
	minimo del conjunto completo. Se respeta ese ancho minimo en pantallas
	normales; solo se permite reducirlo si el viewport es mas angosto que
	eso, para no romper el layout en telefonos muy pequenos.
-->
<img
	src={asset('/branding/logo-uam-azcapotzalco.png')}
	alt="Universidad Autónoma Metropolitana, Unidad Azcapotzalco"
	class="logo"
/>

<style>
	.logo {
		display: block;
		width: min(320px, 100%);
		height: auto;
	}
</style>
