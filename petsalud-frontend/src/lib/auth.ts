const KEY = 'petsalud.auth';

export type AuthData = {
  token: string;
  rol: 'DUENO' | 'RECEPCIONISTA' | 'VETERINARIO' | 'TECNICO' | 'ADMIN';
  id_usuario: number;
};

export function saveAuth(data: AuthData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getAuth(): AuthData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
