import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
  },
  build: {
    // Katalog (684 ürün) ve açıklamalar bilerek büyük parçalar; ağda gzip ile ~80/150 KB
    chunkSizeWarningLimit: 900,
  },
})
