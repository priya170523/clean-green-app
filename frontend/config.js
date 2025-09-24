const ENV = {
  development: {
    API_BASE_URL: 'http://10.227.209.241:5000/api',
  },
  production: {
    API_BASE_URL: 'https://your-production-api-url.com/api',
  },
};

const getEnvVars = (env = 'development') => {
  return ENV[env] || ENV.development;
};

export default getEnvVars;
