import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ⚠️ GitHub 레포 이름과 정확히 일치해야 함 (반드시 슬래시 포함)
  base: '/quartile_coaching/', 
})
