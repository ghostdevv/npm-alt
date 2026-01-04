<script lang="ts">
	import { renderDocumentedModuleReplacement } from '$lib/data/package.remote';
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import type { ModuleReplacement } from 'module-replacements';
	import { failed, pending } from '$lib/boundary.svelte';
	import IconNode from 'virtual:icons/custom/node';
	import IconMDN from 'virtual:icons/custom/mdn';
	import IconX from 'virtual:icons/lucide/x';
	import Modal from '$lib/Modal.svelte';
	import Tag from '$lib/Tag.svelte';

	interface Props {
		replacements: ModuleReplacement[];
	}

	const { replacements }: Props = $props();
</script>

{#if replacements.length === 0}
	<span title="No recommendations found" style="color: var(--green);">
		<IconX />
	</span>
{:else}
	<Modal>
		{#snippet activator()}
			<button
				class="icon"
				title="{replacements.length} recommendation(s) found, click to learn more"
				style="color: var(--red);"
			>
				<IconQuestion />
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
						<h3>Documented Steps</h3>

						<svelte:boundary {failed} {pending}>
							{@html await renderDocumentedModuleReplacement(
								replacement.moduleName,
							)}
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
		padding: 0px;
	}
</style>
