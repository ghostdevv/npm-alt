<script lang="ts">
	import type { SearchPackage } from '$lib/client/npm-search';
	import IconLicense from 'virtual:icons/catppuccin/license';
	import PackageLinks from './PackageLinks.svelte';
	import Tag from './Tag.svelte';

	interface Props {
		name: string;
		version: string;
		description?: string;
		license?: string;
		optional?: boolean;
		registry?: boolean;
		links?: SearchPackage['links'];
	}

	const props: Props = $props();

	let {
		name,
		version,
		description,
		license,
		links,
		optional = false,
		registry = true,
	} = $derived(props);
</script>

<details class="package" open>
	<summary>
		{#snippet summary()}
			{name}<span class="version">@{version}</span>

			{#if optional}
				<span class="optional">(optional)</span>
			{/if}
		{/snippet}

		{#if registry}
			<a href="/package/{name}">
				{@render summary()}
			</a>
		{:else}
			<p>
				{@render summary()}
			</p>
		{/if}
	</summary>

	<p class="description">
		{#if description}
			{description}
		{:else}
			<span style="color: var(--text-grey)">
				No description provided.
			</span>
		{/if}
	</p>

	<div class="tags">
		<Tag
			icon={IconLicense}
			label={license || 'None provided'}
			colour="var(--{license ? 'green' : 'red'})"
			title="Package License"
		/>

		<PackageLinks
			{name}
			{version}
			homepage={links?.homepage}
			repo={links?.repository}
			inspectValue={props}
		/>
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

			.optional {
				color: var(--orange);
				font-style: italic;
				font-size: 0.85rem;
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
