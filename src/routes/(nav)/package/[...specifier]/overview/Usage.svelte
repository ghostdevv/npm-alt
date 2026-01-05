<script lang="ts">
	import DropdownCodeblock from '$lib/components/DropdownCodeblock.svelte';
	import type { Package } from '$lib/data/package.remote';
	import IconPNPM from 'virtual:icons/catppuccin/pnpm';
	import IconYarn from 'virtual:icons/catppuccin/yarn';
	import IconDeno from 'virtual:icons/catppuccin/deno';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconBun from 'virtual:icons/catppuccin/bun';

	interface Props {
		pkg: Package;
	}

	const { pkg }: Props = $props();

	const installPackages = $derived(
		`${pkg.name}${pkg.types.status === 'definitely-typed' ? ` ${pkg.types.definitelyTypedPkg}` : ''}`,
	);
</script>

<DropdownCodeblock
	id="install-pkg-manager"
	title="Select a package manager to install with"
	textColour="#BE95FF"
	options={[
		{
			title: 'pnpm',
			icon: IconPNPM,
			content: `pnpm add ${installPackages}`,
		},
		{
			title: 'npm',
			icon: IconNPM,
			content: `npm install ${installPackages}`,
		},
		{
			title: 'yarn',
			icon: IconYarn,
			content: `yarn add ${installPackages}`,
		},
		{
			title: 'deno',
			icon: IconDeno,
			content: `deno add npm:${installPackages}`,
		},
		{
			title: 'bun',
			icon: IconBun,
			content: `bun add ${installPackages}`,
		},
	]}
/>

<h6>Use in Browser</h6>
<!-- prettier-ignore -->
<pre><code><span style="color: #BE95FF;">import</span> &#123;&#125; <span style="color: #BE95FF;">from</span> <span style="color: #F29E74;">'https://esm.sh/{pkg.name}@{pkg.version}'</span><span style="color: #F6F6F6B3;">;</span></code></pre>
