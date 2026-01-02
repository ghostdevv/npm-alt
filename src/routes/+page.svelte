<script lang="ts">
	import IconSearch from 'virtual:icons/lucide/search';
	import { search } from './search.remote';

	const id = $props.id();
</script>

<form {...search}>
	<label for="search-{id}"> Author/Org Name </label>

	<div class="search">
		<input
			id="search-{id}"
			placeholder="Somebody great"
			{...search.fields.query.as('text')}
		/>

		<button class="icon" title="Search for author/org">
			<IconSearch />
		</button>
	</div>

	{#each search.fields.query.issues() as issue}
		<p class="issue">{issue.message}</p>
	{/each}
</form>

<style>
	form {
		display: grid;
		grid-template-columns: minmax(0, 400px);
		grid-template-rows: auto;
		justify-content: center;
		align-content: center;
		height: 100%;

		.search {
			position: relative;

			button {
				position: absolute;
				inset-block: 0;
				inset-inline-end: 12px;
			}
		}

		.issue {
			color: var(--red);
		}
	}
</style>
