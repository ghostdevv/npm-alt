<script lang="ts">
	import type { SearchPackage } from '$lib/client/npm-search';
	import PackageCardHeader from './PackageCardHeader.svelte';
	import IconLicense from 'virtual:icons/catppuccin/license';
	import { getPackageCore } from '$lib/data/package.remote';
	import { failed, pending } from '$lib/boundary.svelte';
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
	const pkg = $derived(getPackageCore(`${props.name}@${props.version}`));

	const registry = $derived(
		pkg.current?.errorCode === 404 ? false : props.registry || true,
	);

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
		<PackageCardHeader
			name={props.name}
			version={pkg.current?.version || props.version}
			optional={props.optional}
			deprecated={!!pkg.current?.deprecated}
			loading={pkg.loading}
			types={pkg.current?.types?.status}
			{registry}
		/>
	</div>

	<div class="description">
		{#if pkg.error || pkg.current?.errorCode}
			{#if pkg.current?.errorCode === 404}
				<p class="none">
					Package doesn't seem to exist, perhaps it's internal.
				</p>
			{:else}
				{@render failed(pkg.error || 'Failed to get package', () =>
					pkg.refresh(),
				)}
			{/if}
		{:else if props.description || pkg.current?.description}
			<p>{props.description || pkg.current?.description}</p>
		{:else if pkg.loading}
			{@render pending()}
		{:else}
			<p class="none">No description provided.</p>
		{/if}
	</div>

	<div class="tags">
		<Tag
			icon={IconLicense}
			label={license.text}
			colour={license.colour}
			title="Package License"
		/>

		<PackageLinks
			name={props.name}
			version={pkg.current?.version || props.version}
			homepage={props.links?.homepage || pkg.current?.homepage}
			repo={props.links?.repository || pkg.current?.repo}
			inspectValue={{ props, pkg: pkg.current, license, registry }}
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
		}

		.description {
			margin-top: 0px;

			.none {
				color: var(--text-grey);
			}
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
