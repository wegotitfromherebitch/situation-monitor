import { Category, EventItem } from '../lib/events';
import { EventCard } from './EventCard';

interface EventListProps {
    events: EventItem[];
    activeTab: 'ALL' | Category;
    setActiveTab: (tab: 'ALL' | Category) => void;
    onEventClick?: (event: EventItem) => void;
}

export function EventList({ events, activeTab, setActiveTab, onEventClick }: EventListProps) {
    const filteredEvents = activeTab === 'ALL'
        ? events
        : events.filter(e => e.category === activeTab);

    return (
        <>
            <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4 mb-4">
                <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Feed
                </h2>
                <div className="flex flex-wrap gap-1.5">
                    {(['ALL', 'SECURITY', 'STATE', 'MARKETS', 'CYBER', 'CLIMATE'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={
                                "px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded border transition-all " +
                                (activeTab === tab
                                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                                    : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300')
                            }
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredEvents.map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick?.(event)}
                    />
                ))}
                {filteredEvents.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-600">
                        No active events in this category.
                    </div>
                )}
            </div>
        </>
    );
}
