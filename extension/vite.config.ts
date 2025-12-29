import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync, readFileSync, writeFileSync } from 'fs';

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
          let html = readFileSync(htmlFile, 'utf-8');
          html = html.replace(/\.\.\/\.\.\/popup\//g, './');
          writeFileSync(resolve(popupDir, 'index.html'), html);
        }
      }

      // Move HTML from src/galaxy to galaxy
      const srcGalaxyDir = resolve(distDir, 'src/galaxy');
      const galaxyDir = resolve(distDir, 'galaxy');

      if (existsSync(srcGalaxyDir)) {
        const htmlFile = resolve(srcGalaxyDir, 'index.html');
        if (existsSync(htmlFile)) {
          let html = readFileSync(htmlFile, 'utf-8');
          // Fix paths: ../../galaxy/ -> ./ and ../../chunks/ -> ../chunks/ etc
          html = html.replace(/\.\.\/\.\.\/galaxy\//g, './');
          html = html.replace(/\.\.\/\.\.\//g, '../');
          writeFileSync(resolve(galaxyDir, 'index.html'), html);
        }
      }

      // Remove the src directory after processing all HTML files
      if (existsSync(resolve(distDir, 'src'))) {
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
  base: '',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared/src'),
      'three': resolve(__dirname, 'node_modules/three'),
    },
  },
  ssr: {
    noExternal: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: false, // Disable minification to fix Three.js issues
    target: 'esnext',
    commonjsOptions: {
      include: [/three/, /node_modules/],
    },
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
        'galaxy/index': resolve(__dirname, 'src/galaxy/index.html'),
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
