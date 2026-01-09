import Link from "next/link";
import { EVENTS, displayTitleFor } from "../../lib/events";

function toneFor(sev: number) {
  if (sev >= 80) return { label: "CRITICAL", ring: "ring-red-500/40 text-red-200", bar: "bg-red-500/70" };
  if (sev >= 60) return { label: "ELEVATED", ring: "ring-amber-500/35 text-amber-200", bar: "bg-amber-500/70" };
  if (sev >= 40) return { label: "WATCH", ring: "ring-emerald-500/30 text-emerald-200", bar: "bg-emerald-500/70" };
  return { label: "BACKGROUND", ring: "ring-zinc-700 text-zinc-300", bar: "bg-zinc-700" };
}

export default function EventPage({ params }: { params: { id: string } }) {
  const event = EVENTS.find((e) => e.id === params.id);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            ← Back
          </Link>
          <div className="rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-500">
            Event Detail
          </div>
        </div>

        {!event ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="text-lg font-semibold">Event not found</div>
            <div className="mt-2 text-sm text-zinc-400">That ID doesn’t exist in the demo data yet.</div>
          </div>
        ) : (
          (() => {
            const t = toneFor(event.severity);
            return (
              <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur">
                <div className="relative">
                  <div className={"absolute left-0 top-0 h-full w-[4px] " + t.bar} />
                  <div className="p-5">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">{event.category}</div>
                    <h1 className="mt-2 text-2xl font-semibold">{displayTitleFor(event)}</h1>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-300">
                      <span className={"rounded-lg px-2 py-1 text-[11px] ring-1 " + t.ring}>
                        <span className="font-semibold">{event.severity}</span>
                        <span className="ml-2 tracking-wide">{t.label}</span>
                      </span>
                      <span className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
                        Confidence: <span className="text-zinc-100">{event.confidence}</span>
                      </span>
                      <span className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
                        Region: <span className="text-zinc-100">{event.region}</span>
                      </span>
                      <span className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
                        Updated: <span className="text-zinc-100">{event.updatedMinutesAgo}m</span>
                      </span>
                      <span className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-500">
                        ID: {event.id}
                      </span>
                    </div>

                    <div className="mt-4 text-sm leading-relaxed text-zinc-300">{event.summary}</div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <div className="text-xs font-semibold tracking-wide text-zinc-300">What to watch</div>
                        <div className="mt-2 text-sm text-zinc-400">
                          Placeholder: key actors, possible next moves, and verification notes.
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <div className="text-xs font-semibold tracking-wide text-zinc-300">Market linkage</div>
                        <div className="mt-2 text-sm text-zinc-400">
                          Placeholder: related tickers/commodities + implied risk premium.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
                      Next upgrade: timeline + sources + map pin + related market moves.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </main>
  );
}
