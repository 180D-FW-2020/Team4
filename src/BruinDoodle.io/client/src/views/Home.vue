<template>
  <div>
    <section class="section hero">
      <div class="hero-body">
        <div class="container has-text-centered">
          <div class="column is-6 is-offset-3">
            <h2 class="title is-1">🐻✏️</h2>
            <h3 class="subtitle is-2">
              Welcome to <a href="./">bruindoodle.io</a>!
            </h3>
          </div>
        </div>
      </div>
    </section>

    <section class="section-xs container has-text-centered">
      <div class="hero is-light">
        <div class="hero-body">
          <div class="content">
            <h4 class="title is-3 ">How to Play 📃</h4>
            <p>Every round takes at most 120 seconds. ⏰</p>
            <p>You need at least ✌️ players to start a game.</p>
            <p>👨‍🎨 Channel your inner Bob Ross to draw the selected word.</p>
            <p>🙋‍♀️ Use that big 🧠 of yours to guess the word.</p>
            <h5 class="title is-5">Have fun! 😎</h5>
          </div>
        </div>
      </div>

      <div>
        <button class="button is-success is-large " @click="openRoom">
          <strong>Play!</strong>
        </button>
        &nbsp;
        <button class="button is-primary is-large " @click="openCreator">
          <strong>Create Room</strong>
        </button>
      </div>

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
    openRoom() {
      this.$router.push({
        path: 'rooms'
      })
    }
  },
};
</script>

<style lang="scss" scoped>
.button {
  margin: 2% 0;
}
</style>
