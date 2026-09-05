function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '';
  return '/' + trimmed.replace(/^\/+|\/+$/g, '');
}

module.exports = ({ config }) => {
  const baseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_BASE_URL);
  if (!baseUrl) return config;

  return {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl,
    },
  };
};
