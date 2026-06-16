import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { AbilityGap } from '../../types';
import { getScoreColor } from '../../utils/io';

interface AbilityGapListProps {
  abilityGaps: AbilityGap[];
}

export function AbilityGapList({ abilityGaps }: AbilityGapListProps) {
  const sortedGaps = [...abilityGaps].sort(
    (a, b) => b.gap * b.weight - a.gap * a.weight
  );

  return (
    <div className="space-y-3">
      {sortedGaps.map((gap) => {
        const hasGap = gap.gap > 0;
        const priority = gap.gap * gap.weight;

        return (
          <div
            key={gap.name}
            className={`p-4 rounded border transition-all ${
              hasGap
                ? priority > 0.6
                  ? 'bg-red-50 border-red-200'
                  : priority > 0.3
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-stone-50 border-stone-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {hasGap ? (
                  <AlertTriangle
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      priority > 0.6 ? 'text-red-500' : 'text-amber-500'
                    }`}
                  />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-stone-800">{gap.name}</h4>
                    {hasGap && priority > 0.6 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                        高优先级
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-semibold ${getScoreColor((gap.currentLevel / 5) * 100)}`}>
                      当前: {gap.currentLevel}
                    </span>
                    <span className="text-stone-400">→</span>
                    <span className="text-sm font-medium text-indigo-600">
                      要求: {gap.requiredLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                {hasGap ? (
                  <div className="flex items-center gap-1 text-orange-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+{gap.gap}</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-emerald-600">已达标</span>
                )}
                <div className="w-24 mt-1">
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        hasGap
                          ? priority > 0.6
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(gap.currentLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AbilityGapList;
