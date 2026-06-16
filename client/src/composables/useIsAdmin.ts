import zitadelAuth from '@/services/zitadelAuth'
import { computed } from 'vue'

export function useIsAdmin() {
	return computed(() => zitadelAuth.hasRole('admin'))
}
