import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export function PageHeader({
  title,
  description,
  action,
  meta,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {meta}
        </div>
        {description && <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-zinc-200/80 rounded-xl ${padding ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}) {
  const tones = {
    neutral: 'bg-zinc-100 text-zinc-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    info: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    purple: 'bg-violet-50 text-violet-700 border border-violet-100',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${props.className || ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${props.className || ''}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${props.className || ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium text-zinc-500 block mb-1.5">{children}</label>;
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <code className="block bg-zinc-950 text-zinc-100 p-4 rounded-lg text-xs break-all font-mono leading-relaxed">
      {children}
    </code>
  );
}

export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'error' | 'success';
}) {
  const tones = {
    info: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    warning: 'bg-amber-50 border-amber-100 text-amber-900',
    error: 'bg-red-50 border-red-100 text-red-900',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  };
  return (
    <div className={`border rounded-lg p-4 text-sm ${tones[tone]}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-2xl font-semibold text-zinc-900 mt-2 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </Card>
  );
}

export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-500 py-12">
      <span className="w-4 h-4 border-2 border-zinc-200 border-t-indigo-600 rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
    </div>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-zinc-100 bg-zinc-50/80">{children}</tr>
    </thead>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <td className={`px-4 py-3 text-sm text-zinc-700 ${className}`} onClick={onClick}>
      {children}
    </td>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5 p-3 bg-white border border-zinc-200/80 rounded-xl">
      {children}
    </div>
  );
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple'> = {
    verified: 'success',
    active: 'success',
    sent: 'success',
    pending_dns: 'warning',
    pending: 'warning',
    failed: 'danger',
    stopped: 'neutral',
    skipped: 'neutral',
    redirect: 'info',
    direct: 'purple',
  };
  return map[status] || 'neutral';
}
