<script lang="ts">
	import PackageLinks from '$lib/components/PackageLinks.svelte';
	import { failed, pending } from '$lib/boundary.svelte';
	import Pending from '$lib/components/Pending.svelte';
	import { goto } from '$app/navigation';
	import { Tabs } from 'melt/builders';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const { children, params, data } = $props();

	const TAB_IDS = [
		'overview',
		'files',
		'changelog',
		'versions',
		'score',
	] as const;

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
			goto(resolve(`/(nav)/package/[...specifier]/${tab}`, params));
		},
	});
</script>

<div class="wrapper">
	<section>
		<div class="name">
			<h1>
				{data.pkg.name}<span class="version">@{data.pkg.version}</span>
			</h1>

			<PackageLinks
				links={{
					npm: data.pkg.npm,
					homepage: data.pkg.homepage,
					repository: data.pkg.repo?.link,
				}}
				inspectValue={data.pkg}
			/>
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
		<svelte:boundary {failed} {pending}>
			<Pending />
			{@render children()}
		</svelte:boundary>
	</div>
</div>

<style>
	.wrapper {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: max-content max-content 1fr;
		height: 100%;
	}

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

	.slot {
		position: relative;
		height: 100%;
		overflow-y: auto;
	}

	section,
	.slot :global(> section) {
		margin-block: 8px;
	}

	[data-melt-tabs-trigger-list] {
		border-bottom: 2px solid var(--primary);
		margin-block-end: 16px;
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
