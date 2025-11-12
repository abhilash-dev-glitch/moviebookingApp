import { useEffect } from 'react'
import { useToastStore } from '../lib/toast'

export default function Toaster(){
  const { toasts, remove } = useToastStore()

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(()=> remove(t.id), 3500))
    return () => timers.forEach(clearTimeout)
  }, [toasts, remove])

  const color = (t) => t.type === 'success' ? 'bg-green-500/20 text-green-200 border-green-400/20'
    : t.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-400/20'
    : 'bg-white/10 text-white border-white/20'

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80">
      {toasts.map(t => (
        <div key={t.id} className={`rounded-lg border px-4 py-3 shadow-soft ${color(t)}`}>
          <div className="font-semibold">{t.title}</div>
          {t.description && <div className="text-sm opacity-80">{t.description}</div>}
        </div>
      ))}
    </div>
  )
}
