<template>
  <div class="vote-layout">
    <!-- 左侧卡片：包含投票信息和图表 -->
    <div class="main-card-container">
      <a-card class="main-card" :bordered="true">
        <!-- 返回按钮 -->
        <div class="back-btn-container">
          <a-button type="default" @click="navigateToHome" class="back-btn">
            <template #icon><left-outlined /></template>
            Back to Home
          </a-button>
        </div>

        <!-- 投票信息 -->
        <div class="vote-header" v-if="!fetchError">
          <h1 class="vote-title">{{ vote.voteName }}</h1>
          <div class="vote-join-info">
            Join Vote Using <span class="vote-code">{{ vote.code }}</span> At example.com
          </div>
          <div class="vote-timer" v-if="!vote.isUnlimited && effectiveVoteStatus === 'active'">
            Time Left: {{ formattedTimeLeft }}
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="vote-chart-container">
          <!-- 数据加载失败或投票不存在时显示提示 -->
          <template v-if="fetchError">
            <a-result
                status="warning"
                title="Failed to load vote data"
                sub-title="The vote might not exist or there was a connection error."
            >
              <template #extra>
                <a-button type="primary" @click="retryFetch">
                  Try Again
                </a-button>
              </template>
            </a-result>
          </template>

          <!-- 投票已结束时的提示 -->
          <template v-else-if="effectiveVoteStatus === 'ended' || isVoteExpired || timeLeft <= 0">
            <a-alert
                message="This vote has ended"
                description="Final results are displayed below."
                type="info"
                show-icon
                class="vote-ended-alert"
            />
            <div ref="chartContainer" class="vote-chart"></div>
          </template>

          <!-- 无投票数据时显示空状态 -->
          <template v-else-if="!vote.optionsWithVotes || vote.optionsWithVotes.length === 0">
            <a-empty description="No vote data available" />
          </template>

          <!-- 正常显示图表 -->
          <template v-else>
            <div ref="chartContainer" class="vote-chart"></div>
          </template>
        </div>
      </a-card>
    </div>

    <!-- 右侧卡片：仅包含投票选项 -->
    <div class="vote-card-container">
      <a-card class="vote-card" :bordered="true" :title="null">
        <div class="card-title">Cast Your Vote</div>

        <!-- 用户已投票提示 -->
        <div v-if="hasUserVoted" class="user-voted-alert">
          <a-alert
              message="You have already voted"
              description="Each user can only vote once in this poll."
              type="info"
              show-icon
          />
        </div>

        <!-- 投票控件 - 只有在投票未过期且状态为active时才显示 -->
        <div v-else-if="effectiveVoteStatus === 'active' && !isVoteExpired && timeLeft > 0">
          <template v-if="vote.allowMultipleChoice">
            <a-checkbox-group v-model:value="voteForm.selectedOptions">
              <div class="vote-option" v-for="(option, index) in vote.options" :key="index">
                <a-checkbox :value="index">
                  <span class="option-color-indicator" :style="{ backgroundColor: getOptionColor(index) }"></span>
                  {{ option }}
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </template>
          <template v-else>
            <a-radio-group v-model:value="voteForm.selectedOption">
              <div class="vote-option" v-for="(option, index) in vote.options" :key="index">
                <a-radio :value="index">
                  <span class="option-color-indicator" :style="{ backgroundColor: getOptionColor(index) }"></span>
                  {{ option }}
                </a-radio>
              </div>
            </a-radio-group>
          </template>

          <!-- 提交按钮 -->
          <div class="submit-btn-container">
            <a-button type="primary" size="large" :disabled="!canSubmitVote || submitting" @click="submitVote">
              <template #icon v-if="submitting"><loading-outlined /></template>
              {{ submitting ? 'Submitting...' : 'Submit Vote' }}
            </a-button>
          </div>
        </div>

        <!-- 投票结束提示 - 使用effectiveVoteStatus -->
        <div class="vote-ended-message" v-if="effectiveVoteStatus === 'ended' || isVoteExpired || timeLeft <= 0">
          <a-alert type="info" message="This vote has ended." banner />
        </div>
      </a-card>
    </div>

    <!-- 初始加载状态 -->
    <a-modal
        v-model:open="initialLoading"
        :closable="false"
        :footer="null"
        :mask="true"
        :maskClosable="false"
        centered
        width="300px"
        :bodyStyle="{ padding: '24px', textAlign: 'center' }"
    >
      <a-spin tip="Loading vote data...">
        <div style="height: 100px; display: flex; align-items: center; justify-content: center;">
          <div>Loading vote: {{ store.vote_code }}</div>
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { LeftOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import useVoteApi from '@/api/vote.js';
import { useVote } from "@/stores/vote.js";

const router = useRouter();

// Props for the vote data
const props = defineProps({
  initialVoteData: {
    type: Object,
    default: () => ({})
  }
});

// Emit events for parent components
const emit = defineEmits(['vote-submitted', 'vote-ended']);

// Color mapping table for up to 8 options
const colorMap = [
  '#5470c6', // Blue
  '#91cc75', // Green
  '#fac858', // Yellow
  '#ee6666', // Red
  '#73c0de', // Light Blue
  '#3ba272', // Teal
  '#fc8452', // Orange
  '#9a60b4'  // Purple
];

// Get color for an option index
const getOptionColor = (index) => {
  return colorMap[index % colorMap.length];
};

// Component state
const chartContainer = ref(null);
const chart = ref(null);
const initialLoading = ref(true);
const submitting = ref(false);
const fetchError = ref(false);
const { get_vote, make_vote } = useVoteApi();
const store = useVote();
const hasUserVoted = ref(false);

// Initial empty vote structure
const vote = ref({
  id: 1,
  code: '',
  voteName: '',
  isPublic: true,
  timeLimit: 0,
  isUnlimited: false,
  voteStyle: 'barChart',
  allowMultipleChoice: false,
  options: [],
  status: 'active',
  createdAt: new Date(),
  optionsWithVotes: [],
  totalVotes: 0,
  startTime: new Date(),
  endTime: new Date()
});

// Voting form data
const voteForm = ref({
  selectedOption: null,
  selectedOptions: []
});

// Computed property to check if vote can be submitted
const canSubmitVote = computed(() => {
  if (vote.value.allowMultipleChoice) {
    return voteForm.value.selectedOptions.length > 0;
  } else {
    return voteForm.value.selectedOption !== null;
  }
});

const pollingInterval = ref(null);
const countdownInterval = ref(null);
const timeLeft = ref(0); // in seconds

// 新增：检查投票是否已过期
const isVoteExpired = computed(() => {
  if (!vote.value.endTime) return false;
  const currentTime = new Date();
  return currentTime >= vote.value.endTime;
});

// 新增：计算投票的真实状态（考虑时间因素）
const effectiveVoteStatus = computed(() => {
  if (isVoteExpired.value) return 'ended';
  return vote.value.status;
});

// Format date for display
const formatDate = (date) => {
  if (!date) return '';

  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Format due date for display
const formatDueDate = (date) => {
  if (!date) return '';

  try {
    const now = new Date();
    const dueDate = new Date(date);

    // If due date is in the past
    if (dueDate < now) {
      return 'Ended';
    }

    // Calculate difference in days
    const diffTime = Math.abs(dueDate - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${dueDate.toLocaleDateString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      // Less than a day left
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m remaining`;
      } else {
        return `${diffMinutes}m remaining`;
      }
    }
  } catch (error) {
    console.error('Error formatting due date:', error);
    return '';
  }
};

// Helper functions for data transformation
const calculateTimeLimit = (cutOff) => {
  if (!cutOff) return 0;

  const now = new Date();
  const end = new Date(cutOff);
  // Return time limit in minutes
  return Math.max(0, Math.floor((end - now) / (1000 * 60)));
};

// 修改：从options中提取content字段
const extractOptions = (options) => {
  if (!options || !Array.isArray(options)) return [];
  return options.map(option => option.content || '');
};

// 修改：映射optionsWithVotes使用content和count字段
const mapOptionsWithVotes = (options) => {
  if (!options || !Array.isArray(options)) return [];
  return options.map(option => ({
    name: option.content || '',
    votes: option.count || 0,
    id: option.option_id || 0
  }));
};

// 修改：计算总票数使用count字段
const calculateTotalVotes = (options) => {
  if (!options || !Array.isArray(options)) return 0;
  return options.reduce((sum, option) => sum + (option.count || 0), 0);
};

// Calculate time left in format MM:SS
const formattedTimeLeft = computed(() => {
  if (vote.value.isUnlimited) return 'No time limit';

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

// Status text and colors
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

// Navigate to home page
const navigateToHome = () => {
  stopPolling();
  stopCountdown();
  router.push('/join');
};

// Generate a user fingerprint based on available browser data
const generateUserFingerprint = async () => {
  try {
    // Collect browser information
    const screenData = [
      window.screen.colorDepth,
      window.screen.width,
      window.screen.height,
      window.screen.availWidth,
      window.screen.availHeight
    ].join(',');

    const browserData = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(',') || '',
      navigator.hardwareConcurrency,
      navigator.deviceMemory || '',
      new Date().getTimezoneOffset()
    ].join(',');

    const canvasData = await generateCanvasFingerprint();
    const webglData = await generateWebGLFingerprint();

    // Combine all data
    const rawFingerprint = [
      screenData,
      browserData,
      canvasData,
      webglData
    ].join('|');

    // Create a hash of the fingerprint
    return await createHash(rawFingerprint);
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    // Fallback to a simpler fingerprint
    return createSimpleFingerprint();
  }
};

// Generate canvas fingerprint
const generateCanvasFingerprint = () => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Set canvas dimensions
      canvas.width = 200;
      canvas.height = 40;

      // Fill background
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw some text with particular styling
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.font = '16px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('FingerprintJS', 10, 20);

      // Draw some shapes
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 25, 10, 0, Math.PI * 2);
      ctx.fill();

      // Get canvas data URL
      const dataURL = canvas.toDataURL();
      resolve(dataURL);
    } catch (e) {
      resolve('');
    }
  });
};

// Generate WebGL fingerprint
const generateWebGLFingerprint = () => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        resolve('');
        return;
      }

      // Get WebGL details
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        resolve(`${vendor}~${renderer}`);
      } else {
        resolve('');
      }
    } catch (e) {
      resolve('');
    }
  });
};

// Create a hash from a string using a simple algorithm
const createHash = async (str) => {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return createSimpleFingerprint();
    }
  } else {
    return createSimpleFingerprint();
  }
};

// Fallback simple fingerprint for environments without crypto.subtle
const createSimpleFingerprint = () => {
  const data = navigator.userAgent + navigator.language + window.screen.width +
      window.screen.height + new Date().getTimezoneOffset();

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Check if user has already voted
const checkUserVoted = async () => {
  try {
    const fingerprint = await generateUserFingerprint();
    const voteHistoryStr = localStorage.getItem('voteHistory') || '{}';
    const voteHistory = JSON.parse(voteHistoryStr);

    // Check if this user has voted in this specific poll
    hasUserVoted.value = !!voteHistory[vote.value.code]?.[fingerprint];

    return hasUserVoted.value;
  } catch (error) {
    console.error('Error checking vote history:', error);
    return false;
  }
};

// Record user vote in local storage
const recordUserVote = async (selectedOptions) => {
  try {
    const fingerprint = await generateUserFingerprint();
    const voteHistoryStr = localStorage.getItem('voteHistory') || '{}';
    const voteHistory = JSON.parse(voteHistoryStr);

    // Create entry for this vote if not exists
    if (!voteHistory[vote.value.code]) {
      voteHistory[vote.value.code] = {};
    }

    // Record the vote with timestamp and options
    voteHistory[vote.value.code][fingerprint] = {
      timestamp: new Date().toISOString(),
      options: selectedOptions
    };

    // Save back to localStorage
    localStorage.setItem('voteHistory', JSON.stringify(voteHistory));

    // Update UI state
    hasUserVoted.value = true;
  } catch (error) {
    console.error('Error recording vote history:', error);
    // Continue even if recording fails
  }
};

// Initialize the chart
const initChart = () => {
  if (!chartContainer.value) return;

  chart.value = echarts.init(chartContainer.value);
  updateChart();

  // Handle window resize
  window.addEventListener('resize', () => {
    chart.value?.resize();
  });
};

// Update chart with latest data based on chart type
const updateChart = () => {
  if (!chart.value || !chartContainer.value) return;

  // If container is hidden or has no dimensions, wait for next tick
  if (chartContainer.value.offsetHeight === 0) {
    nextTick(() => {
      if (chartContainer.value) {
        chart.value.resize();
        updateChart();
      }
    });
    return;
  }

  // Make sure we have valid data
  if (!vote.value.optionsWithVotes || vote.value.optionsWithVotes.length === 0) {
    return;
  }

  let options;
  const chartStyle = vote.value.voteStyle || 'barChart'; // Default to barChart

  if (chartStyle === 'pieChart') {
    // Pie chart configuration
    options = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: vote.value.optionsWithVotes.map(option => option.name)
      },
      series: [
        {
          name: 'Votes',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold'
            }
          },
          data: vote.value.optionsWithVotes.map((option, index) => ({
            name: option.name,
            value: option.votes,
            itemStyle: {
              color: getOptionColor(index)
            }
          }))
        }
      ],
      animationDuration: 300
    };
  } else {
    // Default bar chart configuration
    options = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: vote.value.optionsWithVotes.map(option => option.name),
        axisLabel: {
          interval: 0,
          rotate: vote.value.optionsWithVotes.length > 3 ? 30 : 0
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Votes',
          type: 'bar',
          data: vote.value.optionsWithVotes.map((option, index) => ({
            value: option.votes,
            itemStyle: {
              color: getOptionColor(index)
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ],
      animationDuration: 300
    };
  }

  try {
    chart.value.setOption(options);
  } catch (error) {
    console.error('Error updating chart:', error);
  }
};

// 修改：增加对结束时间的检查
const updateTimeLeft = () => {
  if (vote.value.isUnlimited || effectiveVoteStatus !== 'active') return;

  timeLeft.value -= 1;

  if (timeLeft.value <= 0) {
    // 即使后端状态是active，也强制将本地状态改为ended
    vote.value.status = 'ended';
    stopPolling();
    stopCountdown();

    // 自动刷新图表以显示最终结果
    nextTick(() => {
      updateChart();
    });

    emit('vote-ended');
    message.info('This vote has ended');
  }
};

// Function to correct time based on server response
const correctTimeFromServer = (serverEndTime) => {
  if (!serverEndTime) return;

  const now = new Date();
  const end = new Date(serverEndTime);
  const diff = Math.max(0, Math.floor((end - now) / 1000));

  // Only update if the difference is significant (more than 2 seconds)
  if (Math.abs(diff - timeLeft.value) > 2) {
    timeLeft.value = diff;
  }
};

// 修改：增加判断投票是否已过期的逻辑
const fetchVoteData = async () => {
  try {
    fetchError.value = false;

    // Check if we have a vote code
    if (!store.vote_code) {
      console.error('No vote code available');
      message.error('No vote code provided');
      initialLoading.value = false;
      fetchError.value = true;
      return;
    }

    // Use the provided API function to get vote data with the code from Pinia store
    const response = await get_vote(store.vote_code);

    // Check if we got valid data
    if (!response || !response.data) {
      throw new Error('Invalid vote data received');
    }

    const apiData = response.data;
    console.log('API Data:', apiData);

    // 检查投票是否已经结束（根据cut_off时间）
    let isExpired = false;
    if (apiData.cut_off) {
      const cutOffTime = new Date(apiData.cut_off);
      const currentTime = new Date();
      isExpired = currentTime >= cutOffTime;
    }

    // 修正后端bug：如果投票已经超过截止时间，即使active为true也视为已结束
    const voteStatus = isExpired ? 'ended' : (apiData.active ? 'active' : 'ended');

    // Map API response to component expected structure
    vote.value = {
      id: apiData.poll_id,
      code: apiData.identifier,
      voteName: apiData.title,
      isPublic: true, // Default value if not provided
      timeLimit: calculateTimeLimit(apiData.cut_off),
      isUnlimited: !apiData.cut_off,
      voteStyle: apiData.voteStyle || 'barChart', // Default to barChart if not present
      allowMultipleChoice: apiData.allow_multiple_choice || false, // Default value
      options: extractOptions(apiData.options),
      status: voteStatus, // 使用修正后的状态
      createdAt: new Date(apiData.created_at),
      optionsWithVotes: mapOptionsWithVotes(apiData.options),
      totalVotes: calculateTotalVotes(apiData.options),
      endTime: apiData.cut_off ? new Date(apiData.cut_off) : null
    };

    console.log('Mapped vote data:', vote.value);
    console.log('Status:', vote.value.status, 'IsExpired:', isExpired);
    console.log('Options:', vote.value.options);
    console.log('Options with votes:', vote.value.optionsWithVotes);

    // Update time left if vote has end time
    if (vote.value.endTime) {
      const now = new Date();
      const end = new Date(vote.value.endTime);
      timeLeft.value = Math.max(0, Math.floor((end - now) / 1000));

      // 如果时间已经到期，强制设置timeLeft为0
      if (isExpired) {
        timeLeft.value = 0;
      }

      // Start countdown if active and not expired
      if (vote.value.status === 'active' && !vote.value.isUnlimited && !isExpired) {
        startCountdown();
      }
    }

    // Check if user already voted in this poll
    await checkUserVoted();

    // 无论状态如何，只要有投票数据就更新图表
    if (vote.value.optionsWithVotes && vote.value.optionsWithVotes.length > 0) {
      nextTick(() => {
        updateChart();
      });
    }

    // Only start polling if vote is truly active
    if (vote.value.status === 'active' && !isExpired) {
      startPolling();
    }

    // Hide loading indicator
    initialLoading.value = false;
  } catch (error) {
    console.error('Error fetching vote data:', error);
    message.error('Failed to fetch vote data');
    initialLoading.value = false;
    fetchError.value = true;

    // If this is a polling update, stop polling on error
    if (pollingInterval.value) {
      stopPolling();
    }
  }
};

// Retry fetching data
const retryFetch = async () => {
  initialLoading.value = true;
  await fetchVoteData();

  // If successful and vote is active, restart polling
  if (!fetchError.value && effectiveVoteStatus === 'active') {
    startPolling();
  }
};

// Submit vote
const submitVote = async () => {
  try {
    // Check if user already voted
    const alreadyVoted = await checkUserVoted();
    if (alreadyVoted) {
      message.warning('You have already voted in this poll');
      return;
    }

    submitting.value = true;

    // Prepare data for submission
    let selectedOptions = [];
    if (vote.value.allowMultipleChoice) {
      selectedOptions = voteForm.value.selectedOptions;
    } else {
      selectedOptions = [voteForm.value.selectedOption];
    }

    // In a real app, you would call an API here
    // await submit_vote(store.vote_code, selectedOptions);

    // For demo, update local state

    console.log(selectedOptions);
    try {
      console.log(1)
      console.log(vote.value);
      const vote_result = await make_vote(store.vote_code, vote.value.optionsWithVotes[selectedOptions[0]].option_id);
      console.log(vote_result);
      await recordUserVote(selectedOptions);
      message.success('Your vote has been submitted!');
      selectedOptions.forEach(optionIndex => {
        vote.value.optionsWithVotes[optionIndex].votes += 1;
      });

      // Update total votes
      vote.value.totalVotes = vote.value.optionsWithVotes.reduce((sum, option) => sum + option.votes, 0);

      // Reset form
      voteForm.value.selectedOption = null;
      voteForm.value.selectedOptions = [];

      // Update chart
      updateChart();
    } catch (e) {
      console.log(e);
      message.error("Something wrong happened, please try again.");
    }

    // Notify parent component
    emit('vote-submitted', selectedOptions);

    // Success message
  } catch (error) {
    console.error('Error submitting vote:', error);
    message.error('Failed to submit your vote. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Start polling for updates
const startPolling = () => {
  // Clear any existing polling
  stopPolling();

  // Set up polling intervals
  pollingInterval.value = setInterval(() => {
    fetchVoteData();
  }, 5000); // Poll every 5 seconds

  // For performance, we don't show loading animation during polling
};

// Stop polling
const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

// 修改：考虑投票是否已过期
const startCountdown = () => {
  // Clear any existing countdown first
  stopCountdown();

  // 如果投票已经结束或过期，不启动倒计时
  if (isVoteExpired.value || vote.value.status === 'ended') {
    timeLeft.value = 0;
    return;
  }

  // Calculate initial time left
  const now = new Date();
  const end = new Date(vote.value.endTime);
  timeLeft.value = Math.max(0, Math.floor((end - now) / 1000));

  // Set up countdown interval (every second)
  countdownInterval.value = setInterval(() => {
    updateTimeLeft();
  }, 1000);
};

// Stop countdown
const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

// Watch for status changes
watch(() => vote.value.status, (newStatus) => {
  if (newStatus === 'ended') {
    stopPolling();
    stopCountdown();
  }
});

// 新增：监听有效状态变化
watch(effectiveVoteStatus, (newStatus, oldStatus) => {
  if (newStatus === 'ended' && oldStatus === 'active') {
    // 当状态从active变为ended时，自动刷新图表
    nextTick(() => {
      updateChart();
    });

    // 停止轮询和倒计时
    stopPolling();
    stopCountdown();
  }
});

// Watch for chart style changes to update the chart
watch(() => vote.value.voteStyle, () => {
  if (chart.value) {
    updateChart();
  }
});

// Watch for vote code changes in the store
watch(() => store.vote_code, (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    // If code changes in Pinia store, restart everything
    initialLoading.value = true;
    stopPolling();
    stopCountdown();
    fetchVoteData();
  }
});

// Lifecycle hooks
onMounted(async () => {
  // Merge initial data if provided
  if (props.initialVoteData && Object.keys(props.initialVoteData).length > 0) {
    vote.value = { ...vote.value, ...props.initialVoteData };
    initialLoading.value = false;
  } else if (store.vote_code) {
    // Fetch data from API using the vote code from Pinia
    await fetchVoteData();
  } else {
    // No vote code available
    initialLoading.value = false;
    fetchError.value = true;
    message.error('No vote code provided');
    await router.push({name: 'join'});
  }

  // Check if user already voted
  await checkUserVoted();

  // Initialize chart
  initChart();

  // Start polling and countdown if vote is active and not expired
  if (effectiveVoteStatus === 'active' && !isVoteExpired.value) {
    startPolling();
    if (!vote.value.isUnlimited) {
      startCountdown();
    }
  }
});

onBeforeUnmount(() => {
  // Clean up
  stopPolling();
  stopCountdown();

  if (chart.value) {
    chart.value.dispose();
  }

  window.removeEventListener('resize', () => {
    chart.value?.resize();
  });
});
</script>

<style scoped>
.vote-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
}

.vote-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.header-actions {
  position: absolute;
  left: 0;
  top: 0;
}

.vote-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.vote-join-info {
  font-size: 16px;
  color: #555;
  margin-bottom: 8px;
}

.vote-code {
  font-weight: bold;
  color: #8aa2ff;
}

.vote-timer {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-top: 10px;
}

.vote-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin: 20px auto;
  width: 85%;
  max-width: 1400px;
  justify-content: center;
  padding: 0 20px;
}

.main-card-container {
  width: 68%;
  flex-shrink: 0;
}

.vote-card-container {
  width: 28%;
  flex-shrink: 0;
}

.main-card,
.vote-card {
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  height: 100%;
  background-color: #fff;
}

.back-btn-container {
  position: absolute;
  left: 24px;
  top: 24px;
  z-index: 1;
}

.vote-header {
  text-align: center;
  margin-bottom: 20px;
  padding-top: 20px;
}

.vote-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.vote-join-info {
  font-size: 16px;
  color: #555;
  margin-bottom: 8px;
}

.vote-code {
  font-weight: bold;
  color: #1890ff;
}

.vote-timer {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-top: 10px;
}

.vote-chart-container {
  padding: 0 10px 20px;
}

.vote-chart {
  width: 100%;
  height: 400px;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.vote-option {
  margin-bottom: 15px;
}

.option-color-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}

.submit-btn-container {
  margin-top: 30px;
  text-align: center;
}

.vote-ended-message {
  margin-top: 20px;
}

.vote-ended-alert {
  margin-bottom: 20px;
}

.user-voted-alert {
  margin-bottom: 20px;
}

:deep(.ant-result) {
  padding: 24px 0;
}

/* Loading spinner styles */
:deep(.ant-spin-nested-loading) {
  width: 100%;
  height: 100%;
}

:deep(.ant-spin) {
  max-height: none;
}

:deep(.ant-spin-container) {
  width: 100%;
  height: 100%;
}

/* Vote results styles */
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

.line-graph-item {
  margin-bottom: 10px;
}

.vote-stats {
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .vote-layout {
    width: 95%;
  }
}

@media (max-width: 1050px) {
  .vote-layout {
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 800px;
  }

  .main-card-container,
  .vote-card-container {
    width: 100%;
  }

  .back-btn-container {
    position: static;
    margin-bottom: 20px;
    text-align: left;
  }

  .vote-header {
    padding-top: 0;
  }
}
</style>