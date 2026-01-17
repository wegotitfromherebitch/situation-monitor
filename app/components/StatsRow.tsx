import { Activity, Shield, AlertTriangle } from 'lucide-react';
import { EventItem, Category } from '../lib/events';
import { sevTier } from '../lib/simulation';
import { StatCard } from './StatCard';

interface StatsRowProps {
    events: EventItem[];
    setActiveTab: (tab: 'ALL' | Category) => void;
}

export function StatsRow({ events, setActiveTab }: StatsRowProps) {
    const criticalCount = events.filter((e) => sevTier(e.severity) === 'CRITICAL').length;
    const activeCount = events.filter((e) => e.updatedMinutesAgo < 24 * 60).length;
    const highConfCount = events.filter((e) => e.confidence === 'HIGH').length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
                label="Total Signals"
                value={events.length.toString()}
                icon={Activity}
                trend={{ value: "+2", up: true }}
                onClick={() => setActiveTab('ALL')}
            />
            <StatCard
                label="Critical"
                value={criticalCount.toString()}
                icon={AlertTriangle}
                trend={criticalCount > 0 ? { value: "Active", up: true } : undefined}
            />
            <StatCard
                label="24h Active"
                value={activeCount.toString()}
                icon={Activity}
            />
            <StatCard
                label="High Confidence"
                value={highConfCount.toString()}
                icon={Shield}
            />
        </div>
    );
}
