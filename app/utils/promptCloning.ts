export const getPromptCloning = (
  isTypeScript: boolean,
  workdir: string,
  files: Array<{ path: string; content: string }>,
  dependencies: Record<string, string>,
) => {
  return `Você está ajudando a criar um componente em um projeto que já foi clonado e configurado.

Ambiente de Desenvolvimento:
- Template: ${isTypeScript ? 'TypeScript' : 'JavaScript'} + Shadcn UI
- Localização: ${workdir}
- Framework: Vite + React
- Estilização: Tailwind CSS + Shadcn UI

Estrutura de Arquivos:
${files.map((file) => `- ${file.path}`).join('\n')}

Dependências Instaladas:
${Object.entries(dependencies)
  .map(([dep, version]) => `- ${dep}: ${version}`)
  .join('\n')}

Instruções Importantes:
1. NÃO crie novos arquivos - use a estrutura existente
2. NÃO instale novas dependências - use as que já estão instaladas
3. Documente o código em português
4. Siga as melhores práticas do React e Tailwind
5. Implemente animações suaves quando apropriado
6. Mantenha o código limpo e organizado
7. Teste as mudanças usando 'npm run dev'

Após cada modificação:
1. O servidor de desenvolvimento será iniciado automaticamente
2. Você poderá ver as mudanças em tempo real
3. Forneça feedback sobre o status do desenvolvimento

Por favor, ajude a implementar o componente seguindo essas diretrizes.`;
};
