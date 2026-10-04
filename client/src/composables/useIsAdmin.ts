import { hasRole } from '@/services/session'
import { computed } from 'vue'

export function useIsAdmin() {
	return computed(() => hasRole('admin'))
}
