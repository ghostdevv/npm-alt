<script lang="ts">
	import IconJSON from 'virtual:icons/catppuccin/json';
	import InspectModal from '$lib/InspectModal.svelte';
	import { getPackage } from './package';
	import README from './README.svelte';

	const { params } = $props();
	const pkg = $derived(await getPackage(params.name));
</script>

<section>
	<div class="name">
		<h1>
			{params.name}<span class="version">
				@{pkg['dist-tags'].latest}
			</span>
		</h1>

		<InspectModal value={pkg}>
			<button class="icon">
				<IconJSON />
			</button>
		</InspectModal>
	</div>
</section>

<section>
	<README readme={pkg.readme} />
</section>

<style>
	.name {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.version {
			color: var(--text-grey);
		}
	}
</style>
