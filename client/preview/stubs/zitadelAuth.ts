// Stand-in for '@/services/zitadelAuth'. The preview never authenticates; any property
// read or call returns the same inert object so auth-aware modules can still load.
const inert: any = new Proxy(() => undefined, {
	get: (_t, prop) =>
		prop === 'then' ? undefined : prop === Symbol.toPrimitive ? () => '' : inert,
	apply: () => inert,
})

export default inert
