import { type InjectionKey, inject } from 'vue'

const injectSafe = (key: InjectionKey<any>) => {
  return inject(key, () => {
    throw new Error(`${String(key)} is not provided!`)
  })
}

const AddKeyCombo: InjectionKey<(keyCombo: string, func: () => void) => void> =
  Symbol('AddKeyCombo')

const RemoveKeyCombo: InjectionKey<(keyCombo: string) => void> = Symbol('RemoveKeyCombo')

export { AddKeyCombo, RemoveKeyCombo, injectSafe }
