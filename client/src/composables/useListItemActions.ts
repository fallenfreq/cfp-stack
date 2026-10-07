import { showConfirm, showPrompt } from '@/services/promptModal'
import { notify } from '@/services/toast'
import { isSlug, notASlug, slugCase } from '@somefreq-app/shared/slug'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

type Save<T> = (input: T) => Promise<unknown>

export function useListItemActions(options: {
	queryKey: string[]
	rename: Save<{ id: number; name: string }>
	changeSlug: Save<{ id: number; slug: string }>
	publish: Save<{ id: number; published: boolean }>
	delete: Save<number>
	renameMessage?: (current: string) => string
	slugMessage?: (current: string) => string
	deleteMessage?: (id: number, name: string) => string
}) {
	const queryClient = useQueryClient()

	const renameMsg = options.renameMessage ?? ((n) => `New name for "${n}"`)
	const slugMsg =
		options.slugMessage
		?? ((s) => `New slug for "${s}"\n⚠ Changing this breaks existing links.`)
	const deleteMsg = options.deleteMessage ?? ((_id, name) => `Delete "${name}"?`)

	const invalidate = () => queryClient.invalidateQueries({ queryKey: options.queryKey })

	// Each change saves, then reloads the list; one the server refuses says why
	// (config/queryClient.ts).
	const change = <T>(save: Save<T>) => useMutation({ mutationFn: save, onSuccess: invalidate })
	const rename = change(options.rename)
	const changeSlug = change(options.changeSlug)
	const publish = change(options.publish)
	const remove = change(options.delete)

	const onRename = async (id: number, currentName: string) => {
		const name = await showPrompt(renameMsg(currentName))
		if (name) rename.mutate({ id, name })
	}

	const onChangeSlug = async (id: number, currentSlug: string) => {
		const slug = await showPrompt(slugMsg(currentSlug), slugCase)
		if (!slug) return
		if (!isSlug(slug)) {
			notify({ message: notASlug, variant: 'danger' })
			return
		}
		changeSlug.mutate({ id, slug })
	}

	const onPublish = (id: number, published: boolean) => publish.mutate({ id, published })

	const onDelete = async (id: number, name: string) => {
		const ok = await showConfirm(deleteMsg(id, name), { okText: 'Delete' })
		if (ok) remove.mutate(id)
	}

	return { invalidate, onRename, onChangeSlug, onPublish, onDelete }
}
