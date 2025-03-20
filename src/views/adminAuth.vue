<template>
  <div class="vote-entrance-container">
    <a-card :bordered="false" class="auth-card">
      <div class="title-row">
        <a-button type="text" class="back-arrow" @click="goToVoteEntrance">
          <left-outlined />
        </a-button>
        <h2 class="title">Admin Login</h2>
      </div>

      <a-form :model="adminLoginForm" class="auth-form">
        <a-form-item>
          <a-input
              v-model:value="adminLoginForm.username"
              placeholder="Admin ID"
              size="large"
          />
        </a-form-item>

        <a-form-item>
          <a-input-password
              v-model:value="adminLoginForm.password"
              placeholder="Password"
              size="large"
          />
        </a-form-item>

        <a-form-item>
          <a-button
              type="primary"
              block
              size="large"
              class="submit-btn"
              :loading="loginLoading"
              @click="handleAdminLogin"
          >
            Login
          </a-button>
        </a-form-item>
      </a-form>

      <div class="divider-text">Or</div>

      <div class="switch-form-text">
        <span>Go back to </span>
        <a class="text-link" @click="goToVoteEntrance">main login</a>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { LeftOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import useUserAuth from "@/api/authentication.js";

const {admin_login} = useUserAuth();

import {useAuthStore} from "@/stores/authentication.js";
const store = useAuthStore();

// Router instance
const router = useRouter();
const loginLoading = ref(false);

// Admin login form data
const adminLoginForm = reactive({
  username: '',
  password: ''
});

// Return to vote entrance page
const goToVoteEntrance = () => {
  router.push('/login');
};

// Admin login handler
const handleAdminLogin =  () => {
  // Validate input
  if (!adminLoginForm.username.trim() || !adminLoginForm.password.trim()) {
    message.warning('Please enter both Admin ID and Password');
    return;
  }

  loginLoading.value = true;
  admin_login(adminLoginForm).then(res => {
    console.log(res);
    store.setLogin({
      access: res.data.token,
      user_id: res.data.admin_id,
      admin: true,
      user: {
        email: "none"
      }
    })
    message.success("Welcome Administrator");
    router.push({name: 'manage'})
    loginLoading.value = false;
  }).catch(err => {
    // message.error(err?.response.data.error);
    console.log(err);
    loginLoading.value = false;
  })


};
</script>

<style scoped>
.vote-entrance-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.auth-card {
  width: 380px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  justify-content: center;
}

.back-arrow {
  position: absolute;
  left: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: rgba(0, 0, 0, 0.65);
}

.title {
  font-size: 1.3rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
}

.auth-form {
  margin-bottom: 0;
}

.submit-btn {
  height: 40px;
  font-size: 16px;
  background-color: #8aa2ff !important;
  border-color: #8aa2ff !important;
  margin-top: 8px;
}

.submit-btn:hover {
  background-color: #7991eb !important;
  border-color: #7991eb !important;
}

.divider-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 24px 0;
  position: relative;
}

.divider-text::before,
.divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: #eee;
}

.divider-text::before {
  left: 0;
}

.divider-text::after {
  right: 0;
}

.switch-form-text {
  text-align: center;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.text-link {
  color: #1890ff;
  cursor: pointer;
}

.text-link:hover {
  color: #40a9ff;
}

/* Override some Ant Design default styles */
:deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-input),
:deep(.ant-input-password) {
  border-radius: 4px;
}

:deep(.ant-input:focus),
:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}
</style>