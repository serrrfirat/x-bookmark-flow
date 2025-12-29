import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, renameSync, rmSync } from 'fs';

// Plugin to handle Chrome extension build output
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const publicDir = resolve(__dirname, 'public');
      
      // Move HTML from src/popup to popup
      const srcPopupDir = resolve(distDir, 'src/popup');
      const popupDir = resolve(distDir, 'popup');
      
      if (existsSync(srcPopupDir)) {
        const htmlFile = resolve(srcPopupDir, 'index.html');
        if (existsSync(htmlFile)) {
          copyFileSync(htmlFile, resolve(popupDir, 'index.html'));
        }
        // Remove the src directory
        rmSync(resolve(distDir, 'src'), { recursive: true, force: true });
      }
      
      // Copy manifest.json
      copyFileSync(
        resolve(publicDir, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      );
      
      // Copy icons
      const iconsDir = resolve(publicDir, 'icons');
      const distIconsDir = resolve(distDir, 'icons');
      
      if (!existsSync(distIconsDir)) {
        mkdirSync(distIconsDir, { recursive: true });
      }
      
      if (existsSync(iconsDir)) {
        const files = readdirSync(iconsDir);
        files.forEach(file => {
          if (file.endsWith('.png') || file.endsWith('.svg')) {
            copyFileSync(
              resolve(iconsDir, file),
              resolve(distIconsDir, file)
            );
          }
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'popup/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
