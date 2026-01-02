<script lang="ts">
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import { expansions } from './expansions';
</script>

<h3>
	<IconNPM />
	{expansions[Math.floor(Math.random() * expansions.length)]}
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
