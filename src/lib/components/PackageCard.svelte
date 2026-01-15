<script lang="ts">
	import type { SearchPackage } from '$lib/client/npm-search';
	import IconLicense from 'virtual:icons/catppuccin/license';
	import { getPackageCore } from '$lib/data/package.remote';
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import { failed, pending } from '$lib/boundary.svelte';
	import IconLoader from 'virtual:icons/lucide/loader';
	import PackageLinks from './PackageLinks.svelte';
	import IconDT from 'virtual:icons/custom/dt';
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
		links,
		optional = false,
		registry = true,
	} = $derived(props);

	const pkg = $derived(getPackageCore(`${name}@${version}`));

	const license = $derived.by(() => {
		if (props.license) {
			return { text: props.license, colour: 'var(--green)' };
		} else if (pkg.error) {
			return { text: 'Error', colour: 'var(--red)' };
		} else if (pkg.loading) {
			return { text: 'Loading...', colour: 'var(--orange)' };
		} else if (pkg.current?.license) {
			return { text: pkg.current.license, colour: 'var(--green)' };
		} else {
			return { text: 'None provided', colour: 'var(--red)' };
		}
	});
</script>

<div class="package" class:deprecated={!!pkg.current?.deprecated}>
	<div class="title">
		{#if registry}
			<a href="/package/{name}@{version}">
				{name}<span class="version">@{version}</span>
			</a>
		{:else}
			<p>
				{name}<span class="version">@{version}</span>
			</p>
		{/if}

		{#if pkg.loading}
			<span class="icon spin" title="Loading...">
				<IconLoader />
			</span>
		{:else if pkg.current?.types.status == 'built-in'}
			<span class="icon" title="Types built-in">
				<IconTS />
			</span>
		{:else if pkg.current?.types.status == 'definitely-typed'}
			<span
				class="icon"
				title="@types package available (by definitely typed)"
			>
				<IconDT />
			</span>
		{/if}

		{#if optional}
			<span class="optional">(optional)</span>
		{/if}

		{#if pkg.current?.deprecated}
			<span class="deprecated">(deprecated)</span>
		{/if}
	</div>

	{#if pkg.error}
		{@render failed(pkg.error, pkg.refresh)}
	{:else if description || pkg.current?.description}
		<p class="description">{description || pkg.current?.description}</p>
	{:else if pkg.loading}
		{@render pending()}
	{:else}
		<p class="description" style="color: var(--text-grey)">
			No description provided.
		</p>
	{/if}

	<div class="tags">
		<Tag
			icon={IconLicense}
			label={license.text}
			colour={license.colour}
			title="Package License"
		/>

		<PackageLinks
			{name}
			{version}
			homepage={links?.homepage || pkg.current?.homepage}
			repo={links?.repository || pkg.current?.repo}
			inspectValue={{ props, pkg: pkg.current }}
		/>
	</div>
</div>

<style>
	.package {
		width: auto;
		flex-grow: 1;
		flex-shrink: 1;
		padding-inline: 8px;
		padding-block: 8px;
		margin: 0px;

		border: 2px solid var(--background-tertiary);
		border-radius: 12px;

		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: max-content 1fr max-content;
		gap: 6px;

		.title {
			display: flex;
			align-items: center;
			gap: 8px;

			a,
			p,
			span {
				color: var(--text);
				margin: 0px;
				font-family: monospace;
			}

			.icon {
				display: grid;
				place-items: center;

				&.spin {
					font-size: 0.85rem;
				}
			}

			.version {
				color: var(--text-grey);
			}

			.optional {
				color: var(--orange);
				font-style: italic;
				font-size: 0.85rem;
			}

			.deprecated {
				color: var(--red);
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

		&.deprecated {
			border-color: color(from var(--red) srgb r g b / 0.8);
		}
	}
</style>
