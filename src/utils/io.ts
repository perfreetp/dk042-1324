import type { PortfolioState } from '../types';

export function exportToJSON(data: PortfolioState): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `作品集数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file: File): Promise<PortfolioState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as PortfolioState;
        resolve(data);
      } catch (error) {
        reject(new Error('文件解析失败，请确保是有效的 JSON 文件'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export function validatePortfolioData(data: unknown): data is PortfolioState {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.projects)) return false;
  if (!obj.background || typeof obj.background !== 'object') return false;
  if (!Array.isArray(obj.versions)) return false;

  const bg = obj.background as Record<string, unknown>;
  if (typeof bg.education !== 'string') return false;
  if (typeof bg.experience !== 'string') return false;
  if (!Array.isArray(bg.skills)) return false;

  return true;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateProjectProgress(
  process: { motivation: string; research: string; ideation: string; implementation: string; reflection: string },
  materials: { isComplete: boolean }[]
): number {
  let processScore = 0;
  const processFields = ['motivation', 'research', 'ideation', 'implementation', 'reflection'] as const;
  processFields.forEach((field) => {
    if (process[field] && process[field].length > 50) {
      processScore += 20;
    }
  });

  let materialScore = 0;
  if (materials.length > 0) {
    const completeCount = materials.filter((m) => m.isComplete).length;
    materialScore = (completeCount / materials.length) * 100;
  }

  return Math.round((processScore + materialScore) / 2);
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 55) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-emerald-100';
  if (score >= 70) return 'bg-amber-100';
  if (score >= 55) return 'bg-orange-100';
  return 'bg-red-100';
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '中等';
  return '待提升';
}
