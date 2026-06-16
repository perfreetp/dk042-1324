import { FileImage, FileText, Video, File, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { MaterialCheckResult } from '../../types';
import { getScoreColor, getScoreBgColor } from '../../utils/io';

const typeIcons = {
  image: FileImage,
  document: FileText,
  video: Video,
  other: File,
};

interface MaterialCheckListProps {
  checks: { projectId: string; projectTitle: string; result: MaterialCheckResult }[];
}

export function MaterialCheckList({ checks }: MaterialCheckListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(checks.map((c) => c.projectId)));

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedIds(newExpanded);
  };

  const overallCompleteness = checks.length > 0
    ? Math.round(checks.reduce((sum, c) => sum + c.result.completeness, 0) / checks.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getScoreBgColor(overallCompleteness)} border`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-600">整体素材完整度</p>
            <p className={`text-3xl font-bold ${getScoreColor(overallCompleteness)}`}>
              {overallCompleteness}%
            </p>
          </div>
          <div className="w-32 h-3 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallCompleteness >= 85
                  ? 'bg-emerald-500'
                  : overallCompleteness >= 70
                  ? 'bg-amber-500'
                  : overallCompleteness >= 55
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${overallCompleteness}%` }}
            />
          </div>
        </div>
      </div>

      {checks.map((check) => {
        const isExpanded = expandedIds.has(check.projectId);
        const result = check.result;

        return (
          <div
            key={check.projectId}
            className="border border-stone-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleExpand(check.projectId)}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-stone-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                )}
                <div>
                  <h4 className="font-medium text-stone-800">
                    {check.projectTitle || '未命名项目'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {result.missingItems.length === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        素材完整
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        缺失 {result.missingItems.length} 项
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${getScoreColor(result.completeness)}`}>
                  {result.completeness}%
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-stone-100">
                {result.missingItems.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-stone-700 mb-3">缺失素材</h5>
                    <div className="space-y-2">
                      {result.missingItems.map((item) => {
                        const Icon = typeIcons[item.type] || File;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded"
                          >
                            <Icon className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-800">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-red-600">{item.description}</p>
                              )}
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              {item.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {result.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-stone-700 mb-3">改进建议</h5>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MaterialCheckList;
