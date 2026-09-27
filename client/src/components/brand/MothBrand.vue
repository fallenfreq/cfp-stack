<template>
	<!-- The box fills the space it is given and measures it; the link inside hugs the logo. -->
	<div class="moth-brand">
		<RouterLink to="/" class="moth-brand-link" aria-label="somefreq home">
			<MothLogo class="moth-brand-mark sf-variant-primary" aria-hidden="true" />
			<MothWordmark class="moth-brand-wordmark" aria-hidden="true" />
		</RouterLink>
	</div>
</template>

<script setup lang="ts">
import MothLogo from './MothLogo.vue'
import MothWordmark from './MothWordmark.vue'

// The site logo, linking home. It shows whatever fits the space it is given: the mark and
// wordmark together, else the wordmark alone, else the mark alone.
</script>

<style scoped>
@layer ui {
	.moth-brand {
		container: moth-brand / inline-size;
	}

	/* The space between mark and wordmark is part of the logo's design, not theme spacing,
	   so it is fixed — and the widths below can add it up. */
	.moth-brand-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		inline-size: fit-content;
	}

	.moth-brand-mark {
		inline-size: 2rem;
	}
	.moth-brand-wordmark {
		block-size: 1.25rem;
	}

	/* Widths from the artwork: the wordmark is 1.25rem high at 100 × 21.84, so 5.72rem wide;
	   with the 2rem mark and the 1rem space the pair is 8.72rem. Update if the artwork
	   changes. */
	@container moth-brand (width < 8.75rem) {
		.moth-brand-mark {
			display: none;
		}
	}
	@container moth-brand (width < 5.75rem) {
		.moth-brand-mark {
			display: block;
		}
		.moth-brand-wordmark {
			display: none;
		}
	}
}
</style>
