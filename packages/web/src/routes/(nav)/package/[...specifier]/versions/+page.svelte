<script lang="ts">
	import IconCalendar from 'virtual:icons/lucide/calendar';
	import { format as formatBytes } from '@std/fmt/bytes';
	import { getPackageVersions } from './versions.remote';
	import type { PackageVersion } from '$lib/data/types';
	import IconWeight from 'virtual:icons/lucide/weight';
	import IconScale from 'virtual:icons/lucide/scale';
	import IconTrash from 'virtual:icons/lucide/trash';
	import { formatDistanceToNow } from 'date-fns';
	import { resolve } from '$app/paths';

	const { params, data } = $props();

	const { distTags, versions } = $derived(
		await getPackageVersions(params.specifier),
	);

	function getTitle(pkv: PackageVersion) {
		if (pkv.version === data.pkg.version) {
			return 'Currently selected version.';
		}

		if (pkv.groupState === 'deprecated') {
			return 'This version is deprecated.';
		}

		if (pkv.groupState === 'lead') {
			return 'Latest version in range.';
		}
	}
</script>

<section>
	<h4>Dist Tags</h4>

	<table>
		<thead>
			<tr>
				<th>Tag</th>
				<th>Version</th>
			</tr>
		</thead>

		<tbody>
			{#each distTags as tag}
				<tr class="tag" class:current={tag.satisfied}>
					<td>
						<a
							href={resolve(
								'/(nav)/package/[...specifier]/overview',
								{ specifier: `${data.pkg.name}@${tag.name}` },
							)}
						>
							{tag.name}
						</a>
					</td>
					<td><code>{tag.version}</code></td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section>
	<h4>{versions.length} Versions</h4>

	<div class="legend">
		<div class="key lead">
			<div class="vis lead"></div>
			<p>Latest version in major/minor</p>
		</div>

		<div class="key">
			<div class="vis deprecated"></div>
			<p>Version is deprecated</p>
		</div>

		<div class="key">
			<div class="vis current"></div>
			<p>Currently selected version</p>
		</div>
	</div>

	<ol>
		{#each versions as pkv}
			<li>
				<a
					data-sveltekit-preload-data="tap"
					href={resolve('/(nav)/package/[...specifier]/overview', {
						specifier: `${data.pkg.name}@${pkv.version}`,
					})}
					class={[
						pkv.groupState,
						pkv.version === data.pkg.version && 'current',
					]}
					title={getTitle(pkv)}
				>
					{#if pkv.groupState === 'deprecated'}
						<div class="group">
							<IconTrash />
						</div>
					{:else}
						<p class="group">
							{pkv.group}
						</p>
					{/if}

					<p class="version">{pkv.version}</p>

					<p>
						<IconCalendar />
						{formatDistanceToNow(pkv.publishedAt, {
							addSuffix: true,
						})}
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
				</a>
			</li>
		{/each}
	</ol>
</section>

<style>
	.deprecated {
		--border: color(from var(--red) srgb r g b / 0.75);
		--background: color(from var(--red) srgb r g b / 0.15);
	}

	.lead {
		--border: color(from var(--green) srgb r g b / 0.75);
		--background: color(from var(--green) srgb r g b / 0.15);
	}

	.current {
		--border: color(from var(--primary) srgb r g b / 0.75);
		--background: color(from var(--primary) srgb r g b / 0.15);
	}

	table {
		margin-block-start: 16px;

		td,
		th {
			padding: 8px;
		}

		a {
			color: var(--text);
			text-decoration: underline;
		}

		tr.current {
			background-color: var(--background);

			td {
				border-color: var(--border);
			}
		}

		tr:has(+ tr.current) td,
		&:has(tr.current) thead tr th {
			border-bottom: 0px;
		}
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 22px;

		margin-block: 16px;

		.key {
			display: flex;
			align-items: center;
			gap: 8px;

			font-size: 0.9em;

			p {
				margin: 0px;
			}

			.vis {
				width: 10px;
				height: 10px;
				border-radius: 100%;
				background-color: var(--border);
			}
		}
	}

	ol {
		list-style: none;

		a {
			display: grid;
			grid-auto-columns: max-content;
			grid-template-rows: max-content max-content;
			gap: 0px 18px;
			width: 100%;

			margin-block: 12px;
			padding-block: 8px;
			padding-inline: 12px;

			background-color: var(--background, var(--background-secondary));
			transition: background-color 0.2s ease-in-out;
			border: 2px solid var(--border, var(--background-tertiary));
			border-radius: 12px;
			color: var(--text);

			&:active,
			&:hover {
				text-decoration: none;
				/* prettier-ignore */
				background-color: color(
					from var(--background, var(--background-secondary)) srgb r g b / 0.3
				);
			}

			&:focus-visible {
				outline: 2px solid var(--border, var(--primary));
				outline-offset: 2px;
				text-decoration: none;
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
				border: 2px solid var(--border, var(--background-tertiary));
				background-color: var(--background, var(--background-primary));
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
