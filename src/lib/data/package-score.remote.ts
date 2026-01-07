import { getChangelog } from './package-changelog.server';
import { getInternalPackage } from './package.server';
import { getRequestEvent, query } from '$app/server';
import { USER_AGENT, cached } from './common.server';
import type { CriteriaId } from './package-scores';
import type { InternalPackage } from './types';
import * as ve from './valibot.server';

type ScoreResults = Record<CriteriaId, number | null>;

async function fetchREADME(pkg: InternalPackage) {
	const res = await fetch(
		`https://unpkg.com/${pkg.name}@${pkg.version}/README.md`,
		{ headers: { 'User-Agent': USER_AGENT } },
	).catch(() => null);

	return res === null ? null : res.ok ? 1 : 0;
}

export const getPackageScore = query(ve.specifierExact, async (spec) => {
	const event = getRequestEvent();

	return await cached({
		key: `score:${spec.name}@${spec.version}`,
		platform: event.platform!,
		ttl: 600,
		async value(): Promise<ScoreResults> {
			const pkg = await getInternalPackage(spec, event.platform!);

			const [changelog, readme] = await Promise.all([
				await getChangelog(spec.name, spec.version, event.platform!),
				await fetchREADME(pkg),
			]);

			return {
				readme,
				changelog: changelog ? (changelog.source === 'npm' ? 2 : 1) : 0,
				types: pkg.typesIncluded ? 1 : 0,
				license: pkg.license ? 1 : 0,
				provenance: null,
			};
		},
	});
});
