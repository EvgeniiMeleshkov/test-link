// Базовый HTTP-клиент. Единая точка обработки ошибок и базового URL.

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = body?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  } catch {
    // тело не JSON — используем статус ниже
  }
  return `Ошибка запроса (${response.status})`;
}
