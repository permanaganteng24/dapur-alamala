import { menuRepository } from '../repositories/MenuRepository';
import { IMenuRepository } from '../repositories/IMenuRepository';
import { Menu } from '../types';
import { MenuItemModel } from '../domain/MenuItem';

export class MenuService {
  constructor(private repo: IMenuRepository = menuRepository) {}

  async getAllMenus(): Promise<MenuItemModel[]> {
    const raw = await this.repo.getAll();
    return raw.map((m: Menu) => new MenuItemModel(m));
  }

  async getMenusByCategory(category: string): Promise<MenuItemModel[]> {
    const raw = await this.repo.getByCategory(category);
    return raw.map((m: Menu) => new MenuItemModel(m));
  }

  async searchMenus(keyword: string): Promise<MenuItemModel[]> {
    const all = await this.getAllMenus();
    if (!keyword.trim()) return all;
    const lower = keyword.toLowerCase();
    return all.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.description.toLowerCase().includes(lower) ||
      (m.tag && m.tag.toLowerCase().includes(lower))
    );
  }

  async saveMenuItem(item: Partial<Menu>): Promise<Menu> {
    const images = Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : [item.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'];
    const fullMenu: Menu = {
      id: item.id || 'menu-' + Date.now(),
      name: item.name || 'Hidangan Baru',
      category: item.category || 'nasi_box',
      description: item.description || '',
      price: Number(item.price) || 25000,
      image_url: images[0] || item.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
      images,
      tag: item.tag || '',
      is_available: item.is_available ?? true
    };
    return this.repo.save(fullMenu);
  }

  async deleteMenuItem(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}

export const menuService = new MenuService();
