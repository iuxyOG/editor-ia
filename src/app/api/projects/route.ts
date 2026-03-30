import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProjectSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST — Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        videoUrl: parsed.data.videoUrl,
        videoName: parsed.data.videoName,
        videoDuration: parsed.data.videoDuration,
        videoWidth: parsed.data.videoWidth,
        videoHeight: parsed.data.videoHeight,
        thumbnailUrl: parsed.data.thumbnailUrl || null,
        status: 'uploading',
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error('Create project error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao criar projeto' }, { status: 500 });
  }
}

// GET — List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'desc';

    const where = status && status !== 'all' ? { status } : {};

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
      select: {
        id: true,
        name: true,
        videoUrl: true,
        videoName: true,
        videoDuration: true,
        videoWidth: true,
        videoHeight: true,
        thumbnailUrl: true,
        status: true,
        outputUrl: true,
        illustrationStyle: true,
        createdAt: true,
        updatedAt: true,
        // Exclude heavy fields for list view
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    logger.error('List projects error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao listar projetos' }, { status: 500 });
  }
}
