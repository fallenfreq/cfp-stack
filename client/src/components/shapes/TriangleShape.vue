<template>
  <div class="triangle"></div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  radius: number
  size: number
}>()

const radius = props.radius + 'px'
const size = props.size + 'px'
</script>

<style scoped>
.triangle {
  --r: v-bind(radius);
  width: v-bind(size);
  aspect-ratio: 1 / cos(30deg);
  --_g: calc(tan(60deg) * var(--r)) bottom var(--r), #000 98%, #0000 101%;
  mask:
    /* a conic gradient to fill the middle area */
    conic-gradient(from -30deg at 50% calc(200% - 3 * var(--r) / 2), #000 60deg, #0000 0) 0 100%/100%
      calc(100% - 3 * var(--r) / 2) no-repeat,
    /* 3 radial gradients for 3 circles */
      radial-gradient(var(--r) at 50% calc(2 * var(--r)), #000 98%, #0000 101%),
    radial-gradient(var(--r) at left var(--_g)),
    radial-gradient(var(--r) at right var(--_g));
  /* the 3-point polygon */
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background-color: rgba(var(--primary) / 1);
}
</style>
