import { Activity, Shield, AlertTriangle, Clock } from 'lucide-react';
import { EventItem, Category } from '../lib/events';
import { sevTier } from '../lib/simulation';
import { StatCard } from './StatCard';
import { FilterType } from './FilterDrawer';

interface StatsRowProps {
    events: EventItem[];
    setActiveTab: (tab: 'ALL' | Category) => void;
    onFilter?: (filter: FilterType) => void;
}

export function StatsRow({ events, setActiveTab, onFilter }: StatsRowProps) {
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
                onClick={() => onFilter?.('all')}
            />
            <StatCard
                label="Critical"
                value={criticalCount.toString()}
                icon={AlertTriangle}
                trend={criticalCount > 0 ? { value: "Active", up: true } : undefined}
                onClick={() => onFilter?.('critical')}
            />
            <StatCard
                label="24h Active"
                value={activeCount.toString()}
                icon={Clock}
                onClick={() => onFilter?.('active')}
            />
            <StatCard
                label="High Confidence"
                value={highConfCount.toString()}
                icon={Shield}
                onClick={() => onFilter?.('high-confidence')}
            />
        </div>
    );
}

