<script lang="ts">
	import { getPackageFiles, type FileNode } from '$lib/data/package.remote';
	import IconFolderOpen from 'virtual:icons/catppuccin/folder-open';
	import IconFolder from 'virtual:icons/catppuccin/folder';
	import { format as formatBytes } from '@std/fmt/bytes';
	import { failed, pending } from '$lib/boundary.svelte';
	import IconText from 'virtual:icons/catppuccin/text';
	import Pending from '$lib/components/Pending.svelte';
	import { slide } from 'svelte/transition';
	import { Tree } from 'melt/builders';

	const { params, data } = $props();
	const files = $derived(await getPackageFiles(params.specifier));

	let selected = $state<FileNode | null>(null);

	const tree = $derived(
		new Tree({
			items: files,
			expanded: [],
			onSelectedChange(selection) {
				const item = selection ? tree.getItem(selection) : null;

				if (!item) {
					selected = null;
					return;
				}

				if (!('children' in item)) {
					selected = item;
					return;
				}
			},
		}),
	);

	function baseName(path: string) {
		return path.split('/').pop()!;
	}

	async function fetchContent(file: FileNode) {
		const url = `https://unpkg.com/${data.pkg.name}@${data.pkg.version}${file.id}`;
		const res = await fetch(url);
		const text = await res.text();
		return text;
	}
</script>

{#snippet treeItems(items: (typeof tree)['children'], depth: number = 0)}
	{#each items as item (item.id)}
		<li {...item.attrs} style:--depth={depth}>
			<p class="item row" class:selected={item.selected}>
				{#if item.children && item.expanded}
					<IconFolderOpen />
				{:else if item.children}
					<IconFolder />
				{:else}
					<IconText />
				{/if}

				{baseName(item.id)}
				<span class="size">{formatBytes(item.item.size)}</span>
			</p>

			{#if item.children?.length && item.expanded}
				<div class="children" transition:slide={{ axis: 'y' }}>
					{@render treeItems(item.children, depth + 1)}
				</div>
			{/if}
		</li>
	{/each}
{/snippet}

<div class="explorer">
	<ul {...tree.root}>
		{@render treeItems(tree.children, 0)}
	</ul>

	<div class="spacer"></div>

	<div class="content">
		{#if selected}
			<svelte:boundary {failed} {pending}>
				<Pending />
				<pre><code>{await fetchContent(selected)}</code></pre>
			</svelte:boundary>
		{:else}
			<p class="default">select something :D</p>
		{/if}
	</div>
</div>

<style>
	.explorer {
		display: grid;
		grid-template-columns: 250px max-content 1fr;
		gap: 2px;
		height: 100%;
		max-height: 100%;

		.spacer {
			height: 100%;
			width: 2px;
			background-color: var(--background-tertiary);
		}

		.content {
			padding-inline: 4px;
			overflow: auto;
			position: relative;

			pre {
				margin: 0px;
				height: 100%;
			}

			&:has(.default) {
				display: grid;
				place-items: center;

				.default {
					color: var(--text-grey);
				}
			}
		}

		[data-melt-tree-root] {
			list-style: none;
			overflow: auto;
			margin: 0px;
			padding-inline: 4px;

			[data-melt-tree-item] {
				.item {
					padding-block: 6px;
					padding-inline: 8px;
					margin: 0px;
					margin-left: calc(var(--depth) * 10px);

					border-radius: 8px;

					.size {
						margin-left: auto;
						font-size: 0.85em;
						color: var(--text-grey);
						text-align: right;
					}

					&:hover,
					&.selected {
						background-color: color(
							from var(--primary) srgb r g b / 0.4
						);
					}
				}

				&:focus-visible {
					outline: none;

					.item {
						outline: 2px solid var(--primary);
						outline-offset: 2px;
					}
				}

				.children {
					position: relative;

					&:before {
						content: '';
						position: absolute;
						top: 0;
						left: calc((var(--depth) * 10px));
						width: 1px;
						height: 100%;
						background-color: var(--background-tertiary);
					}
				}
			}
		}
	}
</style>
