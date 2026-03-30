import type {
  UploadResponse,
  PipelineStartResponse,
  SSEEvent,
  ProjectListItem,
  ProjectFull,
  RenderStartResponse,
  GenerateImageResponse,
  TrendsResponse,
  StatusResponse,
  HealthResponse,
} from '@/types/api';
import type { CreateProjectInput, UpdateProjectInput, RenderInput } from '@/lib/schemas';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  retries?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, retries = 3, ...init } = options;

  const fetchOptions: RequestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(path, fetchOptions);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: 'Erro desconhecido' }));

        // Don't retry 4xx errors — they're client errors
        if (res.status >= 400 && res.status < 500) {
          throw new ApiError(res.status, errorBody.error, errorBody.details);
        }

        // 5xx — will retry
        throw new ApiError(res.status, errorBody.error);
      }

      return res.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry client errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Request failed');
}

// === Projects ===

export async function createProject(data: CreateProjectInput): Promise<ProjectFull> {
  return request('/api/projects', { method: 'POST', body: data });
}

export async function listProjects(params?: {
  status?: string;
  sort?: string;
}): Promise<ProjectListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.sort) searchParams.set('sort', params.sort);
  return request(`/api/projects?${searchParams}`, { retries: 1 });
}

export async function getProject(id: string): Promise<ProjectFull> {
  return request(`/api/projects/${id}`, { retries: 1 });
}

export async function updateProject(id: string, data: Partial<UpdateProjectInput>): Promise<ProjectFull> {
  return request(`/api/projects/${id}`, { method: 'PATCH', body: data, retries: 1 });
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  return request(`/api/projects/${id}`, { method: 'DELETE', retries: 1 });
}

// === Pipeline ===

export async function startPipeline(data: {
  videoId: string;
  videoUrl: string;
  customPrompt?: string;
}): Promise<PipelineStartResponse> {
  return request('/api/pipeline/start', { method: 'POST', body: data, retries: 1 });
}

export function subscribePipeline(
  jobId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Event) => void
): () => void {
  const eventSource = new EventSource(`/api/pipeline/${jobId}`);

  eventSource.onmessage = (e) => {
    try {
      const event: SSEEvent = JSON.parse(e.data);
      onEvent(event);
      if (event.done || event.error) {
        eventSource.close();
      }
    } catch {
      // ignore parse errors
    }
  };

  eventSource.onerror = (e) => {
    eventSource.close();
    onError?.(e);
  };

  return () => eventSource.close();
}

// === Render ===

export async function startRender(data: RenderInput): Promise<RenderStartResponse> {
  return request('/api/render', { method: 'POST', body: data, retries: 1 });
}

// === Images ===

export async function regenerateImage(data: {
  prompt: string;
  style: string;
}): Promise<GenerateImageResponse> {
  return request('/api/generate-image', { method: 'POST', body: data, retries: 1 });
}

// === Trends ===

export async function searchTrends(query?: string, platform?: string): Promise<TrendsResponse> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (platform) params.set('platform', platform);
  return request(`/api/trends?${params}`, { retries: 1 });
}

// === Status ===

export async function getStatus(): Promise<StatusResponse> {
  return request('/api/status', { retries: 1 });
}

export async function getHealth(): Promise<HealthResponse> {
  return request('/api/health', { retries: 1 });
}

// === Upload ===

export interface UploadProgressStats {
  speed: number;
  eta: number;
  loaded: number;
  total: number;
}

export function uploadVideo(
  file: File,
  onProgress?: (pct: number, stats: UploadProgressStats) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    let lastTime = Date.now();

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable || !onProgress) return;

      const now = Date.now();
      const pct = Math.round((e.loaded / e.total) * 100);
      const timeDelta = (now - lastTime) / 1000;

      if (timeDelta > 0.3) {
        const speed = (e.loaded - lastLoaded) / timeDelta;
        const eta = speed > 0 ? (e.total - e.loaded) / speed : 0;
        onProgress(pct, { speed, eta, loaded: e.loaded, total: e.total });
        lastLoaded = e.loaded;
        lastTime = now;
      } else {
        onProgress(pct, { speed: 0, eta: 0, loaded: e.loaded, total: e.total });
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new ApiError(xhr.status, err.error || 'Falha no upload'));
        } catch {
          reject(new ApiError(xhr.status, 'Falha no upload'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede'));
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}
