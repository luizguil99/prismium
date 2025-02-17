import { ComponentsManager } from "~/admin-components/ComponentsManager";

export default function AdminComponentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gerenciamento de Componentes</h1>
        <p className="text-zinc-400 mt-2">Adicione, edite e remova componentes do sistema</p>
      </div>

      <ComponentsManager />
    </div>
  );
} 