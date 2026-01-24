<script lang="ts">
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import { page } from '$app/state';
</script>

<h3>
	<IconNPM />
	{page.data.expansion}
</h3>

<style>
	h3 {
		display: flex;
		align-items: center;
		width: fit-content;
		gap: 8px;
		margin: 0px;
	}
</style>
