// What a rule is, what it gives, and running rules (client/src/assets/sf-system.md, "Validator and
// linter", "The shape"): rules that read elements, as hast, and rules that read CSS, as CSSTree.
import { type CssNode, parse } from '@eslint/css-tree'
import type { Element, Root } from 'hast'

/** A rule: the tree it reads, and the parts of that tree a result names. */
export interface Rule<Tree, Node> {
	/**
	 * Its entry in the spec's list of rules, `no-duplicate-id`, which names the section that gives
	 * its reason, so the reason is written once (client/src/assets/sf-system.md, "Validator and
	 * linter").
	 */
	name: string
	/** ESLint's: a problem, or a suggestion that only points out the usual way. */
	type: 'problem' | 'suggestion'
	/**
	 * Reports each time it's broken in the tree: what to say, and the nodes involved, the same
	 * objects it was given, so each place that checks finds them its own way (a block's position
	 * in the editor, a line in a file).
	 */
	check: (
		tree: Tree,
		report: (found: Pick<ValidatorResult<Node>, 'message' | 'nodes'>) => void,
	) => void
}

/**
 * A rule that reads elements: hast as hast's own tools make it (`hast-util-from-html`, hastscript's
 * `h()`), classes as a list in `className`, `data-pos` as `dataPos`, sizes as numbers. Built by
 * hand with HTML's names (`class`), it type-checks, but no rule finds its classes.
 */
export type ElementRule = Rule<Root, Element>

/**
 * A rule that reads CSS: CSSTree's tree, which ESLint's CSS language reads, each part with its
 * place in the text. It takes any part, as a block's own style is a list of declarations and a
 * stylesheet holds rules.
 */
export type CssRule = Rule<CssNode, CssNode>

/** One rule broken. */
export interface ValidatorResult<Node> {
	rule: Rule<unknown, Node>['name']
	type: Rule<unknown, Node>['type']
	/** Names classes, never a block: which classes come with a block is the editor's to show. */
	message: string
	/** At least one, so every display has something to mark. */
	nodes: readonly [Node, ...Node[]]
}

/** What the rules find in the tree: rule by rule, each in the order it reports them. */
export function check<Tree, Node>(
	tree: Tree,
	rules: readonly Rule<Tree, Node>[],
): ValidatorResult<Node>[] {
	const results: ValidatorResult<Node>[] = []
	for (const rule of rules)
		rule.check(tree, ({ message, nodes }) =>
			results.push({ rule: rule.name, type: rule.type, message, nodes }),
		)
	return results
}

/**
 * A block's own style (its `style` attribute) as the CSS rules read it. A custom property's value
 * is read too, so a `var()` in one is checked; CSSTree otherwise leaves it as text.
 */
export function readStyle(style: string): CssNode {
	return parse(style, { context: 'declarationList', positions: true, parseCustomProperty: true })
}
