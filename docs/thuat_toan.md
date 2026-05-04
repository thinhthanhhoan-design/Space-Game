# Tổng hợp Thuật toán và Logic trong dự án UET Space Escape

Tài liệu này liệt kê toàn bộ các thuật toán từ giai đoạn sơ khai đến các kỹ thuật tối ưu hiện tại được áp dụng để nâng cấp trò chơi.

---

## 1. Giai đoạn Sơ khai (Basic Implementation)

Trong giai đoạn đầu, nhóm đã sử dụng các logic cơ bản để vận hành game:

### 1.1. Thuật toán va chạm cơ bản (Simple Distance)
*   **Logic:** Sử dụng công thức tính khoảng cách Euclidean giữa hai tâm của vòng tròn/khối cầu: `distance = sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)`.
*   **Hạn chế:** Hàm `Math.sqrt()` (căn bậc hai) là một phép tính tốn kém tài nguyên nếu phải thực hiện hàng nghìn lần mỗi giây cho hàng trăm viên đạn và thiên thạch.

### 1.2. Logic Di chuyển Tuyến tính (Linear Translation)
*   **Logic:** Di chuyển vật thể bằng cách cộng trực tiếp một hằng số vào vị trí `position.z += speed`.
*   **Hạn chế:** Không phụ thuộc vào thời gian thực giữa các khung hình (Frame rate), dẫn đến việc máy mạnh thì vật thể bay nhanh, máy yếu thì vật thể bay chậm.

---

## 2. Giai đoạn Cải thiện và Tối ưu (Current Advanced Algorithms)

Đây là các thuật toán hiện tại đang giúp trò chơi vận hành mượt mà và chuyên nghiệp hơn:

### 2.1. Tối ưu va chạm: Bình phương khoảng cách (Squared Distance)
*   **Thuật toán:** Thay vì lấy căn bậc hai, ta so sánh bình phương khoảng cách với bình phương tổng bán kính: `(dx^2 + dy^2 + dz^2) < (r1 + r2)^2`.
*   **Vị trí code:** `src/utils/Math.js` (hàm `checkSphereCollisionSq`).
*   **Lợi ích:** Tiết kiệm hàng nghìn phép tính CPU mỗi giây, đảm bảo game chạy 60 FPS ổn định.

### 2.2. Quản lý bộ nhớ: Đối tượng Pool (Bullet Pooling)
*   **Thuật toán:** Khởi tạo một mảng chứa sẵn các đối tượng đạn (`pool`). Khi bắn, lấy đạn từ pool; khi đạn biến mất, trả đạn về pool thay vì xóa khỏi bộ nhớ.
*   **Vị trí code:** `src/systems/player/Weapon.js` (các hàm `initPool`, `getBulletFromPool`, `returnBulletToPool`).
*   **Lợi ích:** Triệt tiêu hiện tượng "lag" do Garbage Collection (trình duyệt dọn dẹp bộ nhớ) gây ra.

### 2.3. Quản lý trạng thái: Máy trạng thái hữu hạn (Finite State Machine - FSM)
*   **Thuật toán:** Phân chia game thành các trạng thái độc lập (`MENU`, `PLAYING`, `ENDING`, `GAMEOVER`). Chỉ một trạng thái được hoạt động tại một thời điểm.
*   **Vị trí code:** `src/utils/CONFIG.JS` (object `STATE`).
*   **Lợi ích:** Kiểm soát chặt chẽ luồng logic, tránh xung đột giữa các màn hình UI và gameplay.

### 2.4. Di chuyển mượt mà: Delta Time & Interpolation
*   **Thuật toán:** Sử dụng biến `delta` (thời gian trôi qua giữa 2 khung hình) để tính toán vị trí: `position += velocity * delta * 60`. Kết hợp với **Lerp** (Linear Interpolation) để làm mượt chuyển động xoay của tàu.
*   **Vị trí code:** `src/systems/player/Weapon.js` (hàm `update`) và hệ thống di chuyển chính.
*   **Lợi ích:** Đảm bảo tốc độ game đồng nhất trên mọi loại cấu hình máy tính.

### 2.5. Hi hiệu ứng đồ họa: Procedural Texture Generation
*   **Thuật toán:** Sử dụng thuật toán Gradient Radial trên HTML5 Canvas để vẽ hào quang tỏa sáng cho vật phẩm theo thời gian thực.
*   **Vị trí code:** `src/systems/player/ItemSystem.js` (hàm `createProceduralGlow`).
*   **Lợi ích:** Giảm số lượng file ảnh phải tải, tiết kiệm băng thông và VRAM.

### 2.6. Logic Hồi đáp Vũ khí (Weapon Revert Timer)
*   **Thuật toán:** Sử dụng `setTimeout` kết hợp với kiểm tra ID vũ khí hiện tại. Khi nhặt súng mới, lưu lại loại súng cũ (`previousGun`). Sau một khoảng thời gian `duration`, nếu người chơi vẫn đang dùng súng đó thì hệ thống tự động gọi hàm `setGun` để quay về súng ban đầu.
*   **Vị trí code:** `src/systems/player/ItemSystem.js` (case `WEAPON_2`, `WEAPON_3`).
*   **Lợi ích:** Tạo ra cơ chế gameplay công bằng và có tính chiến thuật.

### 2.7. Thuật toán Spawn ngẫu nhiên có điều kiện (Level-based Random Spawning)
*   **Thuật toán:** Sử dụng hàm ngẫu nhiên kết hợp với điều kiện màn chơi (`min_level`). Chỉ những vật phẩm hoặc quái vật đạt yêu cầu về Level hiện tại mới được đưa vào danh sách `possibleTypes` để sinh ra.
*   **Vị trí code:** `src/systems/player/ItemSystem.js` (hàm `spawnItem`).
*   **Lợi ích:** Phân bổ độ khó và sự phong phú của vật phẩm theo tiến trình của người chơi.

---
*Tài liệu này được cập nhật lần cuối vào ngày 05/05/2026 bởi đội ngũ phát triển dự án.*
