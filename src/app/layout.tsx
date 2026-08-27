import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meetlingua AI - Captura, Transcripción y Análisis Multilingüe de Reuniones',
  description: 'Aplicación lista para producción que transcribe reuniones en alemán con OpenAI Whisper y genera informes estructurados traducidos al español con GPT-4o.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#090d16] text-gray-100 antialiased min-h-screen selection:bg-brand-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
