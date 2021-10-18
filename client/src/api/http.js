import axios from 'axios';

const instance = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  config => {
    // config.headers.authorization = getAccessToken();
    return config;
  },
  err => {
    return Promise.reject(err);
  }
);

instance.interceptors.response.use(
  config => {
    return config;
  },
  err => {
    const { response } = err;
    const { status } = response ?? 500;
    if (status >= 500) {
      response.data = {
        message: '서버 에러 잠시 후 다시 시작해주세요.',
        token: null,
      };
    }
    return Promise.reject(response);
  }
);

export default instance;