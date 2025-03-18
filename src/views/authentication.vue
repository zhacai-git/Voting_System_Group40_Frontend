<template>
  <div class="vote-entrance-container">
    <a-card :bordered="false" class="auth-card">
      <!-- 登录表单 -->
      <div v-if="!isRegistering">
        <div class="title-row">
          <a-button type="text" class="back-arrow" @click="goToVoteEntrance">
            <left-outlined />
          </a-button>
          <h2 class="title">Login</h2>
        </div>

        <a-form :model="loginForm" class="auth-form">
          <a-form-item>
            <a-input
                v-model:value="loginForm.username"
                placeholder="Email"
                size="large"
            />
          </a-form-item>

          <a-form-item>
            <a-input-password
                v-model:value="loginForm.password"
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
                @click="handle_login"
            >
              Login
            </a-button>
          </a-form-item>
        </a-form>

        <div class="divider-text">Or</div>

        <div class="switch-form-text">
          <span>Don't have an account? </span>
          <a class="text-link" @click="toggleForm">Register now</a>
        </div>
      </div>

      <!-- 注册表单 -->
      <div v-else>
        <div class="title-row">
          <a-button type="text" class="back-arrow" @click="goToVoteEntrance">
            <left-outlined />
          </a-button>
          <h2 class="title">Create Account</h2>
        </div>

        <a-form :model="registerForm" class="auth-form">
          <a-form-item>
            <a-input
                v-model:value="registerForm.username"
                placeholder="Username"
                size="large"
            />
          </a-form-item>

          <a-form-item>
            <a-input
                v-model:value="registerForm.email"
                placeholder="Email Address"
                size="large"
            />
          </a-form-item>

          <a-form-item>
            <a-input-password
                v-model:value="registerForm.password"
                placeholder="Password"
                size="large"
            />
          </a-form-item>

          <a-form-item>
            <a-input-password
                v-model:value="registerForm.confirmPassword"
                placeholder="Confirm Password"
                size="large"
            />
          </a-form-item>

          <a-form-item>
            <a-button
                type="primary"
                block
                size="large"
                class="submit-btn"
                @click="handle_register"
            >
              Register
            </a-button>
          </a-form-item>
        </a-form>

        <div class="divider-text">Or</div>

        <div class="switch-form-text">
          <span>Already have an account? </span>
          <a class="text-link" @click="toggleForm">Login</a>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { LeftOutlined } from '@ant-design/icons-vue';
import useUserAuth from "@/api/authentication.js";
import {useAuthStore} from "@/stores/authentication.js";
import {message} from "ant-design-vue";

// 路由实例
const router = useRouter();
const { login, register } = useUserAuth();
const store = useAuthStore();

// 控制显示哪个表单
const isRegistering = ref(false);

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
});

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// 在登录和注册表单之间切换
const toggleForm = () => {
  isRegistering.value = !isRegistering.value;
};

// 返回投票入口页面
const goToVoteEntrance = () => {
  router.push('/');
};

// 登录处理函数
const handle_login = () => {
  // router.push({name: 'create'})
  login(loginForm.username, loginForm.password).then(res => {
    console.log(res);
    if (!res.data.error) {
      store.setLogin(res.data);
      message.success("Welcome, " + store.username);
      router.push({name: 'create'});
    } else {
      message.error("The email or password is incorrect, please try again");
    }
    // if (res.data.success) {
    //   // 登录成功后的逻辑
    // }
  }).catch(err => {
    console.log(err);
    if (err.response) {
      message.error("The email or password is incorrect, please try again");
    } else {
      message.error("Connection error, please check your internet connection.")
    }
  })
};

// 注册处理函数
const handle_register = () => {
  // 将由用户实现
  if (registerForm.username.trim() !== '' && registerForm.email.trim() !== '' && registerForm.password.trim() !== '') {
    if (registerForm.password === registerForm.confirmPassword) {
      register(registerForm.username, registerForm.email, registerForm.password).then(res => {
        console.log(res);
        if (res.data.access) {
          res.data.user_id = res.data.user.customer_id;
          res.data.name = res.data.user.name;
          store.setLogin(res.data);
          message.success("Register success, redirecting..");
          router.push({name: 'create'});
        }
      }).catch(err => {
        console.log(err);
        message.error("Something wrong happened, please check the console.");
      })
    } else {
      message.warn('Passwords do not match.');
    }
  } else {
    message.warn('Please fill in the content.');
  }
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

/* 覆盖一些Ant Design默认样式 */
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