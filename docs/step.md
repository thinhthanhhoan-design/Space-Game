# NHẬT KÝ PHÁT TRIỂN & TIẾN TRÌNH DỰ ÁN 🚀
**Dự án:** UET Space Escape (UETE-3637)
**Giai đoạn hiện tại:** Đã hoàn thiện toàn bộ Core hệ thống và Chuỗi Cinematic mở đầu nguyên bản.

Dưới đây là biên niên sử các bước chúng ta đã thực hiện để xây dựng trò chơi từ con số không, cùng với vai trò của từng file được sinh ra qua mỗi giai đoạn.

---

## 🛠 BƯỚC 1: XÂY DỰNG NỀN MÓNG & BỘ NÃO TRUNG TÂM
Mục tiêu đầu tiên là phải thiết lập một cấu trúc dự án module hóa rõ ràng, dễ bảo trì, thay vì viết dồn toàn bộ mã vào một tệp `main.js`.

*   `src/utils/CONFIG.JS`: **"Cuốn tự điển của game"**. Định nghĩa mọi hằng số quan trọng (đường dẫn file, máu, tốc độ tàu, biên độ bay, thời lượng chuyển cảnh cinematic...).
*   `src/systems/core/SceneController.js`: **"Người cầm máy quay"**. Quản lý môi trường WebGL (Scene), Ánh sáng (Lights) và tự động di chuyển Camera bám sát sau lưng người chơi. Chứa tiện ích bật chế độ rung màn hình (Screen Shake).
*   `src/systems/core/GameLoop.js`: **"Nhịp tim của trò chơi"**. Tương thích với tần số quét của màn hình (RequestAnimationFrame). Tính toán `delta time` giúp game chạy chuyển động đều đặn trên cả máy tính yếu lẫn máy tính nhanh.
*   `src/systems/core/StateManager.js`: **"Người phân làn"**. Nắm giữ lẫy công tắc của Game State, khoá không cho phép người chơi điều khiển tàu chạy khi đoạn phim Intro chưa kết thúc.
*   `src/systems/core/GameManager.js`: **"Tổng Chỉ Huy"**. Kết nối tất cả Scene, Player, Camera và gọi hàm update liên tục từ GameLoop. Là xương sống khởi động mọi bộ phần khác của game.
*   `src/main.js`: Lớp vỏ bọc mỏng nhất, chứa điểm gọi khởi động duy nhất (`game.init()`) đến GameManager.

---

## 🌍 BƯỚC 2: KHÔNG GIAN BỐI CẢNH & VẬT LÝ DI CHUYỂN
Tiến hành tạo ra môi trường vũ trụ chân thực xung quanh con tàu để không gian không bị "chết".

*   `src/systems/environment/Background.js`: Nạp nền ảnh dải ngân hà bao quanh (Spherical Skybox). Tạo các đám mây tinh vân pha màu hoà trộn và hàng ngàn điểm sao 2D. 
    * *Cơ chế đặc biệt*: Giả lập ảo giác nhào lộn. Khi tàu lượn ngang, thay vì phải lật cả game thì `Background.js` lật ngược bầu trời để đánh lừa thị giác mượt mà (Horizon Banking).
*   `src/systems/player/Player.js`: Xử lý nạp File mô hình 3D `uete_3637.glb` qua thư viện.
    * *Chống trượt màn hình*: Phát triển Flight Envelope, dựng bức tường tàng hình khoá tàu dội lại nếu bay xa khỏi ống kính.
    * *Động lực bay*: Nội suy (gsap/math lerp) giúp máy bay từ từ xoay nghiêng cánh khi quẹo (Roll) và cất/hạ mũi lên xuống (Pitch).

---

## 🎬 BƯỚC 3: MỞ ĐẦU HOÀNG TRÁNG (INTRO & GSA) 
Sáng tạo cơ chế hiệu ứng Hội tụ hạt vi mô, vốn không có sẵn trên tài liệu cơ bản, nhằm gây hưng phấn tột độ lúc vào trò chơi.

*   `src/systems/ui/Intro.js`: 
    * Fake hình ảnh Logo 2D bằng cách tạo nên một bề mặt 100 ngàn điểm hạt màu.
    * Kích nổ 100 ngàn hạt đó văng ra vũ trụ ngẫu nhiên với tốc độ khủng.
*   `src/systems/effects/GSA.js` *(Geometry Sample & Animation)*: **Công trình xuất sắc nhất về lập trình đồ họa (OpenGL/Shader_)**.
    * Chạy thuật toán Surface Sampler để quét toàn bộ điểm cấu trúc lưới trên phi thuyền. 
    * Kết bện các hạt bị nổ ở Intro thành ma trận GPU, sử dụng VRAM hút tụ các hạt này khớp hoàn hảo vào boong tàu người chơi trong nháy mắt mà không giật FPS.

---

## 🌀 BƯỚC 4: RẠP XIẾC CHUYỂN CẢNH ĐIỆN ẢNH (CINEMATICS)
Biến quá trình bắt đầu chơi thành một phân cảnh kịch tính kéo dài 13s, ép buộc người dùng phải xem những rủi ro tàu gặp trước khi trao lại quyền cầm vô lăng. Nhóm vào tệp trung tâm là `src/systems/effects/CinematicEffects.js`.

*   **Pha kịch bản:** Các đoạn hội thoại tự gõ chữ máy tính hoà quyện cùng góc máy Flycam di dời ngoạn mục bay vòng quanh máy bay. Gây nhiễu rung lắc và chớp chói tín hiệu đỏ bằng thẻ `<div>` HTML phủ lên canvas đồ hoạ (Overlay DOM).
*   **Pha rớt Hố đen lõi kép:** Hình khuyên lỗ đen lù lù hiện ra xa hút tàu xoáy vòng lọt vào trung tâm và bóp thành kích thức vô cực.
*   **Pha Đường ống hầm Tốc Độ (Warp Tunnel):** 
    * *Toán hình dạng*: Áp dụng TubeGeometry đan vòng dây kết hợp hàm toán học nhiễu biến đổi (Math.sin) để làm đường hầm bị cuộn xéo đi trông rất viễn tưởng. Mật độ chi chít đan thành rọ.
    * *Logic vô tận*: Kết nối 3 block đường ống chạy băng chuyền giật lùi tuần hoàn đằng sau lưng máy quay để tiết kiệm bộ nhớ.
    * *Tia chớp Laser dọc*: Thay thế các Speedlines bằng dải trụ phát sáng (AdditiveBlending) dài rực.
*   **Pha Thoát Ống Hầm (Xé không gian):** Chốt mốc 8 giây cuối, ngừng quy luật luân hồi. Gia tốc đẩy ống vật lý bằng GSAP bay bứt vọt ra đằng sau ống kính máy quay, trả lại bóng đêm nền trời trước khi bắt đầu chơi.

---

## 🚀 TIẾN TRÌNH KẾ TIẾP (CHUẨN BỊ TRIỂN KHAI)
*   **Quản lý chướng ngại vật:** Khai thác `AsteroidSystem.js` đang nằm chờ. Sinh đá dựa theo hệ thống level tăng độ khó.
*   **Hệ thống đạn và kẻ thù:** Triển khai `Weapon.js` và `Combat.js`.
*   **Cơ chế máu & Hồi sinh:** Đưa số HP từ CONFIG vào logic UI.
