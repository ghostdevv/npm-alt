<script lang="ts">
	import { searchNPM, type SearchPackage } from '$lib/client/npm-search';
	import PackageCard from '$lib/components/PackageCard.svelte';

	const BATCH_SIZE = 250;

	async function listPackages(author: string) {
		const results: SearchPackage[] = [];

		do {
			const data = await searchNPM(
				`maintainer:${author}`,
				results.length,
				BATCH_SIZE,
			);

			results.push(...data.objects.map((o) => o.package));
		} while (results.length !== 0 && results.length % BATCH_SIZE === 0);

		return results;
	}

	const { params } = $props();

	let author = $derived(params.author);
	let packages = $derived(await listPackages(author));
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
