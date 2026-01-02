<script lang="ts">
	import PackageCard from '$lib/PackageCard.svelte';
	import type { Component } from 'svelte';
	import { listPackages } from './author';
	import { page } from '$app/state';

	let author = $derived(page.params.author);
	let packages = $derived(await listPackages(author!));
</script>

<section>
	<h1>{author}</h1>
	<p>Found a total of {packages.length} packages</p>
</section>

<section>
	<div class="packages">
		{#each packages as pkg}
			<PackageCard {pkg} />
		{/each}
	</div>
</section>

<style>
	.packages {
		display: flex;
		flex-flow: row wrap;
		gap: 8px;
	}
</style>
