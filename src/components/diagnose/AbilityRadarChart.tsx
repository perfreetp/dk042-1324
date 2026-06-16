import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { AbilityGap } from '../../types';

interface AbilityRadarChartProps {
  abilityGaps: AbilityGap[];
}

export function AbilityRadarChart({ abilityGaps }: AbilityRadarChartProps) {
  const data = abilityGaps.map((gap) => ({
    ability: gap.name,
    当前水平: gap.currentLevel,
    目标要求: gap.requiredLevel,
    fullMark: 5,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e7e5e4" />
          <PolarAngleAxis
            dataKey="ability"
            tick={{
              fill: '#57534e',
              fontSize: 12,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 5]}
            tick={{ fill: '#a8a29e', fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', fontFamily: "'Noto Sans SC', sans-serif" }}
          />
          <Radar
            name="当前水平"
            dataKey="当前水平"
            stroke="#4f46e5"
            fill="#6366f1"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Radar
            name="目标要求"
            dataKey="目标要求"
            stroke="#f59e0b"
            fill="#fbbf24"
            fillOpacity={0.2}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AbilityRadarChart;
