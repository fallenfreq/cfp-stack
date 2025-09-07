import { builders as b, namedTypes as n, visit } from 'ast-types'
import { parse, print } from 'recast'
import typescriptParser from 'recast/parsers/typescript'
import type { Plugin } from 'vite'

export function piniaHMRPlugin(): Plugin {
	return {
		name: 'vite-plugin-pinia-hmr',
		transform(code, id) {
			// Only process store files
			if (id.includes('/stores/') && id.endsWith('.ts')) {
				const ast = parse(code, {
					parser: typescriptParser,
				})

				let hasHMR = false
				let hasAcceptHMRImport = false
				let piniaImportNode: n.ImportDeclaration | null = null

				// Traverse the AST to find `defineStore` calls and check for existing HMR code and imports
				visit(ast, {
					visitImportDeclaration(path) {
						if (path.node.source.value === 'pinia') {
							piniaImportNode = path.node // Save the Pinia import node
							// Check if `acceptHMRUpdate` is already imported
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

				// Only wrap `defineStore` calls if no HMR logic exists
				if (!hasHMR) {
					// Add `acceptHMRUpdate` to the existing Pinia import if it exists
					if (!hasAcceptHMRImport && piniaImportNode) {
						piniaImportNode = piniaImportNode as n.ImportDeclaration
						piniaImportNode.specifiers?.push(
							b.importSpecifier(b.identifier('acceptHMRUpdate')),
						)
					} else if (!hasAcceptHMRImport) {
						// Add a new import statement if no Pinia import exists
						const importStatement = parse(`import { acceptHMRUpdate } from 'pinia';`, {
							parser: typescriptParser,
						})
						ast.program.body.unshift(importStatement.program.body[0])
					}

					// Wrap all `defineStore` calls in IIFEs that include HMR logic
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

								// Replace the original `defineStore(...)` call with the IIFE
								path.replace(storeIIFE)
								// Stop traversing the children of this node since it now contains the `defineStore` call
								// which would cause stack overflow as `defineStore` is repeatedly wrapped and replaced
								return false
							}
							this.traverse(path)
						},
					})
				}

				// Generate the updated code
				const updatedCode = print(ast).code
				return updatedCode
			}
			return code
		},
	}
}
