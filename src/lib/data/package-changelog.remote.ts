import { getChangelog } from './package-changelog.server';
import { getRequestEvent, query } from '$app/server';
import * as ve from './valibot.server';

export const getPackageChangelog = query(ve.specifierExact, async (spec) => {
	const event = getRequestEvent();
	return await getChangelog(spec.name, spec.version, event.platform!);
});
