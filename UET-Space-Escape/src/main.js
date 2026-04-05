import { GameManager } from './systems/core/GameManager.js'; // Nhập lớp GameManager từ đường dẫn tương ứng để quản lý trò chơi

// Khởi chạy toàn bộ hệ thống
window.onload = () => { // Gán một hàm callback vào sự kiện onload của đối tượng window, sẽ được gọi khi toàn bộ trang web (bao gồm cả tài nguyên) tải xong
    const game = new GameManager(); // Tạo một đối tượng mới từ lớp GameManager để quản lý quy trình của trò chơi
    game.init(); // Gọi phương thức init() của game để thiết lập và khởi tạo các thành phần trò chơi
}; // Kết thúc hàm khởi tạo
