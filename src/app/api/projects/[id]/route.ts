import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { updateProjectSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET — Fetch a project by ID (full data)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Parse JSON fields
    return NextResponse.json({
      ...project,
      transcription: project.transcription ? JSON.parse(project.transcription) : null,
      analysis: project.analysis ? JSON.parse(project.analysis) : null,
      segments: project.segments ? JSON.parse(project.segments) : [],
      illustrations: project.illustrations ? JSON.parse(project.illustrations) : [],
      subtitleStyle: project.subtitleStyle ? JSON.parse(project.subtitleStyle) : null,
      promptHistory: project.promptHistory ? JSON.parse(project.promptHistory) : [],
    });
  } catch (error) {
    logger.error('Get project error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao buscar projeto' }, { status: 500 });
  }
}

// PATCH — Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Stringify JSON fields before storing
    const data: Record<string, unknown> = {};
    const jsonFields = ['transcription', 'analysis', 'segments', 'illustrations', 'subtitleStyle', 'promptHistory'];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (jsonFields.includes(key) && value !== null && value !== undefined) {
        data[key] = JSON.stringify(value);
      } else {
        data[key] = value;
      }
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    logger.error('Update project error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao atualizar projeto' }, { status: 500 });
  }
}

// DELETE — Delete a project and its files
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Delete associated files from disk
    const filesToDelete = [
      project.videoUrl,
      project.thumbnailUrl,
      project.outputUrl,
    ].filter(Boolean) as string[];

    for (const fileUrl of filesToDelete) {
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {});
      }
    }

    // Delete illustration files
    if (project.illustrations) {
      try {
        const illustrations = JSON.parse(project.illustrations) as Array<{ imageUrl?: string }>;
        for (const ill of illustrations) {
          if (ill.imageUrl?.startsWith('/uploads/')) {
            const illPath = path.join(process.cwd(), 'public', ill.imageUrl);
            if (existsSync(illPath)) {
              await unlink(illPath).catch(() => {});
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // Delete database record
    await prisma.project.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete project error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao deletar projeto' }, { status: 500 });
  }
}
