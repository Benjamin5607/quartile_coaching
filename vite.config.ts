import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ⚠️ GitHub 레포 이름과 정확히 일치해야 함 (예: /sla-coaching-tool/)
  base: '/sla-coaching-tool/', 
})
