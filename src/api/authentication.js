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
  return {
    login,
    register
  }
}

export default useUserAuth;