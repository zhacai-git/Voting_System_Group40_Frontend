<template>
  <div class="voting-card">
    <h1 class="title">Enter Vote Number</h1>

    <div class="input-group">
      <input
          type="text"
          v-model="displayVoteNumber"
          @input="formatVoteNumber"
          placeholder="1234 5678"
          class="vote-input"
          maxlength="9"
      />
    </div>

    <button class="primary-btn" @click="joinVote" :disabled="!isValidVoteNumber">Join Vote</button>

    <div class="divider">
      <span>Or</span>
    </div>

    <div class="create-text">
      <span class="text-link" >Create / Manage a vote</span>
    </div>

    <button class="secondary-btn" @click="goToLogin">Login</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

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
  }
};

// 导航到登录页
const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.voting-card {
  width: 350px;
  padding: 1.8rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  box-sizing: border-box;
}

.title {
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.input-group {
  margin-bottom: 1.2rem;
  display: flex;
  justify-content: center;
}

.vote-input {
  width: 70%;
  padding: 12px 15px;
  font-size: 1.1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  text-align: center;
  color: #555;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.vote-input:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.15);
}

.primary-btn {
  width: 100%;
  padding: 12px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-btn:hover {
  background-color: #3a5bd9;
}

.primary-btn:disabled {
  background-color: #a0aff0;
  cursor: not-allowed;
}

.secondary-btn {
  width: 100%;
  padding: 12px;
  background-color: white;
  color: #4a6cf7;
  border: 1px solid #4a6cf7;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.secondary-btn:hover {
  background-color: #f7f9ff;
}

.divider {
  position: relative;
  margin: 1.5rem 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #eee;
  z-index: 1;
}

.divider span {
  position: relative;
  z-index: 2;
  background-color: white;
  padding: 0 15px;
  color: #888;
  font-size: 0.9rem;
}

.create-text {
  margin-bottom: 1.2rem;
}

.text-link {
  color: #4a6cf7;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.text-link:hover {
  color: #3a5bd9;
  text-decoration: none;
}
</style>