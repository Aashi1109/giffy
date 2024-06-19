const config = {
  apiUrl: import.meta.env.VITE_GIFFY_API_URL,
  retryExponentialMultipler: 1000,
  maxRetry: 3,
  maxFetchOutput: 20,
  fetchTimeout: 1000,
};

export default config;
