import { Layout, ArrowRight } from 'lucide-react';
import type { Project } from '../../types';
import { calculateProjectProgress } from '../../utils/io';
import { getScoreBgColor, getScoreColor } from '../../utils/io';

interface StructurePreviewProps {
  projects: Project[];
}

export function StructurePreview({ projects }: StructurePreviewProps) {
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
  const categories = new Set(projects.map((p) => p.category));

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      '交互设计': 'bg-indigo-100 border-indigo-300',
      '视觉设计': 'bg-pink-100 border-pink-300',
      '产品设计': 'bg-emerald-100 border-emerald-300',
      '用户研究': 'bg-amber-100 border-amber-300',
      '编程开发': 'bg-blue-100 border-blue-300',
      '学术研究': 'bg-purple-100 border-purple-300',
      '社会实践': 'bg-orange-100 border-orange-300',
      '其他': 'bg-stone-100 border-stone-300',
    };
    return colors[category] || 'bg-stone-100 border-stone-300';
  };

  const getCategoryTextColor = (category: string): string => {
    const colors: Record<string, string> = {
      '交互设计': 'text-indigo-700',
      '视觉设计': 'text-pink-700',
      '产品设计': 'text-emerald-700',
      '用户研究': 'text-amber-700',
      '编程开发': 'text-blue-700',
      '学术研究': 'text-purple-700',
      '社会实践': 'text-orange-700',
      '其他': 'text-stone-700',
    };
    return colors[category] || 'text-stone-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-stone-800">作品集结构预览</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">共 {projects.length} 个项目</span>
          <span className="text-sm text-stone-500">|</span>
          <span className="text-sm text-stone-500">{categories.size} 种类型</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
          <Layout className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">还没有添加项目</p>
          <p className="text-sm text-stone-400">在创建页添加项目后可在此预览结构</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-stone-200" />

          <div className="space-y-4">
            {sortedProjects.map((project, index) => {
              const progress = calculateProjectProgress(project.process, project.materials);
              return (
                <div key={project.id} className="relative flex gap-4">
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                        progress >= 70
                          ? 'bg-emerald-500 text-white'
                          : progress >= 40
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-300 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className={`flex-1 p-4 rounded-lg border-2 ${getCategoryColor(project.category)} transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getCategoryTextColor(project.category)}`}>
                            {project.category}
                          </span>
                        </div>
                        <h4 className="font-medium text-stone-800 mb-1 truncate">
                          {project.title || '未命名项目'}
                        </h4>
                        {project.description && (
                          <p className="text-sm text-stone-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className={`text-lg font-bold ${getScoreColor(progress)}`}>
                          {progress}%
                        </div>
                        <div className="w-16 h-1.5 bg-stone-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${getScoreBgColor(progress).replace('bg-', 'bg-').replace('-100', '-500')}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-200/50">
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${
                          project.process.motivation.length > 50 ? 'bg-emerald-500' : 'bg-stone-300'
                        }`} />
                        <span>动机</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${
                          project.process.research.length > 50 ? 'bg-emerald-500' : 'bg-stone-300'
                        }`} />
                        <span>调研</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${
                          project.process.ideation.length > 50 ? 'bg-emerald-500' : 'bg-stone-300'
                        }`} />
                        <span>构思</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${
                          project.process.implementation.length > 50 ? 'bg-emerald-500' : 'bg-stone-300'
                        }`} />
                        <span>实现</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${
                          project.process.reflection.length > 50 ? 'bg-emerald-500' : 'bg-stone-300'
                        }`} />
                        <span>反思</span>
                      </div>
                    </div>
                  </div>

                  {index < sortedProjects.length - 1 && (
                    <div className="absolute left-8 top-full -translate-x-1/2 -translate-y-1/2 text-stone-300 z-10">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categories.size === 1 && projects.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          <strong>提示：</strong>所有项目类型相同，建议增加不同类型的项目以展示综合能力。
        </div>
      )}
    </div>
  );
}

export default StructurePreview;
