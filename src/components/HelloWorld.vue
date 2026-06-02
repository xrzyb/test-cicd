<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
}>(), {
  name: 'World'
})

// 下面两行仅用于验证 trim-plugin，build 后 dist 里不应出现
console.log('HelloWorld mounted, name =', props.name)
debugger
</script>

<template>
  <h1>Hello {{ props.name }}</h1>
</template>

<style scoped>

</style>
