<template>
  <div class="vote-entrance-container">
    <a-card :bordered="false" class="voting-card">
      <h2 class="title">Enter Vote Number</h2>

      <a-input
          v-model:value="displayVoteNumber"
          @input="formatVoteNumber"
          placeholder="1234 5678"
          class="vote-input"
          :maxLength="9"
      />

      <a-button
          class="join-btn"
          block
          @click="joinVote"
          :disabled="!isValidVoteNumber"
      >
        Join Vote
      </a-button>

      <div class="divider-text">
        Or
      </div>

      <div class="create-text">
        <a @click="goToCreate" class="manage-link">Create / Manage a vote</a>
      </div>

      <a-button
          class="login-btn"
          block
          @click="goToLogin"
      >
        Login
      </a-button>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {useVote} from "@/stores/vote.js";

const store = useVote();

// 路由实例
const router = useRouter();

// 用于显示的格式化投票号码
const displayVoteNumber = ref('');
// 实际存储的无格式投票号码
const actualVoteNumber = ref('');

// 检查投票号码是否有效（8位数字）
const isValidVoteNumber = computed(() => {
  return /^\d{8}$/.test(actualVoteNumber.value);
});

// 格式化投票号码
const formatVoteNumber = () => {
  // 移除所有非数字字符
  let digitsOnly = displayVoteNumber.value.replace(/\D/g, '');

  // 限制最多8位数字
  if (digitsOnly.length > 8) {
    digitsOnly = digitsOnly.substring(0, 8);
  }

  // 存储实际的数字值（无空格）
  actualVoteNumber.value = digitsOnly;

  // 添加中间的空格（当有超过4位数字时）
  if (digitsOnly.length > 4) {
    displayVoteNumber.value = `${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4)}`;
  } else {
    displayVoteNumber.value = digitsOnly;
  }
};

// 加入投票函数
const joinVote = () => {
  if (isValidVoteNumber.value) {
    console.log(`加入投票: ${actualVoteNumber.value}`);
    // 这里可以添加其他实现逻辑
    store.setCode(isValidVoteNumber.value);
    router.push({name: 'vote'})
  }
};

// 导航到登录页
const goToLogin = () => {
  router.push('/login');
};

// 导航到创建/管理页面
const goToCreate = () => {
  // 添加导航逻辑，比如：
  // router.push('/manage');
  console.log('导航到创建/管理页面');
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

.voting-card {
  width: 350px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  font-weight: 500;
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
}

.vote-input {
  margin-bottom: 16px;
  text-align: center;
  font-size: 15px;
}

.join-btn {
  height: 40px;
  font-size: 16px;
  background-color: #8aa2ff !important;
  border-color: #8aa2ff !important;
  color: white !important;
  margin-bottom: 16px;
  border-radius: 4px;
}

.join-btn:hover {
  background-color: #7991eb !important;
  border-color: #7991eb !important;
}

.join-btn[disabled] {
  background-color: #c3cdf0 !important;
  border-color: #c3cdf0 !important;
  color: white !important;
}

.divider-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 16px 0;
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

.create-text {
  text-align: center;
  margin-bottom: 16px;
}

.manage-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}

.manage-link:hover {
  color: #40a9ff;
}

.login-btn {
  height: 40px;
  font-size: 16px;
  background-color: transparent !important;
  color: #1890ff !important;
  border-color: #d9d9d9 !important;
  border-radius: 4px;
}

.login-btn:hover {
  color: #40a9ff !important;
  border-color: #40a9ff !important;
}

/* 覆盖一些Ant Design默认样式 */
:deep(.ant-card-body) {
  padding: 24px;
}

:deep(.ant-input) {
  border-radius: 4px;
}

:deep(.ant-input:focus) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}
</style>