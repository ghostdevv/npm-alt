<script lang="ts">
	import IconLicense from 'virtual:icons/catppuccin/license';
	import type { SearchPackage } from '../data/search.remote';
	import PackageLinks from './PackageLinks.svelte';
	import Tag from './Tag.svelte';

	interface Props {
		pkg: SearchPackage;
	}

	const { pkg }: Props = $props();
</script>

<details class="package" open>
	<summary>
		<a href="/package/{pkg.name}">
			{pkg.name}<span class="version">@{pkg.version}</span>
		</a>
	</summary>

	<p class="description">
		{#if pkg.description}
			{pkg.description}
		{:else}
			<span style="color: var(--text-grey)">
				No description provided.
			</span>
		{/if}
	</p>

	<div class="tags">
		<Tag
			icon={IconLicense}
			label={pkg.license || 'None provided'}
			colour="var(--{pkg.license ? 'green' : 'red'})"
			title="Package License"
		/>

		<PackageLinks links={pkg.links} inspectValue={pkg} />
	</div>
</details>

<style>
	.package {
		width: auto;
		flex-grow: 1;
		flex-shrink: 1;
		padding-inline: 8px;
		padding-block: 8px;
		margin: 0px;

		border: 2px solid var(--background-secondary);
		border-radius: 12px;

		summary {
			margin: 0px;
			font-family: monospace;

			a {
				color: var(--text);
			}

			.version {
				color: var(--text-grey);
			}
		}

		.description {
			margin-top: 0px;
		}

		.tags {
			display: flex;
			flex-flow: row wrap;
			align-items: center;
			gap: 8px;
		}
	}
</style>
