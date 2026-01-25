import type { Viewport } from '@xyflow/svelte';
import type { Node } from './graph.remote';

/**
 * Get whether the given node is completely visible within the viewport.
 */
export function isVisible(
	node: Node,
	viewport: Viewport,
	containerRect: DOMRect,
) {
	// viewport rect in flow coordinates
	const viewX = -viewport.x / viewport.zoom;
	const viewY = -viewport.y / viewport.zoom;
	const viewW = containerRect.width / viewport.zoom;
	const viewH = containerRect.height / viewport.zoom;

	// node rect
	const nodeX = node.position.x;
	const nodeY = node.position.y;
	const nodeW = node.measured?.width ?? 0;
	const nodeH = node.measured?.height ?? 0;

	// fully visible check
	return (
		nodeX >= viewX &&
		nodeX + nodeW <= viewX + viewW &&
		nodeY >= viewY &&
		nodeY + nodeH <= viewY + viewH
	);
}

/**
 * Get a new viewport that includes the given node.
 */
export function fitNodeInViewport(
	node: Node,
	viewport: Viewport,
	containerRect: DOMRect,
) {
	// viewport bounds in flow coords
	const viewX = -viewport.x / viewport.zoom;
	const viewY = -viewport.y / viewport.zoom;
	const viewW = containerRect.width / viewport.zoom;
	const viewH = containerRect.height / viewport.zoom;

	// root bounds
	const rootX = node.position.x;
	const rootY = node.position.y;
	const rootW = node.measured?.width ?? 0;
	const rootH = node.measured?.height ?? 0;

	// calculate minimal offset needed
	const PADDING = 20;
	let dx = 0;
	let dy = 0;

	if (rootX < viewX + PADDING) dx = rootX - viewX - PADDING;
	else if (rootX + rootW > viewX + viewW - PADDING)
		dx = rootX + rootW - (viewX + viewW - PADDING);

	if (rootY < viewY + PADDING) dy = rootY - viewY - PADDING;
	else if (rootY + rootH > viewY + viewH - PADDING)
		dy = rootY + rootH - (viewY + viewH - PADDING);

	return {
		x: viewport.x - dx * viewport.zoom,
		y: viewport.y - dy * viewport.zoom,
		zoom: viewport.zoom,
	};
}
