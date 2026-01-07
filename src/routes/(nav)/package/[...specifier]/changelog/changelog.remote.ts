import { getChangelog } from '$lib/server/changelog';
import { getRequestEvent, query } from '$app/server';
import * as ve from '$lib/server/valibot';

export const getPackageChangelog = query(ve.specifierExact, async (spec) => {
	const event = getRequestEvent();
	return await getChangelog(spec.name, spec.version, event.platform!);
});
