<script lang="ts">
	import { listAuthorPackages } from '$lib/data/search.remote';
	import PackageCard from '$lib/PackageCard.svelte';

	const { params } = $props();

	let author = $derived(params.author);
	let packages = $derived(await listAuthorPackages(author!));
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
