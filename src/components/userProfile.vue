<template>
  <div class="profile-container">
    <h2 class="section-title">User Profile</h2>

    <a-spin :spinning="loading">
      <a-form layout="vertical" :model="formState" ref="formRef">
        <a-form-item
            label="Name:"
            name="name"
            :rules="[{ required: true, message: 'Please enter your name' }]"
        >
          <a-input
              v-model:value="formState.name"
              placeholder="Enter your name"
              size="large"
          />
        </a-form-item>

        <a-form-item
            label="Email:"
            name="email"
            :rules="[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]"
        >
          <a-input
              v-model:value="formState.email"
              placeholder="Enter your email"
              size="large"
          />
        </a-form-item>

        <a-form-item>
          <a-space size="middle">
            <a-button
                type="primary"
                size="large"
                @click="submitProfileData"
                :loading="submitting"
                :disabled="!isFormChanged"
            >
              Save Changes
            </a-button>
            <a-button
                size="large"
                @click="resetForm"
                :disabled="!isFormChanged"
            >
              Cancel
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import useUserAuth from "@/api/authentication.js";
const {get_profile, update_profile} = useUserAuth();
// Import the profile API functions
const useProfileApi = () => {
  // These functions would be implemented according to your API structure
  const get_profile = async () => {
    // Implementation of API call to fetch profile data
    try {
      // Replace with actual API call
      const response = await fetch('/profile/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      return { data: await response.json() };
    } catch (error) {
      console.error('Error in get_profile:', error);
      throw error;
    }
  };

  const submit_profile = async (profileData) => {
    // Implementation of API call to update profile data
    try {
      // Replace with actual API call
      const response = await fetch('/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile data');
      }

      return { data: await response.json() };
    } catch (error) {
      console.error('Error in submit_profile:', error);
      throw error;
    }
  };

  return {
    get_profile,
    submit_profile
  };
};

// Component state
const formRef = ref(null);
const loading = ref(true);
const submitting = ref(false);
const formState = reactive({
  name: '',
  email: ''
});

// Original data for reset functionality
const originalData = ref({
  name: '',
  email: ''
});

// Check if form has changed
const isFormChanged = computed(() => {
  return formState.name !== originalData.value.name ||
      formState.email !== originalData.value.email;
});

// Fetch profile data
const fetchProfileData = async () => {
  loading.value = true;
  try {
    const response = await get_profile();
    if (response && response.data) {
      formState.name = response.data.name;
      formState.email = response.data.email;

      // Store original data for reset
      originalData.value = {
        name: response.data.name,
        email: response.data.email
      };
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    message.error('Failed to load profile. Please try again.');
  } finally {
    loading.value = false;
  }
};

// Submit profile data
const submitProfileData = async () => {
  if (formRef.value) {
    try {
      // Validate form
      await formRef.value.validate();

      // If form hasn't changed, do nothing
      if (!isFormChanged.value) {
        message.info('No changes detected');
        return;
      }

      submitting.value = true;
      const response = await update_profile({
        name: formState.name,
        email: formState.email
      });

      if (response && response.data) {
        // Update original data for reset
        originalData.value = {
          name: response.data.name,
          email: response.data.email
        };
        message.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.errorFields) {
        // Form validation failed
        message.error('Please correct the errors in the form.');
      } else {
        // API call failed
        message.error('Failed to update profile. Please try again.');
      }
    } finally {
      submitting.value = false;
    }
  }
};

// Reset form to original data
const resetForm = () => {
  formState.name = originalData.value.name || '';
  formState.email = originalData.value.email || '';

  // Clear validation errors
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// Fetch data when component is mounted
onMounted(fetchProfileData);
</script>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 800px;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

:deep(.ant-form-item-label > label) {
  font-size: 1.1rem;
  font-weight: 500;
}

:deep(.ant-input:focus),
:deep(.ant-input-number-focused),
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}

:deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}

:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
  border-color: #8aa2ff;
}

:deep(.ant-input-number:hover),
:deep(.ant-input:hover) {
  border-color: #8aa2ff;
}

:deep(.ant-btn-primary) {
  background-color: #8aa2ff;
  border-color: #8aa2ff;
}

:deep(.ant-btn-primary:hover) {
  background-color: #7991eb;
  border-color: #7991eb;
}
</style>