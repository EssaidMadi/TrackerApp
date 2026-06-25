'use client';

import { Button } from '@/components/ui';

export function ExcludeBotsToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Button
      size="sm"
      variant={value ? 'primary' : 'secondary'}
      onClick={() => onChange(!value)}
      type="button"
    >
      {value ? 'Bots excluded' : 'Include bots'}
    </Button>
  );
}
