import { cn } from '@/lib/utils';
import { getScoreColor } from '@/utils/io';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = getScoreColor(percentage);
  const bgColorClass = percentage >= 85
    ? 'bg-emerald-500'
    : percentage >= 70
    ? 'bg-amber-500'
    : percentage >= 55
    ? 'bg-orange-500'
    : 'bg-red-500';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-stone-600">完整度</span>
        <span className={cn('text-xs font-semibold', colorClass)}>
          {Math.round(percentage)}%
        </span>
      </div>
      )}
      <div className={cn('w-full bg-stone-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', bgColorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
