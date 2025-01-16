// Serviço para extrair e processar URLs do Figma
import * as Figma from 'figma-js';

export class FigmaUrlExtractor {
  private static readonly FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

  /**
   * Extrai informações de um projeto Figma usando sua URL
   * @param url - URL do projeto Figma
   * @returns Promise com a descrição textual do projeto
   */
  static async extractFromUrl(url: string): Promise<string> {
    try {
      const fileId = this.extractFileId(url);
      if (!fileId) {
        throw new Error('ID do projeto Figma não encontrado na URL');
      }

      // Se tivermos um token de acesso, podemos usar a API do Figma
      if (this.FIGMA_ACCESS_TOKEN) {
        const client = Figma.Client({
          personalAccessToken: this.FIGMA_ACCESS_TOKEN
        });

        const file = await client.file(fileId);
        return this.processFileData(file.data);
      } else {
        // Caso não tenhamos acesso à API, retornamos informações básicas
        return `Projeto Figma ID: ${fileId}\nURL: ${url}\n\nNota: Para obter mais detalhes, configure um token de acesso da API do Figma.`;
      }
    } catch (error) {
      console.error('Erro ao extrair informações do Figma:', error);
      throw new Error('Falha ao processar URL do Figma');
    }
  }

  /**
   * Extrai o ID do arquivo da URL do Figma
   * @param url - URL do projeto Figma
   * @returns ID do arquivo ou null se não encontrado
   */
  private static extractFileId(url: string): string | null {
    const matches = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/);
    return matches ? matches[2] : null;
  }

  /**
   * Processa os dados do arquivo Figma
   * @param data - Dados do arquivo Figma
   * @returns String com descrição estruturada do design
   */
  private static processFileData(data: any): string {
    let description = 'Descrição do Projeto Figma:\n\n';

    // Informações básicas do documento
    description += `Nome do Projeto: ${data.name || 'Não especificado'}\n`;
    description += `Última Modificação: ${new Date(data.lastModified).toLocaleString()}\n`;
    description += `Versão: ${data.version || 'Não especificada'}\n\n`;

    // Estrutura do documento
    if (data.document) {
      description += 'Estrutura do Documento:\n';
      description += this.processNode(data.document, 0);
    }

    return description;
  }

  /**
   * Processa um nó do Figma recursivamente
   * @param node - Nó do Figma
   * @param depth - Profundidade na árvore
   * @returns String com descrição do nó
   */
  private static processNode(node: any, depth: number): string {
    const indent = '  '.repeat(depth);
    let description = '';

    description += `${indent}${node.type}: ${node.name}\n`;

    if (node.children) {
      node.children.forEach((child: any) => {
        description += this.processNode(child, depth + 1);
      });
    }

    return description;
  }
}
