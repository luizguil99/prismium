// Serviço para converter arquivos .fig em formato que LLMs possam entender
import * as Figma from 'figma-js';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
  [key: string]: any;
}

export class FigmaConverter {
  /**
   * Converte o conteúdo de um arquivo .fig em uma descrição textual
   * @param fileBuffer - Buffer do arquivo .fig
   * @returns Promise com a descrição textual do arquivo
   */
  static async convertToText(fileBuffer: ArrayBuffer): Promise<string> {
    try {
      // Converte o buffer em um objeto JSON
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(fileBuffer);
      const figmaData = JSON.parse(jsonString);

      // Extrai informações relevantes
      const description = this.extractInformation(figmaData);
      return description;
    } catch (error) {
      console.error('Erro ao converter arquivo Figma:', error);
      throw new Error('Falha ao processar arquivo Figma');
    }
  }

  /**
   * Extrai informações relevantes do arquivo Figma
   * @param data - Dados do arquivo Figma
   * @returns String com descrição estruturada do design
   */
  private static extractInformation(data: any): string {
    let description = 'Descrição do Design Figma:\n\n';

    // Informações do documento
    description += `Nome do Documento: ${data.name || 'Não especificado'}\n`;
    description += `Última Modificação: ${data.lastModified || 'Não especificado'}\n\n`;

    // Extrai componentes e estrutura
    if (data.document) {
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
  private static processNode(node: FigmaNode, depth: number): string {
    const indent = '  '.repeat(depth);
    let description = '';

    // Adiciona informações básicas do nó
    description += `${indent}${node.type}: ${node.name}\n`;

    // Processa propriedades específicas
    if (node.characters) {
      description += `${indent}  Texto: "${node.characters}"\n`;
    }

    // Processa estilos e cores
    if (node.fills) {
      const colors = node.fills
        .filter((fill: any) => fill.type === 'SOLID')
        .map((fill: any) => {
          const color = fill.color;
          return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
        });
      if (colors.length > 0) {
        description += `${indent}  Cores: ${colors.join(', ')}\n`;
      }
    }

    // Processa filhos recursivamente
    if (node.children) {
      node.children.forEach((child: FigmaNode) => {
        description += this.processNode(child, depth + 1);
      });
    }

    return description;
  }
}
