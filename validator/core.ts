// What a rule that reads elements is, what it gives, and running such rules
// (client/src/assets/sf-system.md, "Validator and linter", "The shape").
import type { Element, Root } from 'hast'

/** A rule that reads elements, as hast: HTML's syntax tree as unified's tools have it. */
export interface ElementRule {
	/**
	 * Its entry in the spec's list of rules, `no-duplicate-id`, which names the section that gives
	 * its reason, so the reason is written once (client/src/assets/sf-system.md, "Validator and
	 * linter").
	 */
	name: string
	/** ESLint's: a problem, or a suggestion that only points out the usual way. */
	type: 'problem' | 'suggestion'
	/**
	 * Reports each time it's broken in the tree: what to say, and the elements involved, the same
	 * objects it was given, so each place that checks finds them its own way (a block's position
	 * in the editor, a line in a file).
	 */
	check: (
		tree: Root,
		report: (found: Pick<ValidatorResult, 'message' | 'elements'>) => void,
	) => void
}

/** One rule broken. */
export interface ValidatorResult {
	rule: ElementRule['name']
	type: ElementRule['type']
	message: string
	/** At least one, so every display has something to mark. */
	elements: readonly [Element, ...Element[]]
}

/**
 * What these rules find in the tree: rule by rule, each in the order it reports them. The tree is
 * hast as hast's own tools make it (`hast-util-from-html`, hastscript's `h()`): classes as a list
 * in `className`, `data-pos` as `dataPos`, sizes as numbers. Built by hand with HTML's names
 * (`class`), it type-checks, but no rule finds its classes.
 */
export function checkElements(tree: Root, rules: readonly ElementRule[]): ValidatorResult[] {
	const results: ValidatorResult[] = []
	for (const rule of rules)
		rule.check(tree, ({ message, elements }) =>
			results.push({ rule: rule.name, type: rule.type, message, elements }),
		)
	return results
}
