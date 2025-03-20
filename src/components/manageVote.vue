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
          <a-select-option value="lineGraph">Line Graph</a-select-option>
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
        <template v-if="column.dataIndex === 'chart_type'">
          <a-tag :color="getStyleColor(record.chart_type)">
            {{ formatVoteStyle(record.chart_type) }}
          </a-tag>
        </template>

        <!-- 创建时间 -->
        <template v-if="column.dataIndex === 'createdAt'">
          <span>{{ formatDate(record.createdAt) }}</span>
        </template>

        <!-- 操作 -->
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip title="查看结果">
              <a-button
                  type="primary"
                  shape="circle"
                  size="small"
                  @click="viewResults(record)"
              >
                <template #icon><bar-chart-outlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="编辑">
              <a-button
                  type="default"
                  shape="circle"
                  size="small"
                  @click="editVote(record)"
              >
                <template #icon><edit-outlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除">
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
        :title="`Vote Result for ${selectedVote?.code}`"
        width="700px"
        :footer="null"
        @after-close="stopPolling"
        centered
    >
      <div v-if="selectedVote" class="vote-result-content">
        <h3 class="vote-title">{{ selectedVote.voteName }}</h3>

        <!-- Time Remaining Alert Box -->
        <div v-if="selectedVote.status === 'active' && !selectedVote.isUnlimited" class="time-remaining-alert">
          <div class="time-info">
            <info-circle-outlined />
            <span class="time-label">Time Remaining: </span>
            <span class="time-value">{{ formattedTimeLeftHHMMSS }}</span>
          </div>
          <div class="end-time-info">
            Vote will end on {{ formatEndDate(selectedVote) }}
          </div>
        </div>

        <div class="vote-options-list">
          <div v-for="(option, index) in selectedVote.optionsWithVotes"
               :key="index"
               class="vote-option-item"
          >
            <div class="option-number">{{ index + 1 }}</div>
            <div class="option-progress-container">
              <div class="option-name">{{ option.name }}</div>
              <div class="option-progress-bar">
                <div
                    class="option-progress"
                    :style="{ width: `${calculatePercentage(option.votes, selectedVote.totalVotes)}%` }"
                ></div>
              </div>
              <div class="option-votes">
                {{ option.votes }} ({{ calculatePercentage(option.votes, selectedVote.totalVotes) }}%)
              </div>
            </div>
          </div>
        </div>

        <div class="vote-statistics">
          <h4 class="statistics-title">Vote Statistics</h4>

          <div class="statistics-grid">
            <div class="statistics-row">
              <div class="statistics-cell">
                <div class="statistics-label">Total Votes</div>
                <div class="statistics-value">{{ selectedVote.totalVotes }}</div>
              </div>
              <div class="statistics-cell">
                <div class="statistics-label">Status</div>
                <div class="statistics-value">
                  <a-tag :color="getStatusColor(selectedVote.status)" class="status-tag">
                    {{ getStatusText(selectedVote.status) }}
                  </a-tag>
                </div>
              </div>
            </div>

            <div class="statistics-row">
              <div class="statistics-cell">
                <div class="statistics-label">Created</div>
                <div class="statistics-value">{{ formatDateWithTime(selectedVote.createdAt) }}</div>
              </div>
              <div class="statistics-cell">
                <div class="statistics-label">Time Limit</div>
                <div class="statistics-value">
                  <span v-if="selectedVote.isUnlimited">Unlimited</span>
                  <span v-else>{{ selectedVote.timeLimit }} minutes</span>
                </div>
              </div>
            </div>

            <div class="statistics-row">
              <div class="statistics-cell">
                <div class="statistics-label">Code</div>
                <div class="statistics-value">{{ selectedVote.code }}</div>
              </div>
              <div class="statistics-cell">
                <div class="statistics-label">Multiple Choice</div>
                <div class="statistics-value">
                  {{ selectedVote.allowMultipleChoice ? 'Yes' : 'No' }}
                </div>
              </div>
            </div>
          </div>
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

    <!-- Edit Vote Modal -->
    <a-modal
        v-model:visible="editModalVisible"
        title="Edit Vote"
        width="700px"
        :maskClosable="false"
        @ok="handleEditSubmit"
        :okText="'Save Changes'"
        :okButtonProps="{ disabled: !isEditFormValid }"
        :cancelText="'Cancel'"
    >
      <a-form layout="vertical" :model="editFormState">
        <a-form-item label="Vote Name:">
          <a-input
              v-model:value="editFormState.voteName"
              placeholder="Enter vote name"
              size="large"
          />
        </a-form-item>

        <a-form-item label="End Time:">
          <a-row :gutter="16" align="middle">
            <a-col :span="14">
              <a-date-picker
                  v-model:value="editFormState.endTime"
                  :disabled="editFormState.isUnlimited"
                  size="large"
                  :show-time="{ format: 'HH:mm' }"
                  format="YYYY-MM-DD HH:mm"
                  :disabledDate="disabledDate"
                  :disabledTime="disabledDateTime"
                  placeholder="Select end date and time"
                  style="width: 100%"
              />
            </a-col>
            <a-col>
              <a-checkbox v-model:checked="editFormState.isUnlimited">
                No End Time
              </a-checkbox>
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item label="Chart Style:">
          <a-select
              v-model:value="editFormState.chart_type"
              size="large"
              style="width: 100%"
          >
            <a-select-option value="barChart">Bar Chart</a-select-option>
            <a-select-option value="pieChart">Pie Chart</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Options:">
          <div
              v-for="(option, index) in editFormState.options"
              :key="index"
              class="option-row"

          >
            <a-input
                v-model:value="editFormState.options[index].content"
                :placeholder="`Option ${index + 1}`"
                size="large"
                class="option-input"
            />
            <a-button
                type="text"
                :disabled="editFormState.options.filter(opt => opt && !opt.delete).length <= 1"
                danger
                shape="circle"
                @click="removeEditOption(index)"
                class="remove-btn"
            >
              <template #icon><minus-outlined /></template>
            </a-button>
          </div>
          <div class="option-buttons">
            <a-button
                type="dashed"
                @click="addEditOption"
                class="add-btn"
            >
              <template #icon><plus-outlined /></template>
              Add Option
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue';
import {message} from 'ant-design-vue';
import useVoteApi from "@/api/vote.js";
import dayjs from 'dayjs';

