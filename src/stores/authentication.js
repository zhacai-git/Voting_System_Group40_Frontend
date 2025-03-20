import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      token: '',
      refresh_token: '',
      user_id: 0,
      username: '',
      email: '',
      is_login: false,
      is_admin: false
    }
  },
  actions: {
    setToken(token) {
      this.token = token;
    },
    setRefresh(refresh_token) {
      this.refresh_token = refresh_token;
    },
    setLogin(data) {
      this.token =  data.access;
      this.refresh_token = !!data.refresh ? data.refresh : "";
      this.user_id = data.user_id;
      this.username = !!data.name ? data.name : "";
      this.email = data.user.email ? data.user.email : "";
      this.is_login = true;
      this.is_admin = !!data.admin;
    },
    setLogout() {
      this.token = "";
      this.refresh_token = "";
      this.user_id = 0;
      this.username = "";
      this.email = "";
      this.is_login = false;
      this.is_admin = false;
    }
  }
})