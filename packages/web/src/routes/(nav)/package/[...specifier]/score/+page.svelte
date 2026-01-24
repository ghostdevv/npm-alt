<script lang="ts">
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import IconLoader from 'virtual:icons/lucide/loader';
	import IconMinus from 'virtual:icons/lucide/minus';
	import IconCheck from 'virtual:icons/lucide/check';
	import Notice from '$lib/components/Notice.svelte';
	import { SCORE_CRITERIA } from '$lib/data/scores';
	import { getPackageScore } from './score.remote';
	import { failed } from '$lib/boundary.svelte';
	import IconX from 'virtual:icons/lucide/x';

	const { data } = $props();

	const scores = $derived(
		getPackageScore({
			name: data.pkg.name,
			version: data.pkg.version,
		}),
	);
</script>

<section>
	<Notice id="" permanent colour="var(--primary)">
		<h4>Here be dragons</h4>

		<p>
			The different points and their respective score value needs a lot of
			work, but this seems like a good starting point.
		</p>
	</Notice>

	{#if scores.error}
		{@render failed(scores.error, () => scores.refresh())}
	{/if}

	<ul>
		{#each SCORE_CRITERIA as criterion}
			<li>
				<div class="marker">
					{#if scores.loading}
						<span class="spin" title="Loading...">
							<IconLoader />
						</span>
					{:else if scores.error || !scores.current}
						<span title="Failed to load score">
							<IconQuestion color="var(--red)" />
						</span>
					{:else}
						{@const score = scores.current[criterion.id]}

						{#if score === 0}
							<span title="Scored 0">
								<IconX color="var(--red)" />
							</span>
						{:else if score === null}
							<span title="Score not available">
								<IconQuestion color="var(--red)" />
							</span>
						{:else if score === criterion.max}
							<span title="Scored maximum">
								<IconCheck color="var(--green)" />
							</span>
						{:else}
							<span title="Scored something, but not maximum">
								<IconMinus color="var(--orange)" />
							</span>
						{/if}
					{/if}
				</div>

				<h5 class="name">{criterion.name}</h5>
				<p class="description">{criterion.description}</p>
				<p class="score">
					{scores.current?.[criterion.id] ?? '?'}/{criterion.max}
				</p>
			</li>
		{/each}
	</ul>
</section>

<style>
	ul {
		list-style: none;

		li {
			display: grid;
			grid-template-columns: max-content 1fr max-content;
			grid-template-rows: max-content max-content;
			grid-template-areas: 'marker name score' '. description description';
			gap: 8px 8px;

			margin: 0px;
			padding-block: 12px;
			border-bottom: 2px solid var(--background-tertiary);

			.marker {
				align-self: center;
				grid-area: marker;
			}

			.name {
				grid-area: name;
			}

			.description {
				grid-area: description;
			}

			.score {
				grid-area: score;
				font-size: 0.9rem;
			}

			> * {
				margin: 0px;
			}

			&:first-of-type {
				padding-block-start: 0px;
			}

			&:last-of-type {
				border-bottom: none;
				padding-block-end: 0px;
			}
		}
	}
</style>
