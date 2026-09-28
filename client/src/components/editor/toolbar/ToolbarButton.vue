<template>
	<!-- A small toolbar button. mousedown.prevent keeps focus, and so the selection, in the
	     editor; current, disabled and click pass through to SfButton. -->
	<SfButton class="sf-is-contained" size="xs" @mousedown.prevent>
		<slot />
	</SfButton>
</template>
