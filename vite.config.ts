import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ⚠️ 레포 이름과 정확히 일치 + 슬래시로 시작/끝
  base: '/quartile_coaching/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 소스맵 비활성화 (배포 용량 최적화)
    sourcemap: false
  }
})