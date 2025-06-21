import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    plugins: [react()],

    // Environment-specific build configuration
    build: {
      // Enable minification in production, disable in development
      minify: isProduction ? 'esbuild' : false,

      // Source maps: detailed in dev, basic in prod for debugging
      sourcemap: isDevelopment ? true : 'hidden',

      // CSS optimization
      cssCodeSplit: isProduction, // Split CSS in production for better caching

      // Clean output directory
      emptyOutDir: true,

      // Production optimizations
      rollupOptions: isProduction ? {
        output: {
          // Better chunk splitting for caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      } : undefined,

      // Smaller bundle size in production
      chunkSizeWarningLimit: isProduction ? 500 : 1000,
    },

    // ESBuild configuration
    esbuild: {
      // Keep function names in development for better debugging
      keepNames: isDevelopment,

      // Remove console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    // Environment variables and mode detection
    define: {
      // Set NODE_ENV based on actual mode
      'process.env.NODE_ENV': JSON.stringify(mode),

      // App version for debugging
      '__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),

      // Build timestamp
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true, // Allow external connections

      // Environment-specific settings
      hmr: isDevelopment,

      // HTTPS in development (optional)
      https: false,
    },

    // Preview server (for production builds)
    preview: {
      port: 4173,
      host: true,
    },

    // Optimization for large apps
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
    },
  };
});
