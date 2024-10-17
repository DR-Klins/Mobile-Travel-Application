module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    'react-native-reanimated/plugin',  // Moved outside the array, it's a separate plugin
    [
      '@babel/plugin-transform-class-properties',
      { loose: true },  // Add the loose mode here
    ],
    [
      '@babel/plugin-transform-private-methods',
      { loose: true },  // Add the loose mode here
    ],
    [
      '@babel/plugin-transform-private-property-in-object',
      { loose: true },  // Add the loose mode here
    ],
  ],
};
