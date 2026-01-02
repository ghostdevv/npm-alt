<script lang="ts">
	import Expansion from '$lib/expansions/Expansion.svelte';
	import IconSearch from 'virtual:icons/lucide/search';

	const id = $props.id();
</script>

<div>
	<Expansion />

	<form action="/search">
		<label for="search-{id}" class="sr-only"> Search NPM </label>

		<div class="search">
			<input
				type="search"
				name="q"
				id="search-{id}"
				placeholder="Search for...?"
			/>

			<button class="icon" title="Search NPM">
				<IconSearch />
			</button>
		</div>
	</form>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 22px;
		height: 80%;

		form,
		.search {
			width: 100%;
			max-width: 500px;
		}

		.search {
			position: relative;

			button {
				position: absolute;
				inset-block: 0;
				inset-inline-end: 12px;
			}
		}
	}
</style>
