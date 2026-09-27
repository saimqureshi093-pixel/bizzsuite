import { Layers } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 18, text: 'text-lg' },
    md: { box: 'w-10 h-10', icon: 22, text: 'text-xl' },
    lg: { box: 'w-12 h-12', icon: 26, text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${s.box} rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 flex items-center justify-center shadow-sm`}
      >
        <Layers
          className={`w-[${s.icon}px] h-[${s.icon}px] text-white dark:text-neutral-900`}
          style={{ width: s.icon, height: s.icon }}
        />
      </div>
      <span className={`${s.text} font-bold tracking-tight text-neutral-900 dark:text-white`}>
        Bizz<span className="text-emerald-600 dark:text-emerald-400">Suite</span>
      </span>
    </div>
  );
}
