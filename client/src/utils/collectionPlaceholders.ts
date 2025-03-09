// utils/createPlaceholders.ts
import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'

export type CollectionItem =
  | CollectionEntry
  | (CollectionEntry & {
      type: 'placeholder'
      isPlaceholder: boolean
      visibilityClasses: string[]
    })

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
    '2xl': 0
  }
  for (const key of Object.keys(columns)) {
    const colCount = columns[key as keyof Breakpoints]
    if (numItems === 0) {
      placeholdersNeeded[key as keyof Breakpoints] = colCount
    } else {
      const remainder = numItems % colCount
      placeholdersNeeded[key as keyof Breakpoints] = remainder === 0 ? 0 : colCount - remainder
    }
  }
  return placeholdersNeeded
}

const getMaxItemsCount = (realItemsCount: number, placeholdersNeeded: Breakpoints): number => {
  return realItemsCount + Math.max(...Object.values(placeholdersNeeded))
}

function createPlaceholders(placeholdersNeeded: Breakpoints, title: string): CollectionItem[] {
  const placeholders: CollectionItem[] = []

  for (let i = 0; i < getMaxItemsCount(0, placeholdersNeeded); i++) {
    const placeholder: CollectionItem = {
      collectionEntryId: 0,
      type: 'placeholder',
      title,
      description: '',
      imageUrl: '',
      link: '',
      content: '',
      isPlaceholder: true,
      visibilityClasses: []
    }

    const { visibilityClasses } = placeholder
    for (const key of Object.keys(placeholdersNeeded)) {
      if (i < placeholdersNeeded[key as keyof Breakpoints])
        visibilityClasses?.push('visible-' + key)
    }

    placeholders.push(placeholder)
  }

  return placeholders
}

export { createPlaceholders, calculatePlaceholdersNeeded }
