// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'supabase/.temp/*', 'supabase/functions/**'],
  },
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);