import { getPackage } from '$lib/data/package.remote';

export async function load({ params }) {
	return {
		pkg: await getPackage(params.specifier),
	};
}
