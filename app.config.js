module.exports = ({ config }) => {
  // Use Expo's default AppEntry registration. Our `App.js` decides which
  // navigator to render based on APP_TARGET, so no custom entryPoint needed.
  return {
    ...config,
    name: config.name || 'clean-green-app',
    slug: config.slug || 'clean-green-app',
    extra: {
      ...(config.extra || {}),
      appTarget: process.env.APP_TARGET === 'delivery' ? 'delivery' : 'user',
    },
  };
};


