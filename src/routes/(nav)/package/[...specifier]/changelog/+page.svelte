<script lang="ts">
	import { getPackageChangelog } from '$lib/data/package-changelog.remote';
	import IconChangelog from 'virtual:icons/catppuccin/changelog';
	import { renderMarkdown } from '$lib/client/highlight';
	import IconGithub from 'virtual:icons/lucide/github';
	import IconGit from 'virtual:icons/catppuccin/git';
	import Notice from '$lib/components/Notice.svelte';
	import { cache } from '$lib/client/cache';

	const { data } = $props();

	const renderChangelog = cache(null, async () => {
		const md = await getPackageChangelog({
			name: data.pkg.name,
			version: data.pkg.version,
		});

		if (!md) {
			return null;
		}

		return { source: md.source, html: await renderMarkdown(md.content) };
	});

	const changelog = $derived(
		await renderChangelog(
			`render-changelog:${data.pkg.name}-${data.pkg.version}`,
		),
	);
</script>

<section>
	{#if changelog}
		{#if changelog.source === 'git' || changelog.source === 'gh-releases'}
			{@const id = `changelog:${changelog.source}-${data.pkg.name}-${data.pkg.version}`}

			<Notice {id} colour="var(--orange)">
				<h4 class="row">
					{#if changelog.source === 'git'}
						<IconGit />
					{:else}
						<IconGithub />
					{/if}
					Changelog from {changelog.source}
				</h4>

				<p>
					{#if changelog.source === 'git'}
						The Changelog came from the provided Git repository,
						which likely means that you're not seeing your exact
						version or the formatting is even weirder. Good luck o7
					{:else}
						The Changelog came from the GitHub releases of the
						provided repository, which likely means that you're not
						seeing your exact version or the formatting is the
						weirdest. If your poison of choice isn't GitHub, well...
						send patches.
					{/if}
				</p>
			</Notice>
		{/if}

		{@html changelog.html}
	{:else}
		<Notice id="" colour="var(--primary)" permanent>
			<h4 class="row">
				<IconChangelog /> No Changelog Found
			</h4>

			<p>
				The Changelog tab is a lot of guess work as it's not officially
				supported by anything. Currently, we check to see if
				<code>{data.pkg.name}</code> has a <code>CHANGELOG.md</code> file
				published, and if it does? Sweet! Otherwise, if a repository is specified,
				we try to fetch it from the same place there.
			</p>

			<p>
				If there is a common place we missed, let us know! Otherwise
				please encourage your favourite maintainers, through
				interpretive dance, to publish a <code>CHANGELOG.md</code> with their
				packages.
			</p>
		</Notice>
	{/if}
</section>

<style>
	p,
	h4 {
		margin-block: 12px;

		&:first-child {
			margin-block-start: 6px;
		}

		&:last-child {
			margin-block-end: 6px;
		}
	}
</style>
