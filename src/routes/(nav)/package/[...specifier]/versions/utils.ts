export function stringToColor(str: string) {
	// Hash the string
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash; // Convert to 32bit integer
	}

	// Use golden ratio for better color distribution
	const goldenRatio = 0.618033988749895;
	const hue = ((hash * goldenRatio) % 1) * 360;

	// Vibrant, readable colors
	return `hsl(${Math.abs(hue)}, 70%, 55%)`;
}
