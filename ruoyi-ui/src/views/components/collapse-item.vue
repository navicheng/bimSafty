<template>
  <div class="el-collapse-item">
    <div role="tab">
      <div
        class="el-collapse-item__header"
      >
        <slot name="title">{{ title }}</slot>
        <i
          class="el-collapse-item__arrow el-icon-arrow-right">
        </i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "collapse-item",
  data() {
    return {
      title: ""
    }
  }
}
</script>

<style scoped>

</style>
