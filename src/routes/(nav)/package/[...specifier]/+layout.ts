import { getPackage } from './package.remote';

export async function load({ params }) {
	return {
		pkg: await getPackage(params.specifier),
	};
}
