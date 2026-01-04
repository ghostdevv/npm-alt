<script lang="ts">
	import { getPackageVersions } from '$lib/data/package.remote.js';
	import IconCalendar from 'virtual:icons/lucide/calendar';
	import { format as formatBytes } from '@std/fmt/bytes';
	import IconWeight from 'virtual:icons/lucide/weight';
	import IconScale from 'virtual:icons/lucide/scale';
	import IconTrash from 'virtual:icons/lucide/trash';
	import { formatDistanceToNow } from 'date-fns';

	const { params } = $props();
	const versions = $derived(await getPackageVersions(params.specifier));
</script>

<section>
	<ol>
		{#each versions as pkv}
			<li class={[pkv.groupState]}>
				{#if pkv.groupState === 'deprecated'}
					<div class="group" title="This version is deprecated">
						<IconTrash />
					</div>
				{:else}
					<p
						class="group"
						title={pkv.groupState === 'lead'
							? 'Latest version in range'
							: undefined}
					>
						{pkv.group}
					</p>
				{/if}

				<p class="version">{pkv.version}</p>

				<p>
					<IconCalendar />
					{#if pkv.publishedAt}
						{formatDistanceToNow(pkv.publishedAt, {
							addSuffix: true,
						})}
					{:else}
						???
					{/if}
				</p>

				<p>
					<IconWeight />
					{#if pkv.unpackedSize}
						{formatBytes(pkv.unpackedSize)}
					{:else}
						???
					{/if}
				</p>

				<p>
					<IconScale />
					{pkv.license ?? '???'}
				</p>
			</li>
		{/each}
	</ol>
</section>

<style>
	ol {
		list-style: none;

		li {
			display: grid;
			grid-auto-columns: max-content;
			grid-template-rows: max-content max-content;
			gap: 0px 18px;
			width: 100%;

			margin-block: 12px;
			padding-block: 8px;
			padding-inline: 12px;

			background-color: var(--background-secondary);
			border: 2px solid var(--background-tertiary);
			border-radius: 12px;

			&.deprecated,
			&.deprecated .group {
				border-color: var(--red);
				background-color: color(from var(--red) srgb r g b / 0.2);
			}

			&.lead,
			&.lead .group {
				border-color: var(--green);
				background-color: color(from var(--green) srgb r g b / 0.2);
			}

			.version,
			.group {
				font-size: 1.2rem;
			}

			.group {
				display: grid;
				place-items: center;

				grid-row: 1 / span 2;
				align-self: center;

				width: 3.5rem;
				height: 3.5rem;
				border: 2px solid var(--background-tertiary);
				background-color: var(--background-primary);
				border-radius: 100%;
			}

			p:not(.version, .group) {
				font-size: 0.9rem;
				display: flex;
				align-items: center;
				gap: 6px;

				grid-row: 2;

				& :global(svg) {
					width: 1.1em;
					height: 1.1em;
				}
			}

			&:first-child {
				margin-block-start: 0px;
			}
		}
	}
</style>
