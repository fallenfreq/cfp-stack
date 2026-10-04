import { builders as b, namedTypes as n, visit } from 'ast-types'
import { parse, print } from 'recast'
import typescriptParser from 'recast/parsers/typescript'
import type { Plugin } from 'vite'

export function piniaHMRPlugin(): Plugin {
	return {
		name: 'vite-plugin-pinia-hmr',
		transform(code, id) {
			if (id.includes('/stores/') && id.endsWith('.ts')) {
				const ast = parse(code, {
					parser: typescriptParser,
				})

				let hasHMR = false
				let hasAcceptHMRImport = false
				let piniaImportNode: n.ImportDeclaration | null = null

				// A store that already calls acceptHMRUpdate is left as it is.
				visit(ast, {
					visitImportDeclaration(path) {
						if (path.node.source.value === 'pinia') {
							piniaImportNode = path.node
							path.node.specifiers?.forEach((specifier) => {
								if (
									n.ImportSpecifier.check(specifier)
									&& specifier.imported.name === 'acceptHMRUpdate'
								) {
									hasAcceptHMRImport = true
								}
							})
						}
						this.traverse(path)
					},

					visitCallExpression(path) {
						if (
							n.Identifier.check(path.node.callee)
							&& path.node.callee.name === 'acceptHMRUpdate'
						) {
							hasHMR = true
						}
						this.traverse(path)
					},
				})

				if (!hasHMR) {
					if (!hasAcceptHMRImport && piniaImportNode) {
						piniaImportNode = piniaImportNode as n.ImportDeclaration
						piniaImportNode.specifiers?.push(
							b.importSpecifier(b.identifier('acceptHMRUpdate')),
						)
					} else if (!hasAcceptHMRImport) {
						const importStatement = parse(`import { acceptHMRUpdate } from 'pinia';`, {
							parser: typescriptParser,
						})
						ast.program.body.unshift(importStatement.program.body[0])
					}

					// Each defineStore(…) becomes (() => { const store = defineStore(…); if (import.meta.hot)
					// import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot)); return store })()
					visit(ast, {
						visitCallExpression(path) {
							if (
								n.Identifier.check(path.node.callee)
								&& path.node.callee.name === 'defineStore'
							) {
								const storeIIFE = b.callExpression(
									b.arrowFunctionExpression(
										[],
										b.blockStatement([
											b.variableDeclaration('const', [
												b.variableDeclarator(
													b.identifier('store'),
													path.node, // The original `defineStore(...)` call
												),
											]),
											b.ifStatement(
												b.identifier('import.meta.hot'),
												b.blockStatement([
													b.expressionStatement(
														b.callExpression(
															b.memberExpression(
																b.memberExpression(
																	b.identifier('import.meta'),
																	b.identifier('hot'),
																),
																b.identifier('accept'),
															),
															[
																b.callExpression(
																	b.identifier('acceptHMRUpdate'),
																	[
																		b.identifier('store'),
																		b.identifier(
																			'import.meta.hot',
																		),
																	],
																),
															],
														),
													),
												]),
											),
											b.returnStatement(b.identifier('store')),
										]),
									),
									[],
								)

								path.replace(storeIIFE)
								// Not into the new node: it holds the same defineStore call, which would be wrapped
								// again and again.
								return false
							}
							this.traverse(path)
						},
					})
				}

				const updatedCode = print(ast).code
				return updatedCode
			}
			return code
		},
	}
}
