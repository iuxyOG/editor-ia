'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { UploadZone } from '@/components/upload/UploadZone';
import { Sparkles, Wand2, Type, Download, ArrowRight, Zap, Clock } from 'lucide-react';

const features = [
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: 'Transcrição Automática',
    description: 'Whisper AI transcreve seu vídeo com precisão word-level em segundos',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Ilustrações com IA',
    description: 'Claude analisa e gera ilustrações contextuais para cada segmento',
  },
  {
    icon: <Type className="w-6 h-6" />,
    title: 'Legendas Estilizadas',
    description: '5 presets: Hormozi, Clean, Karaoke, Typewriter e Pop animation',
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'Export Profissional',
    description: 'Renderize em 4K para YouTube, TikTok, Reels ou Feed',
  },
];

const stats = [
  { value: '10min', label: 'de vídeo', suffix: '' },
  { value: '30', label: 'segundos de setup', suffix: 's' },
  { value: '0', label: 'edição manual', suffix: '' },
  { value: '5', label: 'estilos de legenda', suffix: '+' },
];

// Hook para animação de contador
function useCountUp(end: number, duration: number = 1500, start: number = 0) {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Delay para a animação começar após o fade-in
    const timer = setTimeout(() => setHasStarted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [hasStarted, end, duration, start]);

  return value;
}

// Typewriter effect
function TypewriterText({ texts, speed = 80 }: { texts: string[]; speed?: number }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentTextIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentText) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    } else {
      timer = setTimeout(
        () => {
          setDisplayText(
            isDeleting
              ? currentText.slice(0, displayText.length - 1)
              : currentText.slice(0, displayText.length + 1)
          );
        },
        isDeleting ? speed / 2 : speed
      );
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentTextIndex, texts, speed]);

  return (
    <span className="text-gradient">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-32 pb-20 px-6">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-light text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Whisper + Claude AI
          </div>

          <h1 className="font-heading text-5xl md:text-6xl font-extrabold leading-tight mb-4">
            Do script ao vídeo editado,{' '}
            <br className="hidden md:block" />
            <TypewriterText
              texts={[
                'sem abrir editor',
                'em 30 segundos',
                'com IA generativa',
                'totalmente automático',
              ]}
            />
          </h1>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Suba seu vídeo e deixe a IA fazer a mágica: transcrição automática,
            ilustrações contextuais, legendas estilizadas e renderização profissional.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-heading text-2xl font-bold text-brand-light">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-xs text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <UploadZone />
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto mt-24 mb-16">
          <h2 className="font-heading text-2xl font-bold text-text-primary text-center mb-8">
            Como funciona
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-4">
            {[
              { step: '1', icon: <Zap className="w-5 h-5" />, title: 'Upload', desc: 'Arraste seu MP4 (até 10min)' },
              { step: '2', icon: <Wand2 className="w-5 h-5" />, title: 'IA Processa', desc: 'Whisper transcreve, Claude analisa' },
              { step: '3', icon: <Sparkles className="w-5 h-5" />, title: 'Edição Automática', desc: 'Ilustrações + legendas geradas' },
              { step: '4', icon: <Download className="w-5 h-5" />, title: 'Download', desc: 'Vídeo final em 4K' },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex items-start gap-3 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  {i < 3 && <div className="hidden md:block w-px h-full bg-border mt-2" />}
                </div>
                <div className="pb-6">
                  <p className="text-xs text-brand-light font-medium mb-0.5">Passo {item.step}</p>
                  <h3 className="font-heading font-semibold text-text-primary text-sm">{item.title}</h3>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                </div>
                {i < 3 && (
                  <ArrowRight className="hidden md:block w-4 h-4 text-border mt-3 mx-auto shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass-card p-5 text-center group hover:border-brand-blue/30 transition-all duration-300 hover:scale-[1.02] animate-slide-up"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="inline-flex p-3 rounded-card bg-brand-blue/10 text-brand-blue mb-3 group-hover:bg-brand-blue/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-heading font-semibold text-text-primary text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-text-secondary">
          VideoAI Editor &middot; Feito com Next.js, Whisper, Claude &amp; Remotion
        </p>
      </footer>
    </div>
  );
}
