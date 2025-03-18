import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useVote = defineStore('vote', {
  state: () => {
    return {
      vote_code: ''
    }
  },
  actions: {
    setCode(vote_code) {
      this.vote_code = vote_code;
    }
  }
})