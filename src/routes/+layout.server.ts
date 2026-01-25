import { expansions } from '$lib/components/expansions/expansions';

export function load() {
	return {
		expansion: expansions[Math.floor(Math.random() * expansions.length)],
	};
}
