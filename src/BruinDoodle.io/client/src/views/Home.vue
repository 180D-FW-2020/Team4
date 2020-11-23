<template>
  <div>
    <section class="section hero">
      <div class="hero-body">
        <div class="container has-text-centered">
          <div class="column is-6 is-offset-3">
            <h2 class="title is-1">BruinDoodle.io 🐻✏️</h2>
          </div>
        </div>
      </div>
    </section>

    <section class="section-xs container has-text-centered">
      <button class="button is-primary is-large " @click="openCreator">
        <strong>Create a room</strong>
      </button>
    </section>
  </div>
</template>

<script>
export default {
  name: "homepage",
  methods: {
    openCreator() {
      this.$emit("openCreator");
    },
  },
};
</script>

<style lang="scss" scoped>
.button {
  margin: 2% 0;
}
</style>
