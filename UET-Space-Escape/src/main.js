import { GameManager } from './systems/core/GameManager.js'; // Nhập lớp GameManager từ đường dẫn tương ứng để quản lý trò chơi

// Khởi chạy toàn bộ hệ thống
// Khởi chạy toàn diện hệ thống UET Space Escape
window.onload = () => {
    console.log("🚀 UET-3637: Hệ thống đã sẵn sàng. Đang kích hoạt GSA (Geometry Sample & Animation)...");
    
    // Khởi tạo trình quản lý game
    const game = new GameManager(); 
    game.init(); 

    // Tiếp cận game instance từ console để debug hiệu ứng tụ điểm nếu cần
    window.UET_GAME = game;
}; // Kết thúc hàm khởi tạo
