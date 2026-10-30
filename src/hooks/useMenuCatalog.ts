import { useState, useEffect, useMemo } from 'react';
import { Menu } from '../types';
import { fetchMenus } from '../lib/supabase';

export function useMenuCatalog(initialCategory: string = 'all') {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    fetchMenus().then((data) => {
      if (mounted) {
        setMenus(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const filteredMenus = useMemo(() => {
    let result = menus;
    if (activeCategory !== 'all') {
      result = result.filter(m => m.category === activeCategory);
    }
    if (searchKeyword.trim()) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(lower) || 
        m.description.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [menus, activeCategory, searchKeyword]);

  return {
    menus,
    filteredMenus,
    loading,
    activeCategory,
    setActiveCategory,
    searchKeyword,
    setSearchKeyword,
    refreshMenus: async () => {
      setLoading(true);
      const data = await fetchMenus();
      setMenus(data);
      setLoading(false);
    }
  };
}
