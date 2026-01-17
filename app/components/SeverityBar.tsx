
export function SeverityBar({ severity }: { severity: number }) {
    const getColor = () => {
        if (severity >= 80) return 'bg-critical shadow-[0_0_10px_rgba(255,69,58,0.5)]';
        if (severity >= 60) return 'bg-warning shadow-[0_0_10px_rgba(255,159,10,0.5)]';
        if (severity >= 40) return 'bg-caution shadow-[0_0_10px_rgba(255,214,10,0.5)]';
        return 'bg-success shadow-[0_0_10px_rgba(50,215,75,0.5)]';
    };

    return (
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div
                className={`h-full ${getColor()} transition-all duration-700 rounded-full`}
                style={{ width: `${severity}%` }}
            />
        </div>
    );
}
