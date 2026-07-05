<template>
	<div class="font-picker" @mousedown.stop>
		<div class="fp-section">
			<span class="fp-label">Family</span>
			<div class="fp-row">
				<button
					class="fp-chip fp-chip-clear"
					title="Default family"
					:class="{ 'sf-on-selected': !activeFamilyVar }"
					@mousedown.prevent
					@click="pickFamily(null)"
				>
					×
				</button>
				<button
					v-for="f in families"
					:key="f.cssVar"
					class="fp-chip fp-chip-family"
					:class="{ 'sf-on-selected': activeFamilyVar === f.cssVar }"
					:style="{ fontFamily: f.value }"
					:title="f.label"
					@mousedown.prevent
					@click="pickFamily(f.cssVar)"
				>
					Aa
				</button>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label">Size</span>
			<div class="fp-row">
				<button
					class="fp-chip fp-chip-clear"
					title="Default size"
					:class="{ 'sf-on-selected': !activeSizeVar }"
					@mousedown.prevent
					@click="pickSize(null)"
				>
					×
				</button>
				<button
					v-for="s in sizes"
					:key="s.cssVar"
					class="fp-chip"
					:class="{ 'sf-on-selected': activeSizeVar === s.cssVar }"
					:title="s.value"
					@mousedown.prevent
					@click="pickSize(s.cssVar)"
				>
					{{ s.label }}
				</button>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label">Leading</span>
			<div class="fp-row">
				<button
					class="fp-chip fp-chip-clear"
					title="Default line height"
					:class="{ 'sf-on-selected': !activeLeadingVar }"
					@mousedown.prevent
					@click="pickLeading(null)"
				>
					×
				</button>
				<button
					v-for="l in leading"
					:key="l.cssVar"
					class="fp-chip"
					:class="{ 'sf-on-selected': activeLeadingVar === l.cssVar }"
					:title="`line-height: ${l.value}`"
					@mousedown.prevent
					@click="pickLeading(l.cssVar)"
				>
					{{ l.label }}
				</button>
			</div>
		</div>

		<div class="fp-section">
			<span class="fp-label">Tracking</span>
			<div class="fp-row">
				<button
					class="fp-chip fp-chip-clear"
					title="Default letter spacing"
					:class="{ 'sf-on-selected': !activeTrackingVar }"
					@mousedown.prevent
					@click="pickTracking(null)"
				>
					×
				</button>
				<button
					v-for="t in tracking"
					:key="t.cssVar"
					class="fp-chip"
					:class="{ 'sf-on-selected': activeTrackingVar === t.cssVar }"
					:title="`letter-spacing: ${t.value}`"
					@mousedown.prevent
					@click="pickTracking(t.cssVar)"
				>
					{{ t.label }}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	SIZE_TO_LEADING,
	parseFontVar,
	useFontPalette,
	type FontStyleAttrs,
} from '@/utils/editor/fontPalette'
import { ref, watch } from 'vue'

const { families, sizes, leading, tracking } = useFontPalette()

const props = defineProps<{
	fontFamily: string | null
	fontSize: string | null
	lineHeight: string | null
	letterSpacing: string | null
}>()

const emit = defineEmits<{ commit: [attrs: FontStyleAttrs] }>()

const activeFamilyVar = ref<string | null>(null)
const activeSizeVar = ref<string | null>(null)
const activeLeadingVar = ref<string | null>(null)
const activeTrackingVar = ref<string | null>(null)

watch(
	() => [props.fontFamily, props.fontSize, props.lineHeight, props.letterSpacing] as const,
	([fam, size, lead, track]) => {
		activeFamilyVar.value = parseFontVar(fam)
		activeSizeVar.value = parseFontVar(size)
		activeLeadingVar.value = parseFontVar(lead)
		activeTrackingVar.value = parseFontVar(track)
	},
	{ immediate: true },
)

const commit = () =>
	emit('commit', {
		fontFamily: activeFamilyVar.value ? `var(${activeFamilyVar.value})` : null,
		fontSize: activeSizeVar.value ? `var(${activeSizeVar.value})` : null,
		lineHeight: activeLeadingVar.value ? `var(${activeLeadingVar.value})` : null,
		letterSpacing: activeTrackingVar.value ? `var(${activeTrackingVar.value})` : null,
	})

const pickFamily = (cssVar: string | null) => {
	activeFamilyVar.value = cssVar
	commit()
}

const pickSize = (cssVar: string | null) => {
	activeSizeVar.value = cssVar
	// Auto-pair leading when a size is chosen; clear leading when size is cleared.
	activeLeadingVar.value = cssVar ? (SIZE_TO_LEADING[cssVar] ?? null) : null
	commit()
}

const pickLeading = (cssVar: string | null) => {
	activeLeadingVar.value = cssVar
	commit()
}

const pickTracking = (cssVar: string | null) => {
	activeTrackingVar.value = cssVar
	commit()
}
</script>

<style scoped>
@layer ui {
	.font-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 240px;
		padding: 4px;
	}

	.fp-section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.fp-label {
		font-size: 0.7rem;
		color: rgba(var(--text_primary) / var(--sf-alpha-6));
	}

	.fp-row {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
	}

	.fp-chip {
		height: 26px;
		border-radius: 4px;
		border: 1px solid rgba(var(--text_primary) / var(--sf-alpha-2));
		padding: 0 6px;
		cursor: pointer;
		transition: transform 0.08s;
		font-size: 0.75rem;
		line-height: 1;
		background: none;
		color: rgb(var(--text_primary));
	}

	.fp-chip:hover {
		transform: scale(1.05);
		background: rgba(var(--text_primary) / var(--sf-alpha-1));
	}

	.fp-chip-clear {
		width: 26px;
		padding: 0;
		text-align: center;
		color: rgba(var(--text_primary) / var(--sf-alpha-4));
	}

	.fp-chip-family {
		font-size: 0.9rem;
		min-width: 36px;
	}
}
</style>
