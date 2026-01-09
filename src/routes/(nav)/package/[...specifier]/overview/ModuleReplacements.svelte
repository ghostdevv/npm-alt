<script lang="ts">
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import { failed, pending } from '$lib/boundary.svelte';
	import { renderMarkdown } from '$lib/client/highlight';
	import type { ModReplacement } from '$lib/data/types';
	import IconNode from 'virtual:icons/custom/node';
	import Modal from '$lib/components/Modal.svelte';
	import IconMDN from 'virtual:icons/custom/mdn';
	import Tag from '$lib/components/Tag.svelte';
	import IconX from 'virtual:icons/lucide/x';
	import { cache } from '$lib/client/cache';

	interface Props {
		replacements: ModReplacement[];
		inline?: boolean;
	}

	const { replacements, inline = true }: Props = $props();

	const renderDocumented = cache({
		ttl: 86_400,
		async value(docPath: string) {
			const url = `https://raw.githubusercontent.com/es-tooling/module-replacements/refs/heads/main/docs/modules/${docPath}.md`;
			const res = await fetch(url);
			const md = (await res.text()).replace(/^---\n.*\n---/, '').trim();
			return await renderMarkdown(md);
		},
	});
</script>

{#if replacements.length === 0}
	<span title="No recommendations found" style="color: var(--green);">
		<IconX />
	</span>
{:else}
	<Modal>
		{#snippet activator()}
			<button
				title="{replacements.length} recommendation(s) found, click to learn more"
				class={{ icon: inline, outline: !inline, inline }}
			>
				{#if inline}
					<IconQuestion />
				{:else}
					View Recommendation(s)
				{/if}
			</button>
		{/snippet}

		{#snippet children()}
			{#each replacements as replacement}
				<section>
					{#if replacement.type === 'simple'}
						<h3>Simple Replacement</h3>

						<p>
							Use <code>
								{replacement.replacement.replace(/^Use /, '')}
							</code>
						</p>
					{:else if replacement.type === 'native'}
						<h3>Native Replacement</h3>

						<div class="row">
							<Tag
								icon={IconMDN}
								label="MDN"
								colour="#a4cefe"
								title="MDN Documentation"
								href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/{replacement.mdnPath}"
							/>

							<Tag
								icon={IconNode}
								label="Node {replacement.nodeVersion}"
								colour="#84ba64"
								title="Requires Node.js {replacement.nodeVersion} or above"
							/>
						</div>

						<p>
							Replacable with <code>
								{replacement.replacement}
							</code>.
						</p>
					{:else if replacement.type === 'documented'}
						<svelte:boundary {failed} {pending}>
							<div class="markdown">
								{@html await renderDocumented(
									`module-replacement:${replacement.moduleName}`,
									replacement.docPath,
								)}
							</div>
						</svelte:boundary>
					{/if}
				</section>
			{/each}
		{/snippet}
	</Modal>
{/if}

<style>
	section:last-of-type {
		margin-bottom: 0px;
	}

	h3 {
		margin-block-end: 12px;
	}

	button {
		padding-block: 8px;
		padding-inline: 12px;
		margin: 0px;

		&.inline {
			padding: 0px;
			margin: 0px;
			color: var(--red);
		}

		border-color: var(--colour);

		&:focus:not(:disabled),
		&:active:not(:disabled),
		&:hover:not(:disabled) {
			background-color: var(--colour);
		}
	}
</style>
