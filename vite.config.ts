import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/quartile_coaching/', // GitHub 레포 이름과 정확히 일치
  server: {
    host: true,
    port: 5173
  }
})