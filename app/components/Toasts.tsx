
export type ToastTone = 'neutral' | 'danger' | 'good' | 'success';
export type ToastItem = { id: string; title: string; message?: string; tone: ToastTone };

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed bottom-5 left-5 z-[60] flex w-[360px] max-w-[92vw] flex-col gap-2">
            {items.map((t) => (
                <div
                    key={t.id}
                    className={
                        "rounded-xl border bg-zinc-950/70 backdrop-blur px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] " +
                        (t.tone === 'danger'
                            ? 'border-red-500/25'
                            : (t.tone === 'good' || t.tone === 'success')
                                ? 'border-emerald-500/25'
                                : 'border-zinc-800')
                    }
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-zinc-500">
                                <span
                                    className={
                                        "inline-flex h-2 w-2 rounded-full " +
                                        (t.tone === 'danger'
                                            ? 'bg-red-500 animate-pulse'
                                            : (t.tone === 'good' || t.tone === 'success')
                                                ? 'bg-emerald-500'
                                                : 'bg-zinc-500')
                                    }
                                />
                                <span>{t.title}</span>
                                <span className="text-zinc-700">•</span>
                                <span className="font-mono text-zinc-500">LIVE</span>
                            </div>
                            {t.message && (
                                <div className="mt-1 text-sm text-zinc-200 leading-snug line-clamp-2">{t.message}</div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onDismiss(t.id)}
                            className="text-zinc-600 hover:text-zinc-300 text-lg leading-none"
                            aria-label="Dismiss"
                            title="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
