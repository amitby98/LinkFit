import axios from "axios";

export const httpService = axios.create({
  baseURL: "http://localhost:3001/api",
});

httpService.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers!.Authorization = `Bearer ${token}`;
  }
  return config;
});
