import { defineConfig } from 'vite';

export default defineConfig({
  // Thư mục chứa index.html (mặc định là thư mục gốc)
  root: './',
  
  // Thư mục chứa các tài nguyên công khai tĩnh (textures, sounds, models)
  publicDir: 'public',
  
  server: {
    port: 3000,
    open: true, // Tự động mở trình duyệt khi chạy dev
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Dọn dẹp thư mục dist trước khi build
  },
  
  // Chỉ định các tệp GLSL là dạng tài nguyên (không phải module code)
  // để Vite tự động xử lý hoặc bạn có thể gọi import shader dưới dạng raw string (?raw)
  assetsInclude: ['**/*.glsl'],
});
