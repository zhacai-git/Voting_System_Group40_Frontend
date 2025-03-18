import request from "@/utils/request.js";

const useVoteApi = () => {
  const get_my_vote = () => {
    return request({
      url: 'polls/my-polls/',
      method: 'get',
    })
  }
  const create_vote = (data) => {
    return request({
      url: '/polls/create/',
      method: 'post',
      data
    })
  }
  const get_vote = (code) => {
    return request({
      url: '/polls/find/' + code + '/',
      method: 'get'
    })
  }
  return {
    get_my_vote,
    create_vote,
    get_vote
  }
}

export default useVoteApi;