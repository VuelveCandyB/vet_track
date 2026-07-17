export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'authorized_vet': 'Veterinario Autorizado',
    'official_vet': 'Veterinario Oficial',
    'director': 'Director',
    'euthanasia': 'Personal de Eutanasia',
    'admin': 'Administrador',
  }
  return labels[role] || role
}
