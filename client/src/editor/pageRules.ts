// The rules the editor runs, every one that can break on a page (client/src/assets/sf-system.md,
// "Validator and linter", "Where a rule shows"), on the page as the rules read it. Loaded on its
// own once the editor is open (pageWarnings.ts): with the page reader and CSSTree, 68 KB gzipped.
import { readPage, type Wears } from '@/editor/readPage'
import { check, type CssRule, type ElementRule } from '@somefreq-app/validator/core'
import { maxHideShowRun } from '@somefreq-app/validator/rules/maxHideShowRun'
import { noBleedingCenter } from '@somefreq-app/validator/rules/noBleedingCenter'
import { noCollapseStraightInColumns } from '@somefreq-app/validator/rules/noCollapseStraightInColumns'
import { noContainerUnits } from '@somefreq-app/validator/rules/noContainerUnits'
import { noContentSizedBox } from '@somefreq-app/validator/rules/noContentSizedBox'
import { noDuplicateId } from '@somefreq-app/validator/rules/noDuplicateId'
import { noOverflowHidden } from '@somefreq-app/validator/rules/noOverflowHidden'
import { noOverInComponent } from '@somefreq-app/validator/rules/noOverInComponent'
import { noOverWithPlacement } from '@somefreq-app/validator/rules/noOverWithPlacement'
import { noWidthContainer } from '@somefreq-app/validator/rules/noWidthContainer'
import { oneArrangementPerBox } from '@somefreq-app/validator/rules/oneArrangementPerBox'
import { preferCenterAroundVideo } from '@somefreq-app/validator/rules/preferCenterAroundVideo'
import { preferOverlayOnOver } from '@somefreq-app/validator/rules/preferOverlayOnOver'
import { preferThemeColor } from '@somefreq-app/validator/rules/preferThemeColor'
import { preferThemeRadius } from '@somefreq-app/validator/rules/preferThemeRadius'
import { preferThemeText } from '@somefreq-app/validator/rules/preferThemeText'
import { requireChannelFallback } from '@somefreq-app/validator/rules/requireChannelFallback'
import { requirePictureSize } from '@somefreq-app/validator/rules/requirePictureSize'
import { validHeadingClass } from '@somefreq-app/validator/rules/validHeadingClass'
import type { Node as PMNode } from '@tiptap/pm/model'

const elementRules: readonly ElementRule[] = [
	noDuplicateId,
	oneArrangementPerBox,
	noBleedingCenter,
	noCollapseStraightInColumns,
	noOverWithPlacement,
	noOverInComponent,
	requirePictureSize,
	validHeadingClass,
	preferCenterAroundVideo,
	preferOverlayOnOver,
	maxHideShowRun,
]
const boxRules: readonly CssRule[] = [noOverflowHidden, noContentSizedBox]
const styleRules: readonly CssRule[] = [
	noContainerUnits,
	requireChannelFallback,
	noWidthContainer,
	preferThemeColor,
	preferThemeRadius,
	preferThemeText,
]

/** A rule broken on the page: as the core gives it, with the blocks it names in place of nodes. */
export interface PageWarning {
	rule: string
	type: 'problem' | 'suggestion'
	message: string
	/** The positions of the blocks it names, at least one. */
	blocks: readonly number[]
}

/** What the rules find on the page, each block wearing what `wears` says it always wears. */
export function checkPage(doc: PMNode, wears: Wears): PageWarning[] {
	const { elements, blockOf, styles } = readPage(doc, wears)
	const onElements = check(elements, elementRules).map(({ nodes, ...found }) => ({
		...found,
		blocks: nodes.flatMap((node) => blockOf.get(node) ?? []),
	}))
	// A block's own style names only its block. The box rules run on a box that holds blocks.
	const onStyles = styles.flatMap(({ block, css, holdsBlocks }) =>
		check(css, holdsBlocks ? [...styleRules, ...boxRules] : styleRules).map(
			({ nodes: _, ...found }) => ({ ...found, blocks: [block] }),
		),
	)
	return [...onElements, ...onStyles]
}
