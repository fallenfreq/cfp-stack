import { trpc } from '@/trpc'
import type { AppRouter } from '@somefreq-app/api/appRouter'
import type { inferRouterOutputs } from '@trpc/server'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type RouterOutputs = inferRouterOutputs<AppRouter>
export type Theme = RouterOutputs['themes']['list'][number]
export type ThemeToken = RouterOutputs['themes']['listTokens'][number]

// Source of truth for sf-* token enumeration + resolved values in the editor.
// Hydrated at app startup (fire-and-forget from main.ts); refetched after
// theme mutations once those land. Components read via computed refs so any
// refetch propagates reactively.

export const useThemeTokensStore = defineStore('themeTokens', () => {
	const themes = ref<Theme[]>([])
	const tokens = ref<ThemeToken[]>([])
	const hydrated = ref(false)

	const rootTheme = computed(() => themes.value.find((t) => t.isRoot))

	const rootTokens = computed<ThemeToken[]>(() => {
		const r = rootTheme.value
		if (!r) return []
		return tokens.value.filter((t) => t.themeId === r.id)
	})

	async function hydrate() {
		const [themeRows, tokenRows] = await Promise.all([
			trpc.themes.list.query(),
			trpc.themes.listTokens.query(),
		])
		themes.value = themeRows
		tokens.value = tokenRows
		hydrated.value = true
	}

	return { themes, tokens, hydrated, rootTheme, rootTokens, hydrate }
})
