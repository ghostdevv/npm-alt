<script lang="ts" module>
	import type { PackageTypeStatus } from '$lib/data/types';

	export interface Props {
		name: string;
		version: string;
		optional?: boolean;
		deprecated?: boolean;
		registry?: boolean;
		loading?: boolean;
		types?: PackageTypeStatus['status'];
	}
</script>

<script lang="ts">
	import IconTS from 'virtual:icons/catppuccin/typescript';
	import IconLoader from 'virtual:icons/lucide/loader';
	import IconDT from 'virtual:icons/custom/dt';

	const {
		name,
		version,
		types,
		deprecated = false,
		optional = false,
		registry = true,
		loading = false,
	}: Props = $props();
</script>

{#if registry}
	<a href="/package/{name}@{version}">
		{name}<span class="version">@{version}</span>
	</a>
{:else}
	<p>
		{name}<span class="version">@{version}</span>
	</p>
{/if}

{#if loading}
	<div class="icon spin" title="Loading...">
		<IconLoader />
	</div>
{:else if types == 'built-in'}
	<div class="icon" title="Types built-in">
		<IconTS />
	</div>
{:else if types == 'definitely-typed'}
	<div class="icon" title="@types package available (by definitely typed)">
		<IconDT />
	</div>
{/if}

{#if optional}
	<p class="optional">(optional)</p>
{/if}

{#if deprecated}
	<p class="deprecated">(deprecated)</p>
{/if}

<style>
	a,
	p {
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
</style>
