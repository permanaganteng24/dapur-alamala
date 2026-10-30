import { IMenuRepository } from './IMenuRepository';
import { Menu } from '../types';
import { INITIAL_MENUS } from '../data/seedData';
import { STORAGE_KEYS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export class MenuRepository implements IMenuRepository {
  private cache: Menu[] | null = null;

  async getAll(): Promise<Menu[]> {
    if (this.cache) return this.cache;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('menus').select('*').order('name');
        if (!error && data && data.length > 0) {
          this.cache = data as Menu[];
          return this.cache;
        }
      } catch {
        // Fallback to local
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.MENUS);
        if (raw) {
          this.cache = JSON.parse(raw);
          return this.cache || INITIAL_MENUS;
        }
      } catch {
        //
      }
    }

    this.cache = INITIAL_MENUS;
    return INITIAL_MENUS;
  }

  async getById(id: string): Promise<Menu | null> {
    const list = await this.getAll();
    return list.find(m => m.id === id) || null;
  }

  async getByCategory(category: string): Promise<Menu[]> {
    const list = await this.getAll();
    if (category === 'all') return list;
    return list.filter(m => m.category === category);
  }

  async save(menu: Menu): Promise<Menu> {
    const list = await this.getAll();
    const index = list.findIndex(m => m.id === menu.id);
    let updated: Menu[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = menu;
    } else {
      updated = [menu, ...list];
    }
    this.cache = updated;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(updated));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menus').upsert(menu);
      } catch {
        //
      }
    }
    return menu;
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter(m => m.id !== id);
    this.cache = filtered;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(filtered));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menus').delete().eq('id', id);
      } catch {
        //
      }
    }
  }
}

export const menuRepository = new MenuRepository();
