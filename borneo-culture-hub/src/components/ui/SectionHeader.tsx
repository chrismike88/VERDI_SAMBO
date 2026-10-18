import { motion } from 'motion/react';

export function SectionHeader({ eyebrow, title, subtitle, align = 'left', id }: { eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode; align?: 'left' | 'center'; id?: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-10 md:mb-14 ${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}
    >
      <p className="eyebrow mb-3 flex items-center gap-3" style={{ justifyContent: align === 'center' ? 'center' : undefined }}>
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--gold)]" aria-hidden />
        {eyebrow}
      </p>
      <h2 id={id} className="h2">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-[17px] text-[var(--text-muted)]">{subtitle}</p>}
    </motion.header>
  );
}
