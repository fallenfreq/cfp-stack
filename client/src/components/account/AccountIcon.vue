<template>
	<MaterialIcon :class="{ 'sf-variant-primary': signedIn }">account_circle</MaterialIcon>
</template>

<script setup lang="ts">
import zitadelAuth from '@/services/zitadelAuth'
import { computed } from 'vue'

// The account icon, in the brand colour while you're signed in.
const signedIn = computed(() => zitadelAuth.oidcAuth.isAuthenticated)
</script>
