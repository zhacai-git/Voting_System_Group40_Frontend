import request from "@/utils/request.js";
import {useAuthStore} from "@/stores/authentication.js";
const store = useAuthStore();

const useVoteApi = () => {
  const get_my_vote = () => {
    if (store.is_admin) {
      return request({
        url: '/admin/dashboard/',
        method: 'get'
      })
    } else {
      return request({
        url: 'polls/my-polls/',
        method: 'get',
      })
    }
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
  const make_vote = (code, option_id) => {
    return request({
      url: '/polls/' + code + "/public-vote/",
      method: 'post',
      data: {
        option_id
      }
    })
  }
  const edit_vote = (poll_id, data) => {
    return request({
      url: '/polls/' + poll_id + '/update/',
      method: 'put',
      data
    })
  }
  const del_vote = (poll_id) => {
    return request({
      url: '/polls/' + poll_id + '/delete/',
      method: 'delete'
    })
  }
  return {
    get_my_vote,
    create_vote,
    get_vote,
    make_vote,
    edit_vote,
    del_vote
  }
}

export default useVoteApi;