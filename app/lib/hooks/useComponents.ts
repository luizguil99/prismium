import { useEffect, useState } from 'react';
import { getOrCreateClient } from '~/components/supabase';
import type { Database } from '~/types/supabase';

export type Component = {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  is_new?: boolean;
  prompt: string;
  category: string;
  subcategory: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  name: string;
  icon: string;
  subcategories: Record<string, {
    name: string;
    icon?: string;
    components: Component[];
  }>;
};

export function useComponents() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, Category>>({});

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getOrCreateClient();
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComponents(data || []);

      // Organizar componentes em categorias
      const categorizedComponents = (data || []).reduce((acc, component) => {
        const { category, subcategory } = component;
        
        // Se a categoria não existe, cria ela
        if (!acc[category]) {
          acc[category] = {
            name: category,
            icon: 'i-ph:stack-duotone', // Ícone padrão
            subcategories: {},
          };
        }

        // Se a subcategoria não existe, cria ela
        if (!acc[category].subcategories[subcategory]) {
          acc[category].subcategories[subcategory] = {
            name: subcategory,
            components: [],
          };
        }

        // Adiciona o componente à subcategoria
        acc[category].subcategories[subcategory].components.push(component);

        return acc;
      }, {} as Record<string, Category>);

      setCategories(categorizedComponents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar componentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();

    // Inscrever para atualizações em tempo real
    const supabase = getOrCreateClient();
    const channel = supabase
      .channel('components_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'components',
        },
        () => {
          fetchComponents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    components,
    categories,
    loading,
    error,
    refresh: fetchComponents,
  };
} 