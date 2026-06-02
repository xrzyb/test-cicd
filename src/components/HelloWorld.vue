<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
}>(), {
  name: 'World'
})
</script>

<template>
  <h1>Hello {{ props.name }}</h1>
</template>

<style scoped>

</style>
