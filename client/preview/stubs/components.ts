// Stand-ins for third-party (Vuestic) components. The preview checks sf/sl styling, not
// Vuestic internals, so each stub renders the smallest honest markup.
import { defineComponent, h } from 'vue'

export const stubs = {
	VaSwitch: defineComponent({
		props: { modelValue: Boolean },
		setup: (props) => () =>
			h(
				'span',
				{ role: 'switch', 'aria-checked': String(props.modelValue), class: 'va-stub' },
				[
					props.modelValue ? 'on' : 'off',
				],
			),
	}),
}
