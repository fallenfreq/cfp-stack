<template>
	<!-- The browser's modal dialog: the page behind can't be reached, focus stays inside,
	     Esc cancels, and focus goes back where it was on close. The dialog itself is the
	     full-screen backdrop; the box sits centred inside it. -->
	<dialog
		ref="dialog"
		class="prompt-modal sf-scrim"
		:aria-labelledby="labelId"
		@cancel.prevent="cancelModal"
		@close="cancelModal"
	>
		<!-- The page outside is shut off from screen readers while this is open. -->
		<SfAnnouncer />
		<div v-if="request" class="prompt-cover sl-cover">
			<form class="prompt-content sf-depth-3 sl-stack sf-gap-sm" @submit.prevent="submit">
				<!-- A prompt's message is the question its field answers, so it labels the
				     field; a confirm's message is the dialog's heading. -->
				<label
					v-if="request.kind === 'prompt'"
					:id="labelId"
					:for="inputId"
					class="prompt-message sf-heading-2"
				>
					{{ request.message }}
				</label>
				<h2 v-else :id="labelId" class="prompt-message sf-heading-2">
					{{ request.message }}
				</h2>
				<input
					v-if="request.kind === 'prompt'"
					:id="inputId"
					v-model="userInput"
					type="text"
					class="sf sf-field sf-on-focus"
					:autocapitalize="request.transform ? 'none' : undefined"
					:autocorrect="request.transform ? 'off' : undefined"
					autofocus
				/>
				<div class="button-group sl-cluster sf-gap-xs">
					<SfButton
						type="submit"
						:loudness="3"
						:variant="request.kind === 'confirm' ? 'danger' : 'primary'"
					>
						{{ request.kind === 'confirm' ? request.okText : 'Submit' }}
					</SfButton>
					<!-- On a confirm, focus starts here so Enter never confirms by accident. -->
					<SfButton
						:loudness="2"
						:autofocus="request.kind === 'confirm'"
						@click="cancelModal"
					>
						Cancel
					</SfButton>
				</div>
			</form>
		</div>
	</dialog>
</template>

<script setup lang="ts">
import { cancelModal, modalRequest } from '@/services/promptModal'
import { computed, nextTick, ref, useId, watch } from 'vue'

const labelId = useId()
const inputId = useId()
const dialog = ref<HTMLDialogElement | null>(null)
const request = modalRequest

const rawInput = ref('')
const userInput = computed({
	get: () => rawInput.value,
	set: (value) => {
		const current = request.value
		const transform = current?.kind === 'prompt' ? current.transform : undefined
		rawInput.value = transform ? transform(value) : value
	},
})

// Open when a question arrives (after it renders, so autofocus finds its element).
watch(request, async (current) => {
	rawInput.value = ''
	await nextTick()
	const el = dialog.value
	if (!el) return
	if (current && !el.open) el.showModal()
	if (!current && el.open) el.close()
})

const submit = () => {
	const current = request.value
	if (!current) return
	request.value = null
	if (current.kind === 'prompt') current.resolve(rawInput.value)
	else current.resolve(true)
}
</script>

<style scoped>
@layer ui {
	/* Fills the screen above everything; sf-scrim draws it. The browser's own dialog box
	   styles are cleared, and its own backdrop is left clear so only sf-scrim shows. */
	.prompt-modal {
		inline-size: 100%;
		block-size: 100%;
		max-inline-size: none;
		max-block-size: none;
		margin: 0;
		padding: 0;
		border: 0;
		color: inherit;
	}
	.prompt-modal::backdrop {
		background: none;
	}

	/* sl-cover centres the box; the page margin keeps it off the screen edges on phones. */
	.prompt-cover {
		block-size: 100%;
		padding-inline: var(--sf-spacing_page);
	}

	/* sl-cover centres its child at its content width; the box fills up to its cap. */
	.prompt-content {
		width: 100%;
		max-width: 32rem;
	}

	/* Messages may hold line breaks. */
	.prompt-message {
		white-space: pre-line;
	}

	/* Flex rows right-align with justify-content (sl-align-x-* is grid-only). */
	.button-group {
		justify-content: end;
	}
}
</style>
