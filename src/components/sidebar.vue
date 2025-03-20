<template>
  <div class="sidebar-container">
    <a-menu
        mode="inline"
        :selectedKeys="selectedKeys"
        style="height: 100%"
    >
      <a-menu-item key="manage" @click="navigateTo('manage')">
        <template #icon><control-outlined /></template>
        {{store.is_admin ? "All Votes" : "My Votes"}}
      </a-menu-item>
      <a-menu-item key="create" @click="navigateTo('create')">
        <template #icon><form-outlined /></template>
        Create a Vote
      </a-menu-item>
      <a-menu-item key="profile" @click="navigateTo('profile')" v-if="!store.is_admin">
        <template #icon><user-outlined /></template>
        Profile
      </a-menu-item>
      <a-menu-item key="logout" @click="handleLogout">
        <template #icon><LogoutOutlined /></template>
        Logout
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { FormOutlined, ControlOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import {useAuthStore} from "@/stores/authentication.js";
import {message} from "ant-design-vue";
const store = useAuthStore();
const router = useRouter();
const route = useRoute();

// Define active navigation item with default value
const activeItem = ref('create');

// Watch for route changes and update the activeItem accordingly
watch(
    () => route.name,
    (newRouteName) => {
      if (newRouteName) {
        activeItem.value = newRouteName.toString();
      }
    },
    { immediate: true } // This will run on component mount
);

// Set initial activeItem based on current route on component mount
onMounted(() => {
  if (route.name) {
    activeItem.value = route.name.toString();
  }
});

// Create an array of selected keys from activeItem
const selectedKeys = computed(() => [activeItem.value]);

// Function to navigate to a route
const navigateTo = (routeName) => {
  activeItem.value = routeName;
  router.push({ name: routeName });
};

const handleLogout = () => {
  store.setLogout()
  message.success("You have successfully logged out.")
  router.push({name: 'login'})
}

// Expose active item to parent component
defineExpose({ activeItem });
</script>

<style scoped>
.sidebar-container {
  width: 200px;
  border-right: 1px solid #f0f0f0;
  background: #fff;
}
:deep(.ant-menu) {
  height: 100%;
  font-size: 18px;
}
</style>