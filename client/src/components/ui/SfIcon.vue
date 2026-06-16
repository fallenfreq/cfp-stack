<template>
	<FontAwesomeIcon v-bind="$attrs" :icon="icons[name]" />
</template>

<script setup lang="ts">
import {
	faCheck,
	faChevronDown,
	faEllipsis,
	faEye,
	faEyeSlash,
	faGear,
	faGripVertical,
	faPen,
	faPlus,
	faSpinner,
	faTrash,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineOptions({ inheritAttrs: false })

const icons = {
	plus: faPlus,
	'three-dot': faEllipsis,
	'drag-handle': faGripVertical,
	check: faCheck,
	x: faXmark,
	spinner: faSpinner,
	edit: faPen,
	trash: faTrash,
	settings: faGear,
	eye: faEye,
	'eye-off': faEyeSlash,
	'chevron-down': faChevronDown,
} as const

export type IconName = keyof typeof icons

defineProps<{ name: IconName }>()
</script>
