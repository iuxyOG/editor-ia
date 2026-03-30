import { NextRequest } from 'next/server';
import { getJob, subscribeToJob } from '@/lib/jobQueue';
import type { JobEvent } from '@/lib/jobQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SSE endpoint — retorna stream de eventos do pipeline
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = getJob(jobId);

  if (!job) {
    return new Response(JSON.stringify({ error: 'Job não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Enviar estado atual como primeiro evento
      const currentEvent: JobEvent = {
        step: job.currentStep,
        progress: job.progress,
        message: job.message,
        error: job.error,
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(currentEvent)}\n\n`));

      // Se o job já completou ou falhou, fechar stream
      if (job.status === 'completed' || job.status === 'failed') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...currentEvent, done: true, results: job.results })}\n\n`));
        controller.close();
        return;
      }

      // Subscrever a atualizações em tempo real
      const unsubscribe = subscribeToJob(jobId, (event) => {
        try {
          const payload: Record<string, unknown> = { ...event };

          // Se completou ou falhou, incluir resultados e fechar
          const updatedJob = getJob(jobId);
          if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed')) {
            payload.done = true;
            payload.results = updatedJob.results;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

          if (payload.done) {
            controller.close();
            unsubscribe();
          }
        } catch {
          // Stream may have been closed by client
          unsubscribe();
        }
      });

      // Limpar quando o client desconecta
      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
