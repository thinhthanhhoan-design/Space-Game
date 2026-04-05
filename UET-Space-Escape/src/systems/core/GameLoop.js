import * as THREE from 'three'; // Nhập toàn bộ thư viện Three.js với tên là THREE để sử dụng các công cụ 3D

export class GameLoop { // Khai báo và xuất (export) lớp GameLoop dùng để quản lý vòng lặp chính của trò chơi
    constructor(sceneController, gameManager) { // Hàm khởi tạo của GameLoop, nhận vào sceneController (quản lý cảnh 3D) và gameManager (quản lý logic game)
        this.sceneController = sceneController; // Lưu tham chiếu của sceneController vào thuộc tính của lớp để sử dụng sau
        this.gameManager = gameManager; // Lưu tham chiếu của gameManager vào thuộc tính của lớp
        this.clock = new THREE.Clock(); // Tạo một đối tượng Clock từ thư viện Three.js để theo dõi và lấy thời gian trôi qua giữa các khung hình (delta time)
    } // Kết thúc hàm khởi tạo

    start() { // Phương thức start() để bắt đầu chạy vòng lặp trò chơi
        const animate = () => { // Khai báo một hàm mũi tên có tên animate, đại diện cho một bước trong vòng lặp khung hình
            requestAnimationFrame(animate); // Yêu cầu trình duyệt gọi lại hàm animate vào lần cập nhật giao diện (vẽ khung hình) tiếp theo, tạo thành vòng lặp liên tục
            const delta = this.clock.getDelta(); // Lấy khoảng thời gian delta (giây) tính từ lần gọi getDelta() trước đó, giúp đồng bộ chuyển động bất kể tốc độ khung hình
            const elapsedTime = this.clock.getElapsedTime(); // Lấy tổng thời gian (giây) đã trôi qua kể từ khi đối tượng Clock được khởi tạo
            
            // Central update logic (Logic cập nhật trung tâm)
            this.gameManager.update(elapsedTime, delta); // Gọi phương thức update của gameManager, truyền vào tổng thời gian và delta để cập nhật trạng thái trò chơi (vị trí tàu, môi trường, v.v.)
            
            this.sceneController.render(); // Gọi phương thức render của sceneController để vẽ (họa lại) cảnh lên màn hình dựa trên các thay đổi vừa được cập nhật
        }; // Kết thúc định nghĩa hàm animate
        animate(); // Bắt đầu vòng lặp bằng cách gọi hàm animate lần đầu tiên
    } // Kết thúc phương thức start
} // Kết thúc khai báo lớp GameLoop
