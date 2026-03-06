<template>
</template>

<script>
const userService = uniCloud.importObject('userService')

export default {
  async onLoad() {
    const res = await userService.ping()
    console.log('ping result:', res)
  }
}

</script>


<style>
</style>