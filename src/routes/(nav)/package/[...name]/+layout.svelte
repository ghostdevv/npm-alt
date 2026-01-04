<script lang="ts">
	import { getPackage } from '$lib/data/package.remote';
	import PackageLinks from '$lib/PackageLinks.svelte';
	import { failed } from '$lib/failed.svelte';
	import { goto } from '$app/navigation';
	import { Tabs } from 'melt/builders';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const { children, params } = $props();

	const TAB_IDS = ['overview'] as const;
	type TabId = (typeof TAB_IDS)[number];

	function isTab(id: string): id is TabId {
		return TAB_IDS.includes(id as TabId);
	}

	const urlTabId = $derived.by(() => {
		const tab = page.url.pathname.split('/').at(-1);
		return tab && isTab(tab) ? tab : 'overview';
	});

	const tabs = new Tabs<TabId>({
		value: () => urlTabId,
		onValueChange(tab) {
			goto(resolve(`/(nav)/package/[...name]/${tab}`, params));
		},
	});

	const pkg = $derived(
		await getPackage({
			name: params.name.toLowerCase(),
			specifier: 'latest',
		}),
	);
</script>

<section>
	<div class="name">
		<h1>
			{params.name}<span class="version">@{pkg.version}</span>
		</h1>

		<PackageLinks links={pkg.links} inspectValue={pkg} />
	</div>
</section>

<div {...tabs.triggerList}>
	{#each TAB_IDS as id}
		<button class="outline" {...tabs.getTrigger(id)}>
			{id}
		</button>
	{/each}
</div>

<div class="slot">
	<svelte:boundary {failed}>
		{@render children()}

		{#if $effect.pending()}
			Loading...
		{/if}
	</svelte:boundary>
</div>

<style>
	.name {
		display: flex;
		align-items: center;
		gap: 8px;

		h1 {
			margin-right: auto;

			.version {
				color: var(--text-grey);
			}
		}
	}

	section,
	.slot :global(> section) {
		margin-block: 8px;
	}

	[data-melt-tabs-trigger-list] {
		border-bottom: 2px solid var(--primary);
		margin-block-end: 22px;
	}

	[data-melt-tabs-trigger] {
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 0px;
		border-bottom: 0px;
		border-color: transparent;

		margin-block: 0px;
		margin-inline: 4px;
		padding-inline: 12px;
		padding-block: 8px;

		text-transform: capitalize;

		&:first-child {
			margin-inline-start: 0px;
		}

		&:last-child {
			margin-inline-end: 0px;
		}

		&[data-active] {
			background-color: color(from var(--primary) srgb r g b / 0.1);
			border-color: var(--primary);
		}
	}
</style>
