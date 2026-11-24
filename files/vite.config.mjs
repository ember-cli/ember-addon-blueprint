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
      extends: './babel.config.cjs',
      include: /\.(js|ts|gjs|gts|mjs|mts|hbs)(\?.*)?$/,
      // Addons in node_modules need babel too, for macros
      exclude: [],
      // The plugin turns itself off when this list is empty
      plugins: [() => ({})],
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