const {get_my_vote, edit_vote, del_vote} = useVoteApi();

// Component state
const searchQuery = ref('');
const filterStatus = ref('');
const filterStyle = ref('');
const loading = ref(false);
const resultsModalVisible = ref(false);
const deleteModalVisible = ref(false);
const editModalVisible = ref(false);
const selectedVote = ref(null);
const pollingInterval = ref(null);
const countdownInterval = ref(null);
const timeLeft = ref(0); // in seconds

// Edit form state
const editFormState = reactive({
  voteName: '',
  isPublic: false,
  endTime: null,
  isUnlimited: false,
  chart_type: 'barChart',
  options: [],
  originalOptions: [] // To track which options already exist vs which are new
});

// Transform API data to the component's expected format
const transformVoteData = (apiData) => {
  console.log(apiData)
  return apiData.map(vote => {
    // Check if the vote has a cut_off time and if it's in the past
    const now = new Date();
    const cutOff = vote.cut_off ? new Date(vote.cut_off) : null;
    const createdAt = new Date(vote.created_at);
    const isExpired = cutOff ? now > cutOff : false;

    // Calculate total time limit in minutes (from creation to cutoff)
    let timeLimit = 0;
    if (cutOff) {
      // Calculate total duration from creation to cutoff (not remaining time)
      const totalDurationMs = cutOff - createdAt > 0 ? cutOff - createdAt : 0;
      timeLimit = Math.floor(totalDurationMs / (1000 * 60));
    }

    // Extract options with votes
    const optionsWithVotes = vote.options ? vote.options.map(option => ({
      id: option.option_id || 0,
      name: option.content || '',
      votes: option.count || 0
    })) : [];

    // Calculate total votes
    const totalVotes = optionsWithVotes.reduce((sum, option) => sum + option.votes, 0);

    // Extract plain option strings
    const options = optionsWithVotes.map(opt => opt.name);

    // Determine vote status
    const status = !vote.active || isExpired ? 'ended' : 'active';

    return {
      id: vote.poll_id,
      code: vote.identifier,
      voteName: vote.title,
      isPublic: true, // Default to true if not specified
      timeLimit: timeLimit,
      isUnlimited: !vote.cut_off,
      chart_type: vote.chart_type, // Default to barChart if not specified
      allowMultipleChoice: false, // Default to false if not specified
      options: options,
      status: status,
      createdAt: createdAt,
      optionsWithVotes: optionsWithVotes,
      totalVotes: totalVotes,
      remainingTimeInSeconds: cutOff && !isExpired ? Math.max(0, Math.floor((cutOff - now) / 1000)) : 0,
      endTime: cutOff
    };
  });
};

