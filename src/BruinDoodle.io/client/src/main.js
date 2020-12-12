import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import VueSweetAlert from "vue-sweetalert2";
import router from "./router.js";
import App from "./App.vue";
import Colors from "./styles/variables.scss";
import "./registerServiceWorker";

// Bulma
import "./styles/index.scss";

Vue.config.productionTip = false;

// Vue + Socket.io
Vue.use(
  new VueSocketIO({
    debug: false,
    connection: "http://192.168.68.117:5050", //"https://tranquil-ridge-32141.herokuapp.com/", //"http://localhost:5050",
  })
);

// SweetAlert2
Vue.use(VueSweetAlert, {
  confirmButtonColor: Colors.primary,
  cancelButtonColor: Colors.light,
});

// Initializing
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
