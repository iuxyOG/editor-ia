# VideoAI Editor

**Edição de vídeo automatizada com Inteligência Artificial.**

Suba um vídeo MP4 e a aplicação faz tudo: transcrição, ilustrações contextuais, legendas estilizadas e renderização do vídeo final editado.

---

## Funcionalidades

- **Transcrição automática** com OpenAI Whisper (timestamps word-level)
- **Análise de conteúdo** com Claude AI (segmentos, momentos-chave, sugestões)
- **Ilustrações geradas por IA** (DALL-E 3, Stability AI ou placeholder)
- **5 estilos de legenda** animados: Hormozi, Clean, Karaoke, Typewriter, Pop
- **Preview em tempo real** com Canvas 2D (vídeo + overlays + legendas)
- **Timeline interativa** com drag & drop e resize de ilustrações
- **Undo/redo** com 50 níveis de histórico
- **Waveform** do áudio renderizada via Web Audio API
- **Multi-projeto** com banco de dados Prisma + SQLite
- **Auto-save** com debounce de 2 segundos
- **Export configurável**: resolução (720p/1080p/4K), formato (MP4/MOV/WebM), aspect ratio (16:9, 9:16, 1:1)
- **Tendências** do YouTube integradas (Data API v3)
- **Modo demo** completo sem necessidade de API keys
- **Docker ready** para deploy em qualquer servidor

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Estado | Zustand (5 stores independentes) + zundo (temporal) |
| Transcrição | OpenAI Whisper API |
| IA Criativa | Claude API (Anthropic) |
| Imagens | DALL-E 3 / Stability AI / Placeholder SVG |
| Renderização | Remotion (React-based video rendering) |
| Banco de Dados | Prisma + SQLite (via libSQL adapter) |
| Jobs | SQLite (better-sqlite3) + SSE para progresso real |
| Vídeo | FFmpeg (fluent-ffmpeg) |
| Testes | Vitest + Testing Library |
| Deploy | Docker + docker-compose |

---

## Pre-requisitos

- **Node.js** 20+
- **FFmpeg** instalado no sistema (ou usar Docker)
- **npm** 9+

---

## Instalacao

```bash
git clone https://github.com/iuxyOG/edito-ia.git
cd edito-ia
npm install
```

### Configurar variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves (todas opcionais para modo demo):

```env
# OpenAI - Whisper + DALL-E
OPENAI_API_KEY=sk-...

# Anthropic - Claude
ANTHROPIC_API_KEY=sk-ant-...

# Image Provider: dalle | stability | placeholder
IMAGE_PROVIDER=placeholder

# YouTube Data API (opcional)
YOUTUBE_API_KEY=

# Database
DATABASE_URL="file:./data/projects.db"
```

### Inicializar banco de dados

```bash
npx prisma db push
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Deploy com Docker

```bash
docker compose up -d
```

O app estara disponivel na porta `3000`.

### Health check

```
GET /api/health
```

Retorna status de todos os servicos (FFmpeg, OpenAI, Anthropic, etc).

---

## Estrutura do Projeto

```
src/
  app/                    # Next.js App Router
    api/                  # 17 API routes
    editor/[id]/          # Editor principal
    projects/             # Lista de projetos
    trends/               # Tendencias de video
  components/             # 18 componentes React
    editor/               # Pipeline, segmentos, export
    preview/              # Video player + Canvas preview
    timeline/             # Timeline + Waveform
    illustrations/        # Painel de ilustracoes
    subtitles/            # Painel de legendas
    prompt-editor/        # Editor de prompts
    trends/               # Painel de tendencias
    upload/               # Zona de upload
    ui/                   # Design system (Button, Card, Modal, etc)
  hooks/                  # 11 hooks (5 stores + 3 logic + 3 utility)
  lib/                    # 17 modulos (API client, logger, schemas, etc)
  types/                  # TypeScript types + API response types
  remotion/               # Composicoes Remotion para renderizacao
```

---

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run start` | Servidor de producao |
| `npm run test` | Testes em modo watch |
| `npm run test:run` | Testes (single run) |

---

## Arquitetura

### Stores (Zustand)

O estado da aplicacao e dividido em 5 stores independentes para evitar re-renders desnecessarios:

| Store | Responsabilidade | Persistencia | Undo/Redo |
|-------|-----------------|--------------|-----------|
| `useVideoStore` | Dados do video | localStorage | Nao |
| `useEditorStore` | Transcricao, segmentos, ilustracoes, legendas, prompts | localStorage | Sim (50 niveis) |
| `usePipelineStore` | Estado do pipeline de processamento | Nao | Nao |
| `useUIStore` | currentTime, isPlaying, activeTab | Nao | Nao |
| `useExportStore` | Configuracoes de exportacao | localStorage | Nao |

### API Client

Todos os componentes acessam o backend via `src/lib/api.ts`:
- Retry automatico com backoff exponencial (3 tentativas)
- Tipagem completa para requests e responses
- Error handling centralizado (ApiError)

### Seguranca

- Validacao Zod em todas as API routes
- Rate limiting por IP (middleware)
- Validacao de MIME type via magic bytes
- Security headers (HSTS, X-Frame-Options, CSP, etc)
- Streaming upload (nao carrega arquivo na RAM)
- Cleanup automatico de arquivos temporarios

### Logging

Logging estruturado em JSON em todas as API routes e libs do servidor. Compativel com Datadog, CloudWatch, etc.

---

## Testes

```bash
npm run test:run
```

**66 testes** cobrindo:
- Schemas de validacao Zod
- Formatadores (tempo, tamanho, duracao)
- Dados mock (transcricao, analise)
- Todos os 5 stores (estado inicial, setters, reset, undo)

---

## Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| `Espaco` | Play / Pause |
| `←` `→` | Voltar / Avancar 5s |
| `J` `K` `L` | Voltar 10s / Play-Pause / Avancar 10s |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Shift+Z` | Refazer |
| `Ctrl+E` | Abrir exportacao |
| `Home` / `End` | Inicio / Fim do video |

---

## Licenca

MIT
