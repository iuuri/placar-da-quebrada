import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AlertProps = { tone?: 'erro' | 'sucesso'; children: ReactNode }

export function Alert({ tone = 'erro', children }: AlertProps) {
  return (
    <div
      role={tone === 'erro' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border-l-4 bg-white px-4 py-3',
        tone === 'erro' ? 'border-cartao' : 'border-gramado',
      )}
    >
      {children}
    </div>
  )
}
