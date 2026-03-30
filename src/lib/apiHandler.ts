import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

/**
 * Wraps an API route handler with consistent error handling.
 * Catches Zod validation errors, known API errors, and unexpected errors.
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Zod validation error
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // Known API error
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      // Unexpected error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Unhandled API error', {
        path: request.url,
        method: request.method,
        error: errorMessage,
        stack: errorStack,
      });

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Typed API error for controlled error responses.
 */
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
