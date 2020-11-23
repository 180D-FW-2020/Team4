<template>
  <footer class="footer">
    <div class="container">
      <div class="content">
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "footer"
};
</script>

<style lang="scss" scoped>
.footer {
  width: 100%;
  padding-bottom: 3rem;
  text-align: right;
  @media screen and (max-width: 500px) {
    text-align: center;
  }
}
</style>
