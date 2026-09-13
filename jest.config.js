// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-chart-kit)',
  ],
  collectCoverageFrom: [
    'lib/**/*.js',
    'services/**/*.js',
    '!lib/supabase.js',
  ],
};