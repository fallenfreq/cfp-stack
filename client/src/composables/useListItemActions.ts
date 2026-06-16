import { showPrompt } from '@/services/promptModal'
import { isValidSlug } from '@/utils/slug'
import { useQueryClient } from '@tanstack/vue-query'
import { useModal, useToast } from 'vuestic-ui'

export function useListItemActions(options: {
	queryKey: string[]
	rename: (id: number, name: string) => Promise<unknown>
	changeSlug: (id: number, slug: string) => Promise<unknown>
	delete: (id: number) => Promise<unknown>
	renameMessage?: (current: string) => string
	slugMessage?: (current: string) => string
	deleteMessage?: (id: number, name: string) => string
}) {
	const queryClient = useQueryClient()
	const { confirm } = useModal()
	const { notify } = useToast()

	const renameMsg = options.renameMessage ?? ((n) => `New name for "${n}"`)
	const slugMsg =
		options.slugMessage
		?? ((s) => `New slug for "${s}"\n⚠ Changing this breaks existing links.`)
	const deleteMsg = options.deleteMessage ?? ((_id, name) => `Delete "${name}"?`)

	const invalidate = () => queryClient.invalidateQueries({ queryKey: options.queryKey })

	const onRename = async (id: number, currentName: string) => {
		const name = await showPrompt(renameMsg(currentName))
		if (!name) return
		await options.rename(id, name)
		await invalidate()
	}

	const onChangeSlug = async (id: number, currentSlug: string) => {
		const slug = await showPrompt(slugMsg(currentSlug), (value) => value.toLowerCase())
		if (!slug) return
		if (!isValidSlug(slug)) {
			notify({
				message: 'Slug may only contain letters, numbers, and hyphens',
				color: 'danger',
			})
			return
		}
		await options.changeSlug(id, slug)
		await invalidate()
	}

	const onDelete = async (id: number, name: string) => {
		const ok = await confirm({
			message: deleteMsg(id, name),
			okText: 'Delete',
			cancelText: 'Cancel',
		})
		if (!ok) return
		await options.delete(id)
		await invalidate()
	}

	return { invalidate, onRename, onChangeSlug, onDelete }
}
