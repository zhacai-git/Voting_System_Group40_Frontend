<template>
  <div class="vote-management-container">
    <h2 class="section-title">Vote Management</h2>

    <!-- Search and Filters -->
    <div class="controls-row">
      <a-input-search
          v-model:value="searchQuery"
          placeholder="Search votes"
          allow-clear
          size="large"
          style="width: 250px"
          @search="handleSearch"
      />
      <a-space>
        <a-select
            v-model:value="filterStatus"
            placeholder="Status"
            style="width: 150px"
            size="large"
            allow-clear
        >
          <a-select-option value="active">Active</a-select-option>
          <a-select-option value="ended">Ended</a-select-option>
          <a-select-option value="draft">Draft</a-select-option>
        </a-select>
        <a-select
            v-model:value="filterStyle"
            placeholder="Chart Style"
            style="width: 150px"
            size="large"
            allow-clear
        >
          <a-select-option value="barChart">Bar Chart</a-select-option>
          <a-select-option value="pieChart">Pie Chart</a-select-option>
        </a-select>
        <a-button type="primary" size="large" @click="resetFilters">
          Reset
        </a-button>
      </a-space>
    </div>

    <!-- 投票列表表格 -->
    <a-table
        :dataSource="filteredVotes"
        :columns="columns"
        :pagination="{ pageSize: 10 }"
        :rowKey="record => record.id"
        :loading="loading"
    >
      <!-- 投票名称 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'voteName'">
          <div class="vote-name-cell">
            <span>{{ record.voteName }}</span>
            <a-tag v-if="record.isPublic" color="blue">Public</a-tag>
            <a-tag v-else color="orange">Private</a-tag>
          </div>
        </template>

        <!-- Time limit -->
        <template v-if="column.dataIndex === 'timeLimit'">
          <span v-if="record.isUnlimited">Unlimited</span>
          <span v-else>{{ record.timeLimit }} min</span>
        </template>

        <!-- 状态 -->
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>

        <!-- 样式 -->
        <template v-if="column.dataIndex === 'voteStyle'">
          <a-tag :color="getStyleColor(record.voteStyle)">
            {{ formatVoteStyle(record.voteStyle) }}
          </a-tag>
        </template>

        <!-- 创建时间 -->
        <template v-if="column.dataIndex === 'createdAt'">
          <span>{{ formatDate(record.createdAt) }}</span>
        </template>

        <!-- 操作 -->
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip title="View Results">
              <a-button
                  type="primary"
                  shape="circle"
                  size="small"
                  @click="viewResults(record)"
              >
                <template #icon><bar-chart-outlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="Edit">
              <a-button
                  type="default"
                  shape="circle"
                  size="small"
                  @click="editVote(record)"
              >
                <template #icon><edit-outlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="Delete">
              <a-button
                  danger
                  shape="circle"
                  size="small"
                  @click="confirmDelete(record)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- Vote Results Modal -->
    <a-modal
        v-model:visible="resultsModalVisible"
        :title="'Vote Result for ' + selectedVote?.code"
        width="700px"
        :footer="null"
        @cancel="stopPolling"
        @after-close="stopPolling"
    >
      <div v-if="selectedVote">
        <h3>{{ selectedVote.voteName }}</h3>

        <!-- Countdown timer for active votes with deadline -->
        <div v-if="selectedVote.status === 'active' && !selectedVote.isUnlimited" class="countdown-container">
          <a-alert
              type="info"
              show-icon
          >
            <template #message>
              <span>Time Remaining:</span>
              <span class="countdown-timer" :class="{ 'ending-soon': timeRemaining < 300 }">
                {{ formatCountdown(timeRemaining) }}
              </span>
            </template>
            <template #description>
              Vote will end on {{ formatDateTimeDetailed(selectedVote.endTime) }}
            </template>
          </a-alert>
        </div>

        <!-- Status message for ended votes -->
        <div v-if="selectedVote.status === 'ended'" class="status-container">
          <a-alert
              :message="'This vote has ended at ' + formatDateTimeDetailed(selectedVote.endTime)"
              type="warning"
              show-icon
          />
        </div>

        <!-- Status message for unlimited votes -->
        <div v-if="selectedVote.isUnlimited && selectedVote.status === 'active'" class="status-container">
          <a-alert
              message="This vote has no time limit"
              type="info"
              show-icon
          />
        </div>

        <div class="vote-results-container">
          <!-- 根据投票样式显示不同的可视化 -->
          <div v-if="selectedVote.voteStyle === 'barChart'" class="results-chart">
            <div v-for="(option, index) in selectedVote.optionsWithVotes"
                 :key="index"
                 class="bar-chart-item"
            >
              <div class="option-label">{{ option.name }}</div>
              <div class="bar-container">
                <div
                    class="bar"
                    :style="{ width: `${calculatePercentage(option.votes, selectedVote.totalVotes)}%` }"
                >
                  {{ option.votes }} votes ({{ calculatePercentage(option.votes, selectedVote.totalVotes) }}%)
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedVote.voteStyle === 'pieChart'" class="results-chart">
            <!-- 简化版的饼图数据展示 -->
            <div v-for="(option, index) in selectedVote.optionsWithVotes"
                 :key="index"
                 class="pie-chart-item"
            >
              <div class="color-box" :style="{ backgroundColor: getRandomColor(index) }"></div>
              <div class="option-label">{{ option.name }}: {{ option.votes }} votes ({{ calculatePercentage(option.votes, selectedVote.totalVotes) }}%)</div>
            </div>
          </div>

          <div v-else class="results-chart">
            <!-- Default display for unimplemented chart types -->
            <div v-for="(option, index) in selectedVote.optionsWithVotes"
                 :key="index"
                 class="bar-chart-item"
            >
              <div class="option-label">{{ option.name }}</div>
              <div class="bar-container">
                <div
                    class="bar"
                    :style="{ width: `${calculatePercentage(option.votes, selectedVote.totalVotes)}%` }"
                >
                  {{ option.votes }} votes ({{ calculatePercentage(option.votes, selectedVote.totalVotes) }}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="vote-stats">
          <a-descriptions
              title="Vote Statistics"
              bordered
              :column="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }"
          >
            <a-descriptions-item label="Total Votes">
              {{ selectedVote.totalVotes }}
            </a-descriptions-item>
            <a-descriptions-item label="Status">
              <a-tag :color="getStatusColor(selectedVote.status)">
                {{ getStatusText(selectedVote.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Created">
              {{ formatDateTimeDetailed(selectedVote.createdAt) }}
            </a-descriptions-item>
            <a-descriptions-item label="Time Limit">
              <span v-if="selectedVote.isUnlimited">Unlimited</span>
              <span v-else>{{ selectedVote.timeLimit }} minutes</span>
            </a-descriptions-item>
            <a-descriptions-item label="Code">
              {{ selectedVote.code }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
    </a-modal>

    <!-- Delete Confirmation Modal -->
    <a-modal
        v-model:visible="deleteModalVisible"
        title="Delete Vote"
        :okText="'Delete'"
        :okType="'danger'"
        :cancelText="'Cancel'"
        @ok="deleteVote"
    >
      <p>Are you sure you want to delete vote "{{ selectedVote?.voteName }}"?</p>
      <p>This action cannot be undone.</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { onBeforeUnmount } from 'vue';
import useVoteApi from "@/api/vote.js";
const { get_my_vote, get_vote } = useVoteApi();

// Component state
const searchQuery = ref('');
const filterStatus = ref('');
const filterStyle = ref('');
const loading = ref(false);
const resultsModalVisible = ref(false);
const deleteModalVisible = ref(false);
const selectedVote = ref(null);
const pollingInterval = ref(null);
const countdownInterval = ref(null);
const timeRemaining = ref(0);

// Votes data array
const votes = reactive([]);

// Watch for modal visibility to start/stop polling and countdown
watch(resultsModalVisible, (visible) => {
  console.log('Results modal visibility changed:', visible);
  if (!visible) {
    console.log('Modal closed, stopping polling and countdown');
    stopPolling();
    stopCountdown();
    // 重置选中的投票，防止后台更新
    selectedVote.value = null;
  }
});

// Table column definitions
const columns = [
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
    width: 100,
    sorter: (a, b) => a.code.localeCompare(b.code),
  },
  {
    title: 'Vote Name',
    dataIndex: 'voteName',
    key: 'voteName',
    sorter: (a, b) => a.voteName.localeCompare(b.voteName),
  },
  {
    title: 'Time Limit',
    dataIndex: 'timeLimit',
    key: 'timeLimit',
    width: 120,
    sorter: (a, b) => {
      if (a.isUnlimited && b.isUnlimited) return 0;
      if (a.isUnlimited) return 1;
      if (b.isUnlimited) return -1;
      return a.timeLimit - b.timeLimit;
    },
  },
  {
    title: 'Chart Type',
    dataIndex: 'voteStyle',
    key: 'voteStyle',
    width: 120,
    sorter: (a, b) => a.voteStyle.localeCompare(b.voteStyle),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    sorter: (a, b) => a.status.localeCompare(b.status),
  },
  // {
  //   title: 'Created',
  //   dataIndex: 'createdAt',
  //   key: 'createdAt',
  //   width: 120,
  //   sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  // },
  {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
    width: 150,
    fixed: 'right',
  }
];

// Fetch votes data from API when component is mounted
onMounted(() => {
  loading.value = true;
  get_my_vote()
      .then(response => {
        // Transform the API response to match the component's expected data structure
        const transformedVotes = response.data.map(vote => {
          // Calculate if the vote has a time limit or is unlimited
          const isUnlimited = !vote.cut_off;
          let timeLimit = 0;
          let status = 'draft';
          let endTime = null;

          if (vote.active) {
            status = 'active';

            // Calculate time limit in minutes if not unlimited
            if (!isUnlimited) {
              const cutOffDate = new Date(vote.cut_off);
              const createdDate = new Date(vote.created_at);
              timeLimit = Math.round((cutOffDate - createdDate) / (60 * 1000)); // Convert ms to minutes
              endTime = cutOffDate;

              // Check if the vote has ended (cut_off time has passed)
              if (new Date() > cutOffDate) {
                status = 'ended';
              }
            }
          }

          // Map options to the expected format
          const options = vote.options.map(opt => opt.content);
          const optionsWithVotes = vote.options.map(opt => ({
            name: opt.content,
            votes: opt.count
          }));

          // Calculate total votes
          const totalVotes = optionsWithVotes.reduce((sum, option) => sum + option.votes, 0);

          return {
            id: vote.poll_id,
            code: vote.identifier,
            voteName: vote.title,
            isPublic: true, // Default to true since it's not in the API response
            timeLimit: timeLimit,
            isUnlimited: isUnlimited,
            voteStyle: 'barChart', // Default as mentioned in the requirements
            allowMultipleChoice: false, // Default since it's not in the API response
            options: options,
            status: status,
            createdAt: new Date(vote.created_at),
            endTime: endTime,
            optionsWithVotes: optionsWithVotes,
            totalVotes: totalVotes
          };
        });

        // Clear existing votes and add the transformed ones
        votes.splice(0, votes.length, ...transformedVotes);
        loading.value = false;
      })
      .catch(error => {
        console.error('Error fetching votes:', error);
        loading.value = false;
        message.error('Failed to load your votes');
      });
});

// Compute filtered votes
const filteredVotes = computed(() => {
  return votes.filter(vote => {
    // Apply search filter
    const matchesSearch = searchQuery.value === '' ||
        vote.voteName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        vote.code.toString().includes(searchQuery.value);

    // Apply status filter
    const matchesStatus = filterStatus.value === '' ||
        vote.status === filterStatus.value;

    // Apply style filter
    const matchesStyle = filterStyle.value === '' ||
        vote.voteStyle === filterStyle.value;

    return matchesSearch && matchesStatus && matchesStyle;
  });
});

// Utility functions
const formatDate = (date) => {
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format date with detailed time
const formatDateTimeDetailed = (date) => {
  if (!date) return 'N/A';

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Format countdown timer (seconds to HH:MM:SS)
const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

const formatVoteStyle = (style) => {
  switch (style) {
    case 'barChart': return 'Bar Chart';
    case 'pieChart': return 'Pie Chart';
    default: return style;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Active';
    case 'ended': return 'Ended';
    case 'draft': return 'Draft';
    default: return status;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'green';
    case 'ended': return 'red';
    case 'draft': return 'gray';
    default: return 'blue';
  }
};

const getStyleColor = (style) => {
  switch (style) {
    case 'barChart': return 'purple';
    case 'pieChart': return 'cyan';
    default: return 'blue';
  }
};

const getRandomColor = (index) => {
  const colors = [
    '#8aa2ff', '#ff8a8a', '#8aff8a', '#ffd28a',
    '#d88aff', '#8ae1ff', '#ff8ad8', '#ffea8a'
  ];
  return colors[index % colors.length];
};

const calculatePercentage = (votes, total) => {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
};

// Update countdown timer
const updateCountdown = () => {
  if (!selectedVote.value || selectedVote.value.isUnlimited || !selectedVote.value.endTime) return;

  const now = new Date();
  const end = new Date(selectedVote.value.endTime);
  const diff = Math.max(0, Math.floor((end - now) / 1000)); // Convert to seconds

  timeRemaining.value = diff;

  // Check if vote has ended
  if (diff <= 0 && selectedVote.value.status === 'active') {
    selectedVote.value.status = 'ended';
    stopPolling();
    stopCountdown();
    message.info('This vote has ended');
  }
};

// Start countdown timer
const startCountdown = () => {
  // Clear any existing countdown
  stopCountdown();

  // Initialize countdown
  updateCountdown();

  // Set interval to update countdown every second
  countdownInterval.value = setInterval(() => {
    updateCountdown();
  }, 1000);
};

// Stop countdown timer
const stopCountdown = () => {
  if (countdownInterval.value) {
    console.log('Stopping countdown interval:', countdownInterval.value);
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

// Action handlers
const handleSearch = () => {
  console.log('Search:', searchQuery.value);
};

const resetFilters = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  filterStyle.value = '';
};

const viewResults = (vote) => {
  // 确保在设置新的投票前已经清除所有轮询
  stopPolling();
  stopCountdown();

  selectedVote.value = vote;
  resultsModalVisible.value = true;

  console.log(selectedVote.value)

  // Start countdown for votes with time limit
  if (vote.status === 'active' && !vote.isUnlimited) {
    startCountdown();
  }

  // Start polling for updates if vote is not ended
  if (vote.status !== 'ended') {
    startPolling(vote.code);
  }
};

const startPolling = (voteCode) => {
  // Clear any existing polling
  stopPolling();

  // Set up new polling interval
  pollingInterval.value = setInterval(() => {
    // 检查模态框是否还打开，如果已关闭则停止轮询
    if (!resultsModalVisible.value) {
      console.log('Modal is closed, stopping polling');
      stopPolling();
      return;
    }

    console.log(`Polling for updates on vote ${voteCode}`);

    get_vote(voteCode)
        .then(response => {
          if (!response || !response.data) {
            console.error('Invalid response from get_vote');
            return;
          }

          // 确保返回的投票是我们请求的投票
          const vote = response.data;

          // 验证返回的投票是否是我们请求的投票
          if (vote.identifier !== voteCode && String(vote.poll_id) !== voteCode) {
            console.error('Received data for wrong vote:', vote);
            console.error(`Expected vote code: ${voteCode}, got: ${vote.identifier}`);
            return; // 如果不是我们请求的投票，直接返回，不更新界面
          }

          // 检查模态框是否还打开，再次确认
          if (!resultsModalVisible.value) {
            console.log('Modal is closed (double-check), stopping polling');
            stopPolling();
            return;
          }

          // Transform the response to match our component's data structure
          const isUnlimited = !vote.cut_off;
          let timeLimit = 0;
          let status = 'draft';
          let endTime = null;

          if (vote.active) {
            status = 'active';

            // Calculate time limit in minutes if not unlimited
            if (!isUnlimited) {
              const cutOffDate = new Date(vote.cut_off);
              const createdDate = new Date(vote.created_at);
              timeLimit = Math.round((cutOffDate - createdDate) / (60 * 1000));
              endTime = cutOffDate;

              // Check if vote has ended (cut_off time has passed)
              if (new Date() > cutOffDate) {
                status = 'ended';
              }
            }
          }

          // Map options to the expected format
          const options = vote.options.map(opt => opt.content);
          const optionsWithVotes = vote.options.map(opt => ({
            name: opt.content,
            votes: opt.count
          }));

          // Calculate total votes
          const totalVotes = optionsWithVotes.reduce((sum, option) => sum + option.votes, 0);

          // Create updated vote object
          const updatedVote = {
            id: vote.poll_id,
            code: vote.identifier,
            voteName: vote.title,
            isPublic: true,
            timeLimit: timeLimit,
            isUnlimited: isUnlimited,
            // 保留原始的投票样式，避免UI突然变化
            voteStyle: selectedVote.value?.voteStyle || 'barChart',
            allowMultipleChoice: false,
            options: options,
            status: status,
            createdAt: new Date(vote.created_at),
            endTime: endTime,
            optionsWithVotes: optionsWithVotes,
            totalVotes: totalVotes
          };

          // 保存当前选中的投票ID，以便验证
          const currentSelectedId = selectedVote.value?.id;

          // 只有当当前选中的投票仍然是我们正在更新的投票时，才更新selectedVote
          if (currentSelectedId === updatedVote.id) {
            // Update the selectedVote with new data
            selectedVote.value = updatedVote;

            // Reset countdown if needed
            if (status === 'active' && !isUnlimited && !countdownInterval.value) {
              startCountdown();
            }

            // If vote has ended, stop polling
            if (status === 'ended') {
              message.info('This vote has ended');
              stopPolling();
              stopCountdown();
            }
          } else {
            console.log('Selected vote changed, not updating UI');
            stopPolling(); // 停止当前的轮询，因为用户已经查看其他投票
          }

          // Also update the vote in the votes array if it exists there
          const voteIndex = votes.findIndex(v => v.id === vote.poll_id);
          if (voteIndex !== -1) {
            votes[voteIndex] = updatedVote;
          }
        })
        .catch(error => {
          console.error('Error polling vote data:', error);
          // Don't stop polling on error, just log it
        });
  }, 3000); // Poll every 3 seconds
};

const stopPolling = () => {
  if (pollingInterval.value) {
    console.log('Stopping polling interval:', pollingInterval.value);
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

const editVote = (vote) => {
  console.log('Edit vote:', vote);
  message.info(`Editing Vote: ${vote.voteName}`);
};

const confirmDelete = (vote) => {
  selectedVote.value = vote;
  deleteModalVisible.value = true;
};

const deleteVote = () => {
  if (selectedVote.value) {
    // In a real application, you would call an API here
    console.log('Deleting vote:', selectedVote.value);
    const index = votes.findIndex(v => v.id === selectedVote.value.id);
    if (index !== -1) {
      votes.splice(index, 1);
      message.success(`Vote deleted: ${selectedVote.value.voteName}`);
    }
    deleteModalVisible.value = false;
  }
};

// Clean up any active polling and countdown when component is unmounted
onBeforeUnmount(() => {
  console.log('Component unmounting, cleaning up intervals');
  stopPolling();
  stopCountdown();
});
</script>

<style scoped>
.vote-management-container {
  width: 100%;
  max-width: 1200px;
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

.controls-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.vote-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Countdown styles */
.countdown-container, .status-container {
  margin: 16px 0;
}

.countdown-timer {
  margin-left: 8px;
}

.ending-soon {
  color: #ff4d4f;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* Vote result styles */
.vote-results-container {
  margin: 20px 0;
}

.results-chart {
  margin-bottom: 20px;
}

.bar-chart-item {
  margin-bottom: 15px;
}

.option-label {
  font-weight: 500;
  margin-bottom: 5px;
}

.bar-container {
  width: 100%;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 24px;
  background-color: #8aa2ff;
  color: white;
  text-align: right;
  padding: 2px 8px;
  font-size: 14px;
  border-radius: 4px;
  white-space: nowrap;
  transition: width 0.3s ease;
}

.pie-chart-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.color-box {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border-radius: 3px;
}

.vote-stats {
  margin-top: 20px;
}

/* Global style overrides */
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