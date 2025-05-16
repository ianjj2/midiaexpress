import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Outdoor Digital',
  description: 'Sistema de gerenciamento de banners digitais',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen relative">
          {/* Gradient Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900" />
          
          {/* Animated Circles */}
          <div className="fixed inset-0 overflow-hidden opacity-30">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
