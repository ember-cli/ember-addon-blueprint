import { defineConfig } from 'vite';
import {
  ember,
  classicEmberSupport,
  defaultRolldownSharedPlugins,
} from '@embroider/vite';
import babel from '@rolldown/plugin-babel';

// For scenario testing
const isCompat = Boolean(process.env.ENABLE_COMPAT_BUILD);

export default defineConfig({
  plugins: [
    ...(isCompat ? [classicEmberSupport()] : []),
    ember({
      // Also run babel on dependencies that vite pre-bundles
      rolldownSharedPlugins: defaultRolldownSharedPlugins.concat(
        '@rolldown/plugin-babel',
      ),
    }),
    await babel({
      presets: ['./babel.config.cjs'],
      include: /\.(js|ts|gjs|gts|mjs|mts|hbs)(\?.*)?$/,
      // Only rolldown's runtime: addons in node_modules need babel too, for macros
      exclude: [/^\0rolldown\/runtime\.js$/],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        tests: 'tests/index.html',
      },
    },
  },
});
