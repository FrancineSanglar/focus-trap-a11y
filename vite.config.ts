import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/FocusTrap.ts',
      name: 'FocusTrap',
      fileName: 'index',
      formats: ['es'],
    },
  },
});