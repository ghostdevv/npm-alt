import { SpecifierExactSchema } from '@npm-alt/validate/package';
import { getChangelog } from '$lib/server/changelog';
import { getRequestEvent, query } from '$app/server';

export const getPackageChangelog = query(SpecifierExactSchema, async (spec) => {
	const event = getRequestEvent();
	return await getChangelog(spec.name, spec.version, event.platform!);
});
