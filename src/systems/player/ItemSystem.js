import { CONFIG } from '../../utils/CONFIG.JS';

export class ItemSystem {
    constructor(player) {
        this.player = player;
        this.inventory = []; // Nơi chứa các Item người chơi kiếm được ghép vào đây quản lý
    }

    // Cơ chế quản lý ITEMS: Hồi máu
    heal(amount) {
        // Cộng máu nhưng không vượt quá giới hạn INITIAL_HP
        this.player.hp = Math.min(this.player.hp + amount, CONFIG.PLAYER.INITIAL_HP);
        console.log(`💚 Đã dùng vật phẩm hồi phục, máu hiện tại: ${this.player.hp} HP`);
    }

    // Cơ chế quản lý ITEMS: Nạp đạn
    addAmmo(amount) {
        // Nạp đạn nhưng không vượt quá kích cỡ băng đạn maxAmmo
        this.player.ammo = Math.min(this.player.ammo + amount, this.player.maxAmmo);
        console.log(`Đã nạp thêm đạn, số lượng đạn: ${this.player.ammo}/${this.player.maxAmmo}`);
    }

    // Hàm cổng giao tiếp đón nhận Item từ map rơi ra
    collectItem(itemType, value) {
        this.inventory.push(itemType);
        if (itemType === 'HEALTH') {
            this.heal(value || 50);
        } else if (itemType === 'AMMO') {
            this.addAmmo(value || 25);
        }
    }
}