// Format time left in HH:MM:SS format for display
const formattedTimeLeftHHMMSS = computed(() => {
  if (!selectedVote.value || selectedVote.value.isUnlimited) return '00:00:00';

  if (timeLeft.value <= 0) return '00:00:00';

  const hours = Math.floor(timeLeft.value / 3600);
  const minutes = Math.floor((timeLeft.value % 3600) / 60);
  const seconds = timeLeft.value % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Format end date for display
const formatEndDate = (vote) => {
  if (!vote || !vote.endTime) return '';

  const endDate = new Date(vote.endTime);
  return `${endDate.getDate()} ${getMonthName(endDate.getMonth())} ${endDate.getFullYear()} at ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:${endDate.getSeconds().toString().padStart(2, '0')}`;
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

// Format date with time
const formatDateWithTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return `${d.getDate()} ${getMonthName(d.getMonth())} ${d.getFullYear()} at ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

// Calculate time left in format MM:SS
const formattedTimeLeft = computed(() => {
  if (!selectedVote.value || selectedVote.value.isUnlimited) return 'No time limit';

  if (timeLeft.value <= 0) return 'Vote ended';

  const hours = Math.floor(timeLeft.value / 3600);
  const minutes = Math.floor((timeLeft.value % 3600) / 60);
  const seconds = timeLeft.value % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  } else {
    return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
});

// Update time left
const updateTimeLeft = () => {
  if (!selectedVote.value || selectedVote.value.isUnlimited || selectedVote.value.status !== 'active') return;

  timeLeft.value -= 1;

  if (timeLeft.value <= 0) {
    // Time has run out, update vote status
    selectedVote.value.status = 'ended';
    stopCountdown();
    stopPolling();

    // Update the vote in the list
    const index = votes.value.findIndex(v => v.id === selectedVote.value.id);
    if (index !== -1) {
      votes.value[index].status = 'ended';
    }

    message.info('Vote has ended');
  }
};

// Start countdown timer
const startCountdown = () => {
  stopCountdown(); // Clear any existing countdown

  if (selectedVote.value && !selectedVote.value.isUnlimited && selectedVote.value.status === 'active') {
    // Set initial time left in seconds (convert from minutes)
    timeLeft.value = selectedVote.value.remainingTimeInSeconds || (selectedVote.value.timeLimit * 60);

    // Start countdown interval
    countdownInterval.value = setInterval(() => {
      updateTimeLeft();
    }, 1000);
  }
};

// Stop countdown timer
const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

// Fetch votes from API
const votes = ref([]);

// Function to refresh the votes list
const refreshVotesList = () => {
  loading.value = true;
  get_my_vote()
      .then(res => {
        if (res && res.data) {
          votes.value = transformVoteData(res.data);
          console.log('Refreshed vote data:', votes.value);

          // If a vote is selected, update it with fresh data
          if (selectedVote.value) {
            const updatedVote = votes.value.find(v => v.id === selectedVote.value.id);
            if (updatedVote) {
              selectedVote.value = updatedVote;

              // Restart countdown if needed
              if (updatedVote.status === 'active' && !updatedVote.isUnlimited) {
                startCountdown();
              }
            }
          }
        }
      })
      .catch(err => {
        console.error('Error fetching votes:', err);
        message.error('Failed to refresh votes. Please try again.');
      })
      .finally(() => {
        loading.value = false;
      });
};

onMounted(() => {
  refreshVotesList();
});

// Compute if edit form is valid
const isEditFormValid = computed(() => {
  // Check if vote name is not empty
  if (!editFormState.voteName.trim()) return false;

  // Check if end time is set or unlimited is checked
  if (!editFormState.isUnlimited && !editFormState.endTime) return false;

  // Get only non-deleted options
  const visibleOptions = editFormState.options.filter(option => option && !option.delete);

  // Check if we have at least 2 options and all have content
  if (visibleOptions.length < 2) return false;

  return visibleOptions.every(option => option.content && option.content.trim() !== '');
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
    dataIndex: 'chart_type',
    key: 'chart_type',
    width: 120,
    sorter: (a, b) => a.chart_type.localeCompare(b.chart_type),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    sorter: (a, b) => a.status.localeCompare(b.status),
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 120,
    sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  },
  {
    title: 'Actions',
    dataIndex: 'actions',
    key: 'actions',
    width: 150,
    fixed: 'right',
  }
];

// Compute filtered votes
const filteredVotes = computed(() => {
  return votes.value.filter(vote => {
    // Apply search filter
    const matchesSearch = searchQuery.value === '' ||
        vote.voteName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        vote.code.toString().includes(searchQuery.value);

    // Apply status filter
    const matchesStatus = filterStatus.value === '' ||
        vote.status === filterStatus.value;

    // Apply style filter
    const matchesStyle = filterStyle.value === '' ||
        vote.chart_type === filterStyle.value;

    return matchesSearch && matchesStatus && matchesStyle;
  });
});

// Utility functions
const formatDate = (date) => {
  if (!date) return '';
  try {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

const formatVoteStyle = (style) => {
  switch (style) {
    case 'barChart': return 'Bar Chart';
    case 'pieChart': return 'Pie Chart';
    case 'lineGraph': return 'Line Graph';
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
    case 'lineGraph': return 'orange';
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

// Action handlers
const handleSearch = () => {
  console.log('搜索:', searchQuery.value);
};

const resetFilters = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  filterStyle.value = '';
};

const viewResults = (vote) => {
  selectedVote.value = vote;
  resultsModalVisible.value = true;

  // Start polling for updates if vote is not ended
  if (vote.status === 'active') {
    startPolling(vote.id);
    // Start countdown for active votes with time limits
    if (!vote.isUnlimited) {
      startCountdown();
    }
  }
};

// Implement polling to update vote results in real-time
const startPolling = (voteId) => {
  // Clear any existing polling
  stopPolling();

  // Set up new polling interval
  pollingInterval.value = setInterval(() => {
    // Fetch updated vote data
    refreshVotesList();
  }, 5000); // Poll every 5 seconds
};

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
    console.log('Stopped polling for vote updates');
  }
  // Also stop countdown when polling stops
  stopCountdown();
};

// Edit vote functions
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
    const currentHour = dayjs().hour();
    const currentMinute = dayjs().minute();

    // Disable past hours
    for (let i = 0; i < currentHour; i++) {
      hours.push(i);
    }

    // If selected hour is current hour, disable past minutes
    if (date && date.hour() === currentHour) {
      for (let i = 0; i < currentMinute; i++) {
        minutes.push(i);
      }
    }

    return {
      disabledHours: () => hours,
      disabledMinutes: () => minutes
    };
  }
  return {};
};

// Add a new option in edit mode
const addEditOption = () => {
  if (editFormState.options.length >= 8) {
    message.warn("Only up to 8 options can be added");
  } else {
    editFormState.options.push({ content: '', isNew: true });
  }
};

// Remove option in edit mode
const removeEditOption = (index) => {
  // Ensure at least one non-deleted option remains
  const visibleOptionsCount = editFormState.options.filter(opt => opt && !opt.delete).length;
  if (visibleOptionsCount > 1) {
    const option = editFormState.options[index];

    // If the option has an option_id, mark it for deletion rather than removing it from the array
    if (option.option_id && !option.isNew) {
      editFormState.options[index].delete = true;
      console.log(`Marked option ${option.content} for deletion`);
    } else {
      // If it's a new option, just remove it from the array
      editFormState.options.splice(index, 1);
      console.log('Removed option from array');
    }
  } else {
    message.warning('At least one option must remain');
  }
};

// Format date for PostgreSQL
const formatDateForPostgres = (date) => {
  if (!date) return null;
  return date.format('YYYY-MM-DD HH:mm:ss');
};

// Edit vote
const editVote = (vote) => {
  console.log('Editing vote:', vote);

  // Set selected vote
  selectedVote.value = vote;

  // Reset form state
  editFormState.voteName = vote.voteName;
  editFormState.isPublic = vote.isPublic;

  // Convert the endTime to dayjs
  if (vote.isUnlimited) {
    editFormState.endTime = null;
  } else if (vote.endTime) {
    editFormState.endTime = dayjs(vote.endTime);
  } else {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + vote.timeLimit);
    editFormState.endTime = dayjs(endTime);
  }

  editFormState.isUnlimited = vote.isUnlimited;
  editFormState.chart_type = vote.chart_type;

  // Convert options array to objects with content
  editFormState.options = vote.optionsWithVotes.map(opt => ({
    option_id: opt.id,
    content: opt.name,
    count: opt.votes,
    isNew: false,
    delete: false
  }));

  // Store original options for comparison
  editFormState.originalOptions = JSON.parse(JSON.stringify(editFormState.options));

  // Show the modal
  editModalVisible.value = true;
};

// Handle edit submission
const handleEditSubmit = async () => {
  if (!isEditFormValid.value) {
    message.error('Please fill in all required fields');
    return;
  }

  try {
    // Get visible (non-deleted) options for display formatting
    const visibleOptions = editFormState.options.filter(opt => opt && !opt.delete);

    // Create options array for API
    const optionsForApi = [];

    // Add new and updated options
    visibleOptions.forEach(opt => {
      if (opt.isNew) {
        // New option
        optionsForApi.push({ content: opt.content });
      } else {
        // Existing option with potential updates
        optionsForApi.push({
          option_id: opt.option_id,
          content: opt.content
        });
      }
    });

    // Add deleted options (with delete flag)
    const deletedOptions = editFormState.options
        .filter(opt => opt && opt.delete && opt.option_id)
        .map(opt => ({
          option_id: opt.option_id,
          delete: true
        }));

    // Combine all options
    const allOptions = [...optionsForApi, ...deletedOptions];

    // Create data object to send to backend
    const updateData = {
      title: editFormState.voteName,
      is_unlimited: editFormState.isUnlimited,
      cut_off: editFormState.isUnlimited ? null : formatDateForPostgres(editFormState.endTime),
      chart_type: editFormState.chart_type,
      options: allOptions
    };

    console.log('Update data:', updateData);

    // Call the API to update the vote
    await edit_vote(selectedVote.value.id, updateData);

    // Close the modal first
    editModalVisible.value = false;

    // Then refresh the entire list to get the latest data
    message.success(`Vote "${editFormState.voteName}" has been updated!`);
    refreshVotesList();

  } catch (error) {
    console.error('Error updating vote:', error);
    message.error('Failed to update vote. Please try again.');
  }
};

const confirmDelete = (vote) => {
  selectedVote.value = vote;
  deleteModalVisible.value = true;
};

const deleteVote = async () => {
  if (selectedVote.value) {
    try {
      // Call the API to delete the vote
      await del_vote(selectedVote.value.id);

      // Close modal first
      deleteModalVisible.value = false;

      // Show success message
      message.success(`Vote deleted: ${selectedVote.value.voteName}`);

      // Refresh the list to reflect the deletion
      refreshVotesList();

    } catch (error) {
      console.error('Error deleting vote:', error);
      message.error('Failed to delete vote. Please try again.');
    }
  }
};

// Watch for when the results modal closes
watch(resultsModalVisible, (newVal) => {
  if (!newVal) {
    // Modal has closed
    stopPolling();
    stopCountdown();
  }
});

// Make sure to clean up any active polling and countdown when component is unmounted
onBeforeUnmount(() => {
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

/* Vote Result Modal Styles */
.vote-result-content {
  padding: 0;
}

.vote-title {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
  font-weight: 500;
}

.time-remaining-alert {
  background-color: #e6f7ff;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 24px;
  border: 1px solid #91d5ff;
}

.time-info {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #1890ff;
  margin-bottom: 4px;
}

.time-label {
  margin-left: 8px;
  font-weight: 500;
}

.time-value {
  font-weight: 600;
}

.end-time-info {
  color: #666;
  font-size: 14px;
  padding-left: 24px;
}

.vote-options-list {
  margin-bottom: 24px;
}

.vote-option-item {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
}

.option-number {
  width: 28px;
  height: 28px;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-right: 10px;
  font-weight: 500;
}

.option-progress-container {
  flex: 1;
}

.option-name {
  font-weight: 500;
  margin-bottom: 6px;
}

.option-progress-bar {
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.option-progress {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s ease;
}

.option-votes {
  margin-top: 4px;
  font-size: 13px;
  color: #666;
  text-align: right;
}

/* Vote Statistics */
.vote-statistics {
  margin-top: 30px;
}

.statistics-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
  font-weight: 500;
}

.statistics-grid {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.statistics-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.statistics-row:last-child {
  border-bottom: none;
}

.statistics-cell {
  flex: 1;
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
}

.statistics-cell:last-child {
  border-right: none;
}

.statistics-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.statistics-value {
  font-weight: 500;
  color: #333;
}

.status-tag {
  margin: 0;
}

/* Edit Modal Styles */
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

:deep(.ant-picker-focused),
:deep(.ant-picker:hover) {
  border-color: #8aa2ff;
}

:deep(.ant-picker-focused) {
  box-shadow: 0 0 0 2px rgba(138, 162, 255, 0.2);
}
</style>