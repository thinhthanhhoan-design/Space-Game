import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export const Patterns = {
    // Wave 1: Formation (e.g., an inverted V or Grid)
    FORMATION_WAVE_1: (index, total) => { // Nhận vào số thứ tự của quái (index) và tổng số quái (total)
        const spacing = 4; // Khoảng cách giữa các con quái là 4 đơn vị
        const rowSize = 5; // Quy định mỗi hàng sẽ có 5 con quái
        
        // Tính toán tọa độ X: 
        // (index % rowSize) giúp quái lặp lại vị trí từ 0 đến 4 trong mỗi hàng
        // Trừ đi (rowSize - 1) / 2 để căn giữa đội hình vào chính diện màn hình
        const x = (index % rowSize - (rowSize - 1) / 2) * spacing;
        
        // Tính toán tọa độ Y:
        // Math.floor(index / rowSize) xác định quái đang ở hàng thứ mấy (hàng 0, hàng 1...)
        // + 5 để đẩy đội hình lên cao hơn mặt đất
        const y = (Math.floor(index / rowSize) - 0.5) * spacing + 5;
        
        // Trả về một Vector3: X và Y đã tính, Z = -150 (xuất hiện từ rất xa phía chân trời)
        return new THREE.Vector3(x, y, -150);
    },

    // Wave 2: Random movement in flight envelope
    getRandomTopPosition: () => {
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        return new THREE.Vector3(
            (Math.random() - 0.5) * envX * 1.4, // X: Thu hẹp vùng spawn (cũ: 2.0)
            (Math.random() - 0.5) * envY * 1.4, // Y: Thu hẹp vùng spawn (cũ: 2.0)
            -150                        // Z = -150 (vẫn xuất hiện từ xa)
        );
    },

    // Update logic for random movement
    // Cập nhật vị trí dựa trên thời gian (delta) và tốc độ (speed)
    updateRandomMovement: (position, delta, speed) => {
        // Di chuyển ngang (X) dựa trên hàm Sin của thời gian thực (Date.now())
        // Tạo ra chuyển động qua lại trái-phải mượt mà
        position.x += Math.sin(Date.now() * 0.001) * delta * speed;
        
        // Di chuyển dọc (Y) dựa trên hàm Cos của thời gian thực
        // Kết hợp Sin và Cos giúp quái bay theo hình vòng tròn hoặc elip nhẹ
        position.y += Math.cos(Date.now() * 0.001) * delta * speed;
    }
};