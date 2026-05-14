module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@constants': './src/constants',
            '@store': './src/store',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin', // ⚠️ doit toujours rester EN DERNIER
    ],
  };
};