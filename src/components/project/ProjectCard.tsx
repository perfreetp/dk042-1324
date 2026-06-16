import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, FolderOpen } from 'lucide-react';
import type { Project } from '../../types';
import { calculateProjectProgress } from '../../utils/io';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progress = calculateProjectProgress(project.process, project.materials);
  const hasContent = project.title || project.description;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-[1.02] z-10'
      )}
    >
      <Card hover className="h-full">
        <Card.Content className="p-5">
          <div className="flex items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="mt-1 p-1 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3
                    className="font-medium text-stone-800 truncate"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {hasContent ? project.title || '未命名项目' : '点击编辑添加项目'}
                  </h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={onEdit}
                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors"
                    title="编辑项目"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 rounded hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                    title="删除项目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="ml-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                    {project.category}
                  </span>
                  <span className="text-xs text-stone-400">
                    {project.materials.filter((m) => m.isComplete).length}/{project.materials.length} 素材
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <ProgressBar value={progress} size="sm" showLabel={false} />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default ProjectCard;
