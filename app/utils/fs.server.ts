import { promises as fs } from 'fs';
import { join } from 'path';

// Função para ler arquivo
export async function readFile(path: string): Promise<Buffer> {
  try {
    return await fs.readFile(join(process.cwd(), path));
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    throw error;
  }
}

// Função para verificar se arquivo existe
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(join(process.cwd(), path));
    return true;
  } catch {
    return false;
  }
}

// Função para escrever arquivo
export async function writeFile(path: string, data: string | Buffer): Promise<void> {
  try {
    await fs.writeFile(join(process.cwd(), path), data);
  } catch (error) {
    console.error(`Error writing file ${path}:`, error);
    throw error;
  }
}

// Função para criar diretório
export async function createDirectory(path: string): Promise<void> {
  try {
    await fs.mkdir(join(process.cwd(), path), { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${path}:`, error);
    throw error;
  }
} 