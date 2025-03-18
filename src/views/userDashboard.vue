<template>
  <div class="user-dashboard">
    <div class="dashboard-container">
      <sidebarNav ref="sidebar" />

      <div class="content-area">
<!--        <component :is="currentComponent" />-->
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted } from 'vue';
import sidebarNav from '../components/sidebar.vue';
// import voteCreate from '../components/voteCreate.vue';
// import manageVote from '../components/manageVote.vue'

// Reference to sidebar component
const sidebar = ref(null);

// Components for different sections
// const components = {
//   create: markRaw(voteCreate),
//   manage: markRaw(manageVote), // These would be implemented by the user
//   // profile: markRaw(() => import('./Profile.vue')),    // These would be implemented by the user
// };

// Current active component based on sidebar selection
// const currentComponent = computed(() => {
//   return components[sidebar.value?.activeItem || 'create'];
// });

// If needed, add event handlers to respond to sidebar navigation changes
</script>

<style scoped>
.user-dashboard {
  width: 100%;
  min-height: calc(100vh - 100px);
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.dashboard-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  gap: 2rem;
}

.content-area {
  flex: 1;
}

@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
  }
}
</style>