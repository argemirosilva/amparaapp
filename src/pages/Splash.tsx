import { useEffect } from 'react';
import { motion } from 'framer-motion';
import amparaLogo from '@/assets/ampara-logo.png';
import { Loader2 } from 'lucide-react';

interface SplashPageProps {
  onComplete: () => void;
}

export function SplashPage({ onComplete }: SplashPageProps) {
  useEffect(() => {
    // Auto-advance after 4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center px-8"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center gap-12"
      >
        {/* Logo Ampara - grande (mais visível na splash) */}
        <img
          src={amparaLogo}
          alt="Ampara"
          className="w-48 h-48 object-contain mix-blend-normal opacity-95"
        />
        
        {/* Frase */}
        <p className="text-xl text-center text-foreground/80 font-light max-w-md">
          Você não precisa mais estar sozinha.
        </p>

        {/* Spinner de loading */}
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </motion.div>
    </div>
  );
}
