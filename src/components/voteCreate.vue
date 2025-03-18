<template>
  <div class="create-vote-container">
    <h2 class="section-title">Create Vote</h2>

    <a-form layout="vertical" :model="formState">
      <a-form-item label="Vote Name:">
        <a-row :gutter="16" align="middle">
          <a-col :flex="1">
            <a-input
                v-model:value="formState.voteName"
                placeholder="Enter vote name"
                size="large"
            />
          </a-col>
          <!--          <a-col>-->
          <!--            <a-checkbox v-model:checked="formState.isPublic">-->
          <!--              Public Vote-->
          <!--            </a-checkbox>-->
          <!--          </a-col>-->
        </a-row>
      </a-form-item>

      <a-form-item label="End Time:">
        <a-row :gutter="16" align="middle">
          <a-col :span="14">
            <a-date-picker
                v-model:value="formState.endTime"
                :disabled="formState.isUnlimited"
                size="large"
                :show-time="{ format: 'HH:mm:ss' }"
                format="YYYY-MM-DD HH:mm:ss"
                :disabledDate="disabledDate"
                :disabledTime="disabledDateTime"
                placeholder="Select end date and time"
                style="width: 100%"
            />
            <div class="time-format-hint">Time format: Hours:Minutes:Seconds</div>
          </a-col>
          <a-col>
            <a-checkbox v-model:checked="formState.isUnlimited">
              No End Time
            </a-checkbox>
          </a-col>
        </a-row>
      </a-form-item>

      <a-form-item label="Chart Style:">
        <a-select
            v-model:value="formState.voteStyle"
            size="large"
            style="width: 100%"
        >
          <a-select-option value="barChart">Bar Chart</a-select-option>
          <a-select-option value="pieChart">Pie Chart</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="Options:">
        <div v-for="(option, index) in formState.options" :key="index" class="option-row">
          <a-input
              v-model:value="formState.options[index]"
              :placeholder="`Option ${index + 1}`"
              size="large"
              class="option-input"
          />
          <a-button
              type="text"
              :disabled="formState.options.length <= 1"
              danger
              shape="circle"
              @click="removeOption(index)"
              class="remove-btn"
          >
            <template #icon><minus-outlined /></template>
          </a-button>
        </div>
        <div class="option-buttons">
          <a-button
              type="dashed"
              @click="addOption"
              class="add-btn"
          >
            <template #icon><plus-outlined /></template>
            Add Option
          </a-button>
        </div>
      </a-form-item>

      <a-form-item>
        <a-space size="middle">
          <a-button type="primary" size="large" @click="createVote" :disabled="!isFormValid">
            Create Vote
          </a-button>
          <a-popconfirm
              title="Are you sure you want to cancel?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="resetForm"
          >
            <a-button size="large">
              Cancel
            </a-button>
          </a-popconfirm>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue';
import { message } from "ant-design-vue";
import dayjs from 'dayjs';

import useVoteApi from "@/api/vote.js";
const {create_vote} = useVoteApi();

import {useRouter} from "vue-router";
const router = useRouter();

// Form state
const formState = reactive({
  voteName: '',
  isPublic: false,
  endTime: null,
  isUnlimited: false,
  voteStyle: 'barChart',
  options: ['']
});

// Compute if form is valid
const isFormValid = computed(() => {
  // Check if vote name is not empty
  if (!formState.voteName.trim()) return false;

  // Check if end time is set or unlimited is checked
  if (!formState.isUnlimited && !formState.endTime) return false;

  // Check if all options have content
  return formState.options.every(option => option.trim() !== '') && formState.options.length > 1;
});

// Disabled date - prevent selecting dates in the past
const disabledDate = (current) => {
  // Can't select days before today
  return current && current < dayjs().startOf('day');
};

// Disabled time - prevent selecting times in the past if date is today
const disabledDateTime = (date) => {
  if (date && date.isSame(dayjs(), 'day')) {
    const hours = [];
    const minutes = [];
    const seconds = [];
    const currentHour = dayjs().hour();
    const currentMinute = dayjs().minute();
    const currentSecond = dayjs().second();

    // Disable past hours
    for (let i = 0; i < currentHour; i++) {
      hours.push(i);
    }

    // If selected hour is current hour, disable past minutes
    if (date && date.hour() === currentHour) {
      for (let i = 0; i < currentMinute; i++) {
        minutes.push(i);
      }

      // If selected minute is current minute, disable past seconds
      if (date && date.minute() === currentMinute) {
        for (let i = 0; i < currentSecond; i++) {
          seconds.push(i);
        }
      }
    }

    return {
      disabledHours: () => hours,
      disabledMinutes: () => minutes,
      disabledSeconds: () => seconds
    };
  }
  return {};
};

// Add new option
const addOption = () => {
  if (formState.options.length >= 8) {
    message.warn("Only up to 8 options can be added");
  } else {
    formState.options.push('');
  }
};

// Remove option
const removeOption = (index) => {
  // Ensure at least one option remains
  if (formState.options.length > 1) {
    formState.options.splice(index, 1);
  }
};

// Reset form
const resetForm = () => {
  formState.voteName = '';
  formState.isPublic = false;
  formState.endTime = null;
  formState.isUnlimited = false;
  formState.voteStyle = 'barChart';
  formState.options = [''];

  message.info('Form has been reset');
};

// Format date for PostgreSQL
const formatDateForPostgres = (date) => {
  if (!date) return null;
  return date.format('YYYY-MM-DD HH:mm:ss');
};

// Create vote
const createVote = () => {
  if (!isFormValid.value) {
    message.error('Please fill in all required fields');
    return;
  }

  // Create data object to send to backend
  const voteData = {
    title: formState.voteName,
    isPublic: formState.isPublic,
    is_unlimited: formState.isUnlimited,
    cut_off: formState.isUnlimited ? null : formatDateForPostgres(formState.endTime),
    style: formState.voteStyle,
    options: formState.options.filter(opt => opt.trim() !== '')
  };

  console.log('Creating vote with:', voteData);
  create_vote(voteData).then(res => {
    console.log(res);
    message.success('Vote created successfully!');
    resetForm();
    router.push({name: 'manage'});
  }).catch(err => {
    console.log(err);
    message.error("Vote create failed, please try again.")
  })
  // Here you would implement the API call to submit the vote data
  // Example: createVoteAPI(voteData).then(response => {...})


};
</script>

<style scoped>
.create-vote-container {
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

.time-format-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.option-input {
  flex: 1;
}

.option-buttons {
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
}

.add-btn {
  color: #8aa2ff;
  border-color: #8aa2ff;
}

.add-btn:hover {
  color: #7991eb;
  border-color: #7991eb;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-form-item-label > label) {
  font-size: 1.1rem;
  font-weight: 500;
}

:deep(.ant-input:focus),
:deep(.ant-input-number-focused),
:deep(.ant-select-focused .ant-select-selector),
:deep(.ant-picker-focused) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}

:deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector),
:deep(.ant-picker:focus),
:deep(.ant-picker-focused) {
  border-color: #8aa2ff;
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}

:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector),
:deep(.ant-picker:hover) {
  border-color: #8aa2ff;
}

:deep(.ant-input-number:hover),
:deep(.ant-input:hover) {
  border-color: #8aa2ff;
}

:deep(.ant-btn-primary) {
  background-color: #5a76e8; /* 更深的蓝色 */
  border-color: #5a76e8;
}

:deep(.ant-btn-primary:hover) {
  background-color: #4a63d0; /* 悬停时更深 */
  border-color: #4a63d0;
}
</style>