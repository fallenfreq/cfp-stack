import { ref, type Ref } from 'vue'

export function useService<T>(promise: Promise<T> | (() => Promise<T>)) {
  const data: Ref<T | null> = ref(null)
  const error: Ref<any> = ref(null)
  const isLoading: Ref<boolean> = ref(true)

  return {
    data,
    error,
    isLoading,
    async run() {
      isLoading.value = true
      try {
        data.value = await (typeof promise === 'function' ? promise() : promise)
      } catch (err: any) {
        error.value = err
      } finally {
        isLoading.value = false
        return this
      }
    }
  }
}
