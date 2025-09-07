// utils/createPlaceholders.ts
import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'

export interface Breakpoints {
	default: number
	sm: number
	md: number
	lg: number
	xl: number
	'2xl': number
}

const calculatePlaceholdersNeeded = (numItems: number, columns: Breakpoints) => {
	const placeholdersNeeded: Breakpoints = {
		default: 0,
		sm: 0,
		md: 0,
		lg: 0,
		xl: 0,
		'2xl': 0,
	}

	for (const key of Object.keys(columns)) {
		const colCount = columns[key as keyof Breakpoints]

		const extra = columns.default > colCount ? colCount - columns.default : 0

		if (numItems === 0) {
			placeholdersNeeded[key as keyof Breakpoints] = colCount + extra
		} else {
			const remainder = numItems % colCount
			placeholdersNeeded[key as keyof Breakpoints] =
				remainder === 0 ? 0 : colCount - remainder
		}
	}
	return placeholdersNeeded
}

const getMaxItemsCount = (realItemsCount: number, placeholdersNeeded: Breakpoints): number => {
	return realItemsCount + Math.max(...Object.values(placeholdersNeeded))
}

function createPlaceholders(
	placeholdersNeeded: Breakpoints,
	title: string,
	classMap: Partial<Record<keyof Breakpoints, string>> = {},
) {
	const placeholders: CollectionEntry[] = []
	const visibilityMap = new Map<CollectionEntry, string[]>()

	for (let i = 0; i < getMaxItemsCount(0, placeholdersNeeded); i++) {
		const placeholder: CollectionEntry = {
			collectionEntryId: 0,
			type: 'placeholder',
			title,
			description: '',
			imageUrl: '',
			link: '',
			content: '',
		}

		const classes: string[] = ['hidden']

		for (const key of Object.keys(placeholdersNeeded)) {
			if (i < placeholdersNeeded[key as keyof Breakpoints]) {
				const showClass = classMap[key as keyof Breakpoints] || `visible-${key}`
				classes.push(showClass)
				if (
					(showClass === 'visible-default' || showClass === classMap.default)
					&& classes[0] === 'hidden'
				) {
					classes.shift()
				}
			}
		}

		visibilityMap.set(placeholder, classes)
		placeholders.push(placeholder)
	}

	return { placeholders, visibilityMap }
}

export { calculatePlaceholdersNeeded, createPlaceholders }
