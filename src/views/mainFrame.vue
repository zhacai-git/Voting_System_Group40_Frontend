<template>
  <div class="app-container">
    <div class="header">
      <h2 class="system-title">Online Voting System</h2>
      <span class="version-info">ITECH Group 40 Sys. Ver: 0.1.1.250318</span>
    </div>

    <div class="content-area">
      <!-- 路由视图将在这里渲染子组件 -->
      <router-view />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Arial', sans-serif;
  padding-bottom: 2rem;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  width: 100%;
  box-sizing: border-box;
}

.system-title {
  font-size: 1.3rem;
  color: #444;
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
}

.version-info {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
  margin-left: 1rem;
}

.content-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>