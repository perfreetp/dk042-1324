import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, User, Briefcase, Lightbulb, Save, PenLine } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import ProjectCard from '../components/project/ProjectCard';
import ProjectEditor from '../components/project/ProjectEditor';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Project } from '../types';

export default function CreatePage() {
  const projects = usePortfolioStore((state) => state.projects);
  const background = usePortfolioStore((state) => state.background);
  const addProject = usePortfolioStore((state) => state.addProject);
  const updateProject = usePortfolioStore((state) => state.updateProject);
  const deleteProject = usePortfolioStore((state) => state.deleteProject);
  const reorderProjects = usePortfolioStore((state) => state.reorderProjects);
  const updateBackground = usePortfolioStore((state) => state.updateBackground);
  const saveVersion = usePortfolioStore((state) => state.saveVersion);
  const narrativeDraft = usePortfolioStore((state) => state.narrativeDraft);
  const updateNarrativeDraft = usePortfolioStore((state) => state.updateNarrativeDraft);
  const targetMajor = usePortfolioStore((state) => state.targetMajor);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showSaveVersion, setShowSaveVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [activeSection, setActiveSection] = useState<'projects' | 'background' | 'narrative'>('projects');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderProjects(active.id as string, over.id as string);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditorOpen(true);
  };

  const handleAddProject = () => {
    addProject();
    const newProject = projects[projects.length - 1];
    if (newProject) {
      setEditingProject(newProject);
      setIsEditorOpen(true);
    }
  };

  const handleSaveVersion = () => {
    if (versionName.trim()) {
      saveVersion(versionName.trim());
      setVersionName('');
      setShowSaveVersion(false);
    }
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    updateBackground({ skills });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-stone-800 mb-2"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            创建作品集
          </h1>
          <p className="text-stone-500">添加项目、整理顺序、填写背景信息</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowSaveVersion(true)}>
            <Save className="w-4 h-4" />
            保存版本
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-200">
        <button
          onClick={() => setActiveSection('projects')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          项目管理
          <span className="px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-600">
            {projects.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('background')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'background'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <User className="w-4 h-4" />
          个人背景
        </button>
        <button
          onClick={() => setActiveSection('narrative')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'narrative'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <PenLine className="w-4 h-4" />
          申请叙事
        </button>
      </div>

      {activeSection === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">我的项目</h2>
              <p className="text-sm text-stone-500">拖拽卡片调整项目顺序</p>
            </div>
            <Button onClick={handleAddProject}>
              <Plus className="w-4 h-4" />
              添加项目
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="text-center py-16">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">还没有项目</h3>
              <p className="text-stone-500 mb-6 max-w-md mx-auto">
                添加你的第一个项目吧。建议包含 3-5 个最能代表你能力的项目，
                覆盖不同类型以展示综合实力。
              </p>
              <Button onClick={handleAddProject} size="lg">
                <Plus className="w-5 h-5" />
                添加第一个项目
              </Button>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedProjects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={() => handleEditProject(project)}
                      onDelete={() => deleteProject(project.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {projects.length > 0 && projects.length < 3 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>提示：</strong>建议至少添加 3 个项目，以完整展示你的能力体系。
              </p>
            </div>
          )}

          {projects.length > 5 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>提示：</strong>项目数量较多（{projects.length}个），建议精选 5 个以内最有代表性的项目。
              </p>
            </div>
          )}
        </div>
      )}

      {activeSection === 'background' && (
        <div className="space-y-8">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <Card.Title>教育背景</Card.Title>
                  <p className="text-sm text-stone-500">填写你的本科及其他教育经历</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <textarea
                value={background.education}
                onChange={(e) => updateBackground({ education: e.target.value })}
                placeholder="例如：XX大学 XX专业 学士\nGPA：3.8/4.0\n相关课程：..."
                rows={4}
                className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <Card.Title>相关经历</Card.Title>
                  <p className="text-sm text-stone-500">填写实习、工作、志愿者等相关经历</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <textarea
                value={background.experience}
                onChange={(e) => updateBackground({ experience: e.target.value })}
                placeholder="例如：\n2023.06 - 至今 | XX公司 | 产品设计实习生\n- 负责XX产品的用户界面设计...\n\n2022.07 - 2022.09 | XX工作室 | 设计助理..."
                rows={6}
                className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <Card.Title>技能清单</Card.Title>
                  <p className="text-sm text-stone-500">用逗号或换行分隔，列出你掌握的技能</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <textarea
                value={background.skills.join('\n')}
                onChange={(e) => handleSkillsChange(e.target.value)}
                placeholder="例如：\nFigma\nSketch\n用户研究\nHTML/CSS\nJavaScript\nPython\n数据分析"
                rows={6}
                className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
              {background.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {background.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {activeSection === 'narrative' && (
        <div className="space-y-8">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <Card.Title>申请叙事草稿</Card.Title>
                  <p className="text-sm text-stone-500">用一段话把你的转专业故事讲清楚</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="p-4 bg-indigo-50 rounded border border-indigo-100 mb-4">
                <p className="text-sm text-indigo-700">
                  <strong>写作提示：</strong>好的转专业叙事应该回答三个核心问题——
                  你从哪里来（原专业背景如何塑造了你）？你为什么转向（什么触发了转专业的决定）？你准备了什么（项目如何证明你的能力和决心）？
                  试着把个人背景、目标专业和项目经历串联成一个连贯的故事。
                </p>
              </div>
              <textarea
                value={narrativeDraft}
                onChange={(e) => updateNarrativeDraft(e.target.value)}
                placeholder={"示例：\n\n我本科主修计算机科学，在三年的编程训练中，我逐渐发现自己对「人如何与技术交互」比「技术本身」更感兴趣。大三时参与了一个校园出行服务的课题，从用户调研到原型设计全程主导，这段经历让我确认了转向交互设计的决心。\n\n为了补足设计基础，我自学了 Figma 和设计思维方法论，并完成了三个不同类型的交互设计项目：校园出行服务（完整的设计过程）、心理健康助手（侧重用户研究）、以及一个编程教育工具（体现技术背景的优势）。这些项目从不同角度证明了我具备设计思维、用户研究和技术实现的能力。\n\n我希望在清华大学交互设计专业深造，将技术背景与设计能力结合，做出真正懂用户的交互产品。"}
                rows={12}
                className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-stone-400">{narrativeDraft.length} 字</span>
                {narrativeDraft.length > 0 && narrativeDraft.length < 100 && (
                  <span className="text-xs text-amber-600">建议至少写 100 字，才能充分讲述你的故事</span>
                )}
                {narrativeDraft.length >= 100 && narrativeDraft.length < 300 && (
                  <span className="text-xs text-stone-500">字数适中，可以更详细一些</span>
                )}
                {narrativeDraft.length >= 300 && (
                  <span className="text-xs text-emerald-600">叙事篇幅充分</span>
                )}
              </div>
            </Card.Content>
          </Card>

          {projects.length > 0 && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-100 rounded flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <Card.Title>叙事素材速览</Card.Title>
                    <p className="text-sm text-stone-500">你的项目和个人背景中可用于叙事的素材</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {background.education && (
                    <div className="p-3 bg-stone-50 rounded border border-stone-100">
                      <p className="text-xs font-medium text-stone-500 mb-1">教育背景</p>
                      <p className="text-sm text-stone-700 whitespace-pre-line">{background.education}</p>
                    </div>
                  )}
                  {background.experience && (
                    <div className="p-3 bg-stone-50 rounded border border-stone-100">
                      <p className="text-xs font-medium text-stone-500 mb-1">相关经历</p>
                      <p className="text-sm text-stone-700 whitespace-pre-line">{background.experience}</p>
                    </div>
                  )}
                  {background.skills.length > 0 && (
                    <div className="p-3 bg-stone-50 rounded border border-stone-100">
                      <p className="text-xs font-medium text-stone-500 mb-1">技能清单</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {background.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {targetMajor && (
                    <div className="p-3 bg-indigo-50 rounded border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600 mb-1">目标专业</p>
                      <p className="text-sm text-indigo-800 font-medium">{targetMajor.school} · {targetMajor.major}</p>
                      <p className="text-xs text-indigo-600 mt-1">{targetMajor.admissionPreferences}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-stone-500 mb-2">项目列表（当前排序）</p>
                    {[...projects].sort((a, b) => a.order - b.order).map((project, i) => (
                      <div key={project.id} className="flex items-center gap-3 p-2 border-b border-stone-100 last:border-b-0">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{project.title || '未命名项目'}</p>
                          <p className="text-xs text-stone-500">{project.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      )}

      <ProjectEditor
        project={editingProject}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProject(null);
        }}
      />

      {showSaveVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaveVersion(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">保存版本</h3>
            <p className="text-sm text-stone-500 mb-4">
              保存当前作品集的完整快照，方便后续对比和恢复。
            </p>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="例如：2024年春季版、第一版草稿"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveVersion()}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowSaveVersion(false)}>
                取消
              </Button>
              <Button onClick={handleSaveVersion} disabled={!versionName.trim()}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
