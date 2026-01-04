<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { navigating } from '$app/state';
	import { untrack } from 'svelte';

	// Constants
	const PROGRESS_INCREMENT = 0.1;
	const MIN_REMAINING_THRESHOLD = 0.15;
	const ANIMATION_INTERVAL_BASE = 500;
	const INITIAL_DELAY = 250;
	const FADE_THRESHOLD = 0.6;

	// Duration thresholds for completion animation
	const DURATION_FAST = 150;
	const DURATION_MEDIUM = 300;
	const DURATION_SLOW = 400;
	const PROGRESS_THRESHOLD_FAST = 0.2;
	const PROGRESS_THRESHOLD_SLOW = 0.5;

	// State
	let progress = $state(0);
	let isAnimating = $state(false);
	let animationFrame: number | undefined;
	let timeout: NodeJS.Timeout | undefined;

	// Derived states
	let showProgress = $derived(progress < 1);
	let showFade = $derived(progress >= FADE_THRESHOLD && isAnimating);

	function cleanup() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = undefined;
		}
	}

	function startProgressAnimation() {
		cleanup();
		progress = 0;
		isAnimating = true;

		function incrementProgress() {
			progress = Math.min(progress + PROGRESS_INCREMENT, 0.99);
			const remaining = 1 - progress;

			if (remaining > MIN_REMAINING_THRESHOLD && isAnimating) {
				// Slow down as we approach completion for better UX
				const delay = ANIMATION_INTERVAL_BASE / remaining;
				timeout = setTimeout(incrementProgress, delay);
			}
		}

		timeout = setTimeout(incrementProgress, INITIAL_DELAY);
	}

	function completeAnimation() {
		const duration =
			progress < PROGRESS_THRESHOLD_FAST
				? DURATION_FAST
				: progress > PROGRESS_THRESHOLD_SLOW
					? DURATION_SLOW
					: DURATION_MEDIUM;

		const startProgress = progress;
		const startTime = performance.now();

		function animate() {
			const elapsed = performance.now() - startTime;
			const t = Math.min(elapsed / duration, 1);

			// Ease out cubic for smooth completion
			const eased = 1 - Math.pow(1 - t, 3);
			progress = startProgress + (1 - startProgress) * eased;

			if (t < 1) {
				animationFrame = requestAnimationFrame(animate);
			} else {
				animationFrame = undefined;
			}
		}

		animationFrame = requestAnimationFrame(animate);
	}

	// Watch for navigation changes
	$effect(() => {
		if (navigating?.to) {
			untrack(startProgressAnimation);
		}
	});

	// Handle navigation completion
	afterNavigate(() => {
		isAnimating = false;
		cleanup();
		completeAnimation();
	});

	// Cleanup on unmount
	$effect(() => {
		return cleanup;
	});
</script>

{#if showProgress}
	<div
		class="progress-container"
		transition:fade={{ duration: 300 }}
		role="progressbar"
		aria-label="Page loading progress"
		aria-valuenow={Math.round(progress * 100)}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-busy={isAnimating}
	>
		<div class="progress" style:inline-size="{progress * 100}%"></div>
	</div>
{/if}

{#if showFade}
	<div class="fade-overlay" aria-hidden="true"></div>
{/if}

<style>
	.progress-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		z-index: 9999;
		contain: layout style paint;
	}

	.progress {
		position: absolute;
		inset: 0;
		width: 0;
		background: var(--primary, #3b82f6);
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: width;

		/* Add a subtle glow effect */
		box-shadow:
			0 0 10px
				color-mix(in srgb, var(--primary, #3b82f6) 50%, transparent),
			0 0 5px var(--primary, #3b82f6);
	}

	.fade-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(1px);
		pointer-events: none;
		z-index: 9998;
		animation: fadeIn 0.3s ease-out;
		contain: strict;
	}

	@media (prefers-color-scheme: dark) {
		.fade-overlay {
			background-color: rgba(0, 0, 0, 0.3);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress {
			transition: none;
		}

		.fade-overlay {
			animation: none;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
