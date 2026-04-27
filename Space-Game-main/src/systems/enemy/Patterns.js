import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export const Patterns = {
    // Wave 1: Đội hình lưới, tự động tính kích thước dựa trên tổng số quái
    FORMATION_WAVE_1: (index, total) => {
        const spacing = 3; // Khoảng cách giữa các con quái
        // Tự tính số cột dựa trên tổng số quái (vd: 7 con → 3 cột, 10 con → 4 cột)
        const rowSize = Math.ceil(Math.sqrt(total));
        
        // Tọa độ X: căn giữa đội hình
        const col = index % rowSize;
        const x = (col - (rowSize - 1) / 2) * spacing;
        
        // Tọa độ Y: hàng ngang, đẩy lên cao
        const row = Math.floor(index / rowSize);
        const totalRows = Math.ceil(total / rowSize);
        const y = (row - (totalRows - 1) / 2) * spacing + 5;
        
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