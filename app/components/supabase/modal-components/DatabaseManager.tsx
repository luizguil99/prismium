import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { ErrorMessage } from './ErrorMessage';

interface DatabaseManagerProps {
  projectId: string;  // Na verdade, isso já está recebendo a referência do projeto, não o ID
  onBack: () => void;
}

interface Table {
  id: string;
  name: string;
  schema: string;
  comment?: string;
}

interface Column {
  name: string;
  type: string;
  is_nullable: boolean;
  is_primary: boolean;
  is_unique: boolean;
  default_value: string | null;
}

export function DatabaseManager({ projectId, onBack }: DatabaseManagerProps) {
  // Por clareza, renomeamos a variável internamente
  const projectRef = projectId; // Este valor já deve ser a referência do projeto, não o ID
  
  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, [projectRef]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableColumns(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('supabase_access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }
      
      console.log('🔍 Buscando tabelas para o projeto ref:', projectRef);
      
      // Buscar as tabelas do banco de dados via proxy do servidor
      // Atualizando para a convenção correta de rotas do Remix
      const response = await fetch(`/api/supabase-database-tables?projectRef=${projectRef}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar tabelas: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Adicionar verificação de tipo para os dados retornados
      if (Array.isArray(data)) {
        setTables(data as Table[]);
        
        // Selecionar a primeira tabela por padrão se houver tabelas
        if (data.length > 0) {
          setSelectedTable(data[0].name as string);
        }
      } else {
        throw new Error('Formato de dados inesperado');
      }
      
    } catch (err) {
      console.error('❌ Erro ao carregar tabelas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTableColumns = async (tableName: string) => {
    try {
      const token = localStorage.getItem('supabase_access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }
      
      console.log('🔍 Buscando colunas para a tabela:', tableName);
      
      // Atualizando para a convenção correta de rotas do Remix
      const response = await fetch(`/api/supabase-table-columns?projectRef=${projectRef}&tableName=${tableName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resposta de erro:', errorText);
        throw new Error(`Erro ao buscar colunas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Dados de colunas recebidos:', data);
      
      // Adicionar verificação de tipo para os dados retornados
      if (Array.isArray(data)) {
        // Garantir que cada coluna tenha todas as propriedades necessárias
        const processedColumns = data.map(col => ({
          name: col.name || 'Sem nome',
          type: col.type || 'text',
          is_nullable: col.is_nullable === true || col.is_nullable === 'YES',
          is_primary: col.is_primary === true,
          is_unique: col.is_unique === true,
          default_value: col.default_value || null
        }));
        
        console.log('✅ Colunas processadas:', processedColumns);
        setColumns(processedColumns);
      } else if (data && typeof data === 'object' && 'error' in data) {
        // Verificamos primeiro se data é um objeto e se tem a propriedade 'error'
        const errorData = data as { error: string, message?: string };
        console.error('❌ Erro retornado pela API:', errorData.error, errorData.message);
        toast.error(`Erro ao buscar colunas: ${errorData.message || 'Erro desconhecido'}`);
        setColumns([]);
      } else {
        console.error('❌ Formato inesperado de dados de colunas:', data);
        setColumns([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar colunas:', err);
      toast.error('Falha ao carregar detalhes da tabela');
      setColumns([]);
    }
  };

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <motion.div
          className="i-ph-spinner-bold w-8 h-8 text-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-2 text-bolt-elements-textSecondary">Carregando banco de dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message="Erro ao carregar banco de dados" details={error} />
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com botão de voltar */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="p-1 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-1 transition-colors"
        >
          <span className="i-ph-arrow-left-bold w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Database Manager</h3>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-8">
          <div className="i-ph-database-bold w-12 h-12 mx-auto text-bolt-elements-textTertiary" />
          <p className="mt-2 text-bolt-elements-textSecondary">Nenhuma tabela encontrada neste banco de dados.</p>
          <p className="mt-1 text-sm text-bolt-elements-textTertiary">
            Crie tabelas via SQL ou utilizando a interface do Supabase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lista de tabelas */}
          <div className="border border-bolt-elements-borderColor rounded-md overflow-hidden">
            <div className="bg-bolt-elements-background-depth-1 p-2 border-b border-bolt-elements-borderColor">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Tabelas</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={classNames(
                    "px-3 py-2 rounded-md cursor-pointer text-sm my-1",
                    selectedTable === table.name 
                      ? "bg-emerald-600 text-white" 
                      : "hover:bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary"
                  )}
                  onClick={() => handleTableClick(table.name)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="i-ph-table-bold w-4 h-4" />
                    <span className="truncate">{table.name}</span>
                  </div>
                  {table.schema && table.schema !== 'public' && (
                    <p className="text-xs text-bolt-elements-textTertiary mt-1 pl-6">
                      {table.schema}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detalhes da tabela selecionada */}
          <div className="md:col-span-2 border border-bolt-elements-borderColor rounded-md overflow-hidden">
            <div className="bg-bolt-elements-background-depth-1 p-2 border-b border-bolt-elements-borderColor">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">
                {selectedTable ? `Estrutura: ${selectedTable}` : 'Selecione uma tabela'}
              </h4>
            </div>
            
            {selectedTable ? (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-bolt-elements-textSecondary">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-bolt-elements-textSecondary">Tipo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-bolt-elements-textSecondary">Nullable</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-bolt-elements-textSecondary">Default</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-bolt-elements-textSecondary">Primary</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-bolt-elements-textSecondary">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.length > 0 ? (
                      columns.map((column, index) => (
                        <tr 
                          key={column.name} 
                          className={classNames(
                            index % 2 === 0 ? 'bg-bolt-elements-background-depth-0' : 'bg-bolt-elements-background-depth-1',
                            'border-b border-bolt-elements-borderColor'
                          )}
                        >
                          <td className="px-4 py-2 text-sm text-bolt-elements-textPrimary font-medium">{column.name || 'Sem nome'}</td>
                          <td className="px-4 py-2 text-sm text-bolt-elements-textSecondary">{column.type || 'unknown'}</td>
                          <td className="px-4 py-2 text-sm text-bolt-elements-textSecondary">
                            {column.is_nullable ? 'Sim' : 'Não'}
                          </td>
                          <td className="px-4 py-2 text-sm text-bolt-elements-textSecondary">
                            {column.default_value || '-'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {column.is_primary && <span className="i-ph-check-circle-bold w-4 h-4 text-emerald-500" />}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {column.is_unique && <span className="i-ph-check-circle-bold w-4 h-4 text-emerald-500" />}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-bolt-elements-textTertiary">
                          <div className="py-6 flex flex-col items-center">
                            <span className="i-ph-warning-circle-bold w-10 h-10 text-amber-500 mb-2"></span>
                            <p className="text-bolt-elements-textSecondary">Não foi possível obter a estrutura da tabela.</p>
                            <p className="text-sm text-bolt-elements-textTertiary mt-1">
                              Verifique se a tabela '{selectedTable}' existe e se você tem permissões para acessá-la.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-bolt-elements-textTertiary">
                Selecione uma tabela para ver sua estrutura
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 