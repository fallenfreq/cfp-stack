<template>
  <div class="dropdown-menu">
    <template v-if="items.length">
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="['menu-item', { 'is-selected': index === selectedIndex }]"
        @click="selectItem(index)"
      >
        {{ item.title }}
      </div>
    </template>
    <div class="menu-item no-commands" v-else>No Commands</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps } from 'vue'

const props = defineProps<{
  items: { title: string; command: (args: { editor: any; range: any }) => void }[]
  editor: any
  range: any
}>()

const selectedIndex = ref(0)

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0
  }
)

const selectItem = (index: number) => {
  const item = props.items[index]
  if (item) {
    item.command({ editor: props.editor, range: props.range })
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (props.items.length === 0) return

  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
    scrollSelectedIntoView()
    return true
  } else if (event.key === 'ArrowUp') {
    selectedIndex.value = (selectedIndex.value - 1 + props.items.length) % props.items.length
    scrollSelectedIntoView()
    return true
  } else if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }
}

const scrollSelectedIntoView = () => {
  const menu = document.querySelector('.dropdown-menu') as HTMLElement
  const items = menu?.querySelectorAll('.menu-item') as NodeListOf<HTMLElement>
  const selectedItem = items[selectedIndex.value]

  if (menu && selectedItem) {
    const menuRect = menu.getBoundingClientRect()
    const itemRect = selectedItem.getBoundingClientRect()
    if (itemRect.top < menuRect.top) {
      menu.scrollTop -= menuRect.top - itemRect.top
    } else if (itemRect.bottom > menuRect.bottom) {
      menu.scrollTop += itemRect.bottom - menuRect.bottom
    }
  }
}

defineExpose({ onKeyDown })
</script>

<style>
.dropdown-menu {
  background: rgb(var(--backgroundSecondary));
  border: 1px solid rgb(var(--backgroundBorder));
  border-radius: 4px;
  padding: 8px;
  max-height: 200px; /* Set max height */
  overflow-y: auto; /* Enable scrolling */
  scrollbar-width: none; /* For Firefox */
}

.dropdown-menu::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Opera */
  display: flex;
  flex-direction: column; /* Stack items vertically */
}

.menu-item {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
}

.is-selected {
  background-color: rgb(var(--backgroundPrimary));
}

.no-commands {
  text-align: center;
  padding: 8px;
  color: gray;
}
</style>
