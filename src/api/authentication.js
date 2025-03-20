import request from "@/utils/request.js";

const useUserAuth = () => {
  const login = (username, password) => {
    return request({
      url: '/login/',
      method: 'post',
      data: {
        email: username,
        password
      }
    })
  }
  const register = (username, email, password) => {
    return request({
      url: '/register/',
      method: 'post',
      data: {
        name: username,
        password,
        email
      }
    })
  }
  const get_profile = () => {
    return request({
      url: '/profile/',
      method: 'get'
    })
  }
  const update_profile = (data) => {
    return request({
      url: '/profile/',
      method: 'put',
      data
    })
  }
  const admin_login = (data) => {
    return request({
      url: '/admin/login/',
      method: 'post',
      data
    })
  }
  return {
    login,
    register,
    get_profile,
    update_profile,
    admin_login
  }
}

export default useUserAuth;