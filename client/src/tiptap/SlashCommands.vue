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
    return true
  } else if (event.key === 'ArrowUp') {
    selectedIndex.value = (selectedIndex.value - 1 + props.items.length) % props.items.length
    return true
  } else if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }
}

defineExpose({ onKeyDown })
</script>

<style>
.dropdown-menu {
  background: rgb(var(--backgroundSecondary));
  border: 1px solid rgb(var(--backgroundBorder));
  border-radius: 4px;
  padding: 4px;
  overflow-y: auto;
  min-width: 200px;
  scrollbar-width: none; /* For Firefox */
}

.dropdown-menu::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Opera */
  display: flex;
  flex-direction: column;
}

.menu-item {
  cursor: pointer;
  padding: 4px 6px;
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
