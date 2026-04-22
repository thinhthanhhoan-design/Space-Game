# BẢNG GHI CHÚ CẤU TRÚC VÀ NỘI DUNG CÁC FILE SPACE ESCAPE

Dưới đây là ghi chú tổng hợp về tất cả các file mã nguồn hiện có nội dung trong dự án **UET-Space-Escape**. Bạn có thể dùng tệp này làm tài liệu báo cáo hoặc giúp các thành viên trong nhóm dễ hiểu luồng đi của mã nguồn:

## 1. Thư mục Gốc & Cấu hình ⚙️
* **`src/main.js`**: File khởi chạy đầu tiên của toàn bộ dự án. Khi trang web tải xong, gọi hàm `window.onload` để khởi tạo `GameManager` và mồi lửa bắt đầu tiến trình chạy game.
* **`src/utils/CONFIG.JS`**: Trái tim cấu hình của toàn bộ game. Nơi lưu trữ mọi thông số (sát thương, giới hạn bản đồ, máu boss, tốc độ tàu, đường dẫn ảnh/âm thanh...) giúp việc cân bằng game dễ dàng hơn rất nhiều.
* **`src/utils/Math.js`**: (Nếu có) Thư viện chứa các hàm toán học hỗ trợ nội suy góc xoay, khoảng cách, sinh số ngẫu nhiên,...
* **`src/styles/main.css`**: File chứa mã thiết kế (CSS) dùng cho UI tĩnh phía trên nền đồ họa 3D (ví dụ chữ hiện khi pause, hoặc viền máu).

## 2. Hệ thống Lõi (Core Systems) 🧠
* **`src/systems/core/GameManager.js`**: **Bộ Não Tổng.** Đứng ra điều phối tất cả các module khác. Quản lý chuyển cảnh từ màn hình chờ (Intro) vào cảnh chơi thật (Playing), móc nối Camera với Player, ra lệnh `update` cho các bộ phận.
* **`src/systems/core/SceneController.js`**: Thiết lập móng nhà cho Three.js: `Scene` (Không gian), `Camera` (Máy quay dính theo đằng sau tàu), `Renderer` (Bộ kết xuất vẽ ra màn hình) và hệ thống ánh sáng chiếu rọi.
* **`src/systems/core/GameLoop.js`**: Vòng lặp thời gian vô phép màu vũ trụ (`requestAnimationFrame`). File chịu trách nhiệm tính toán độ trễ thời gian `delta` và chạy xoay vòng 60 khung hình/giây.
* **`src/systems/core/StateManager.js`**: Quản lý thiết lập trạng thái của trò chơi với các cờ `boolean` (đang chơi, đang dừng, đã thua, bắt đầu).

## 3. Hệ thống Người Chơi (Player System) 🚀
* **`src/systems/player/Player.js`**: Chứa tàu trung tâm `UET-3637`. Giới hạn bản đồ, tọa độ, tốc độ. Cung cấp thuật toán hiệu ứng vật lý nghiêng thân (Roll) và ngóc/chúi đầu (Pitch) y như thật khi rẽ.
* **`src/systems/player/Weapons.js`**: Sảnh vũ khí của người chơi. Quản lý việc sinh tia laser hỏa lực tịnh tiến tới phía trước, nhịp độ bắn, tốc độ đạn rơi trúng hệ thống kẻ địch.

## 4. Hệ thống Kẻ Địch (Enemy) 👾
* **`src/systems/enemy/Enemy.js`**: Lớp quản lý quái nhỏ lẻ tẻ sinh ra thường xuyên để cản bước tiến, các va chạm làm sứt mẻ thanh giáp máu đầu tiên của main.
* **`src/systems/enemy/Boss.js`**: Chuyên phục vụ cho các "Sếp lớn" cuối màn, chứa thanh Máu to tướng, chống đạn, thuật toán xả laser diện siêu rộng đe dọa sinh mệnh tàu UET-3637. 
* **`src/systems/enemy/Patterns.js`**: Băng cuộn thuật toán đường bay sẵn có (La thẳng, Lượn sóng xiên xéo) để kẻ địch di chuyển lắc léo trên bản đồ.

## 5. Hệ thống Môi trường (Environment) 🌌
* **`src/systems/environment/Background.js`**: Chịu trách nhiệm tạo lồng không gian tĩnh lặng chạy lùi ra phía sau. Đảm nhiệm chức năng xoay nghiêng nền trời (Horizon Banking) huyễn hoặc khi tàu quẹo góc rẽ.
* **`src/systems/environment/Asteroids.js`**: Hệ thống tạo chướng ngại vật/thiên thạch ngẫu nhiên rơi thẳng xuống khung hình ép người chơi phải tập trung né tránh.

## 6. Hiệu ứng (Effects) & Giao Diện (UI) ✨
* **`src/systems/ui/Intro.js`**: Kịch bản Text bay lượn cốt truyện game kéo dài 13s, logic xử lý text rụng tan vỡ biến hóa nhập tâm người chơi vào cảnh hành động.
* **`src/systems/ui/UIManager.js`**: Phụ trách hiển thị bảng HUD, thanh Máu, số Điểm phá hủy, hiển thị kho đạn trên màn hình chơi (canvas html).
* **`src/systems/effects/SpecialEffects.js` / `Explosion.js`**: Cụm xử lý hoạt cảnh cháy nổ vụn vỡ tạo JUICE (cảm giác đập phá 3D mãn nhãn) - tung hạt cát lửa bay tán loạn xung quanh mỗi khi đạn rọi rập quái ác nổ.
