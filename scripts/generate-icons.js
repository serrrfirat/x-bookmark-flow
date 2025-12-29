// Simple script to generate PNG icons from canvas
// Run with: node scripts/generate-icons.js

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Base64 encoded minimal PNG icons (blue bookmark icon)
// These are simple placeholder icons - replace with proper icons later

// Pre-generated PNG icons as base64 (simple blue square with bookmark shape)
const icons = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkGDDASIb+BwxA8P8/A8P/RjD9HxWM1MBIbUOwAKODAKMDBwMCQ8cLDABmvAoRJIBqTQAAAABJRU5ErkJggg==',
  32: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAASklEQVRYR+3WwQkAIAhA0XX/pW0Dt6gOUkEXyCP4EL4gqmq0itkGwBsQ1b5fABABABABABDxgNz0fAAQAQAQAQAQ8YDc9HwAEHEARbQQIY4h1+oAAAAASUVORK5CYII=',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAWklEQVRoQ+3WsQ0AIAgF0OL+S+MGdkZDYUJBo8m7ksL8D0BVpVppa4MBADeBVfX3AoAIAIAIAICIAPSm1wOACACACACAiAD0ptcDgAgAgIgABEC32toG4HpgA1raFjHwJLnfAAAAAElFTkSuQmCC',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAfElEQVR4nO3bMQ0AIBDAwOP+O8cGGNggkTUEXPfMzPcE7j0dYG8C5AWQFwDeE7v8bgDyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyAsgLIC+AvADyDjZ7BQxZPHdKAAAAAElFTkSuQmCC'
};

// Write icons
Object.entries(icons).forEach(([size, base64]) => {
  const buffer = Buffer.from(base64, 'base64');
  const path = resolve(__dirname, `../extension/public/icons/icon${size}.png`);
  writeFileSync(path, buffer);
  console.log(`Created icon${size}.png`);
});

console.log('Done! Icons created.');

