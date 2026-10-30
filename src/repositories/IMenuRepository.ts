import { Menu } from '../types';

export interface IMenuRepository {
  getAll(): Promise<Menu[]>;
  getById(id: string): Promise<Menu | null>;
  getByCategory(category: string): Promise<Menu[]>;
  save(menu: Menu): Promise<Menu>;
  delete(id: string): Promise<void>;
}
