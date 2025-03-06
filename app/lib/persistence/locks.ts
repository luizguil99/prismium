// Sistema de lock para evitar operações concorrentes em snapshots
const activeLocks = new Set<string>();

/**
 * Adquire um lock para uma operação específica
 * @param lockId ID único do lock
 * @returns true se o lock foi adquirido, false se já estiver em uso
 */
export function acquireLock(lockId: string): boolean {
  if (activeLocks.has(lockId)) {
    return false;
  }
  activeLocks.add(lockId);
  return true;
}

/**
 * Libera um lock após a conclusão da operação
 * @param lockId ID do lock a ser liberado
 */
export function releaseLock(lockId: string): void {
  activeLocks.delete(lockId);
} 