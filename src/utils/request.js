import axios from "axios";
import {useAuthStore} from "@/stores/authentication.js";
import router from "@/router";
import {message} from "ant-design-vue"; // 确保导入你的路由器

const request = axios.create({
  baseURL: 'http://20.68.216.131:8000/polls/api/',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(config => {
  const store = useAuthStore();
  if (store.is_login) {
    config.headers['Authorization'] = 'Bearer ' + store.token;
  }
  return config;
})

request.interceptors.response.use(
    response => {
      // 成功响应的处理
      return response;
    },
    error => {
      // 错误响应的处理
      if (error.response) {
        // 服务器返回了响应
        if (error.response.status === 403) {
          // 如果状态码是403，清除登录状态并重定向到登录页面
          const store = useAuthStore();

          // 重定向到登录页面
          router.push({name: 'login'}); // 或者你的登录页面路径

          message.warn("Login Status Expired, please login again.")
        }
      }

      // 返回错误，以便调用处可以继续处理
      return Promise.reject(error);
    }
);

export default request;