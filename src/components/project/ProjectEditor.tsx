import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { Project, Process, Material } from '../../types';
import { projectCategories } from '../../data/majors';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { v4 as uuidv4 } from 'uuid';

interface ProjectEditorProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const processSteps: { key: keyof Process; label: string; description: string }[] = [
  { key: 'motivation', label: '项目动机', description: '为什么要做这个项目？解决什么问题？' },
  { key: 'research', label: '调研分析', description: '做了哪些用户研究、竞品分析、数据收集？' },
  { key: 'ideation', label: '方案构思', description: '如何产生创意？经历了哪些迭代？' },
  { key: 'implementation', label: '设计实现', description: '具体的设计过程、技术方案、遇到的挑战' },
  { key: 'reflection', label: '反思总结', description: '项目成果、学到了什么、可以如何改进？' },
];

const materialTypes: { value: Material['type']; label: string }[] = [
  { value: 'image', label: '图片' },
  { value: 'document', label: '文档' },
  { value: 'video', label: '视频' },
  { value: 'other', label: '其他' },
];

export function ProjectEditor({ project, isOpen, onClose }: ProjectEditorProps) {
  const updateProject = usePortfolioStore((state) => state.updateProject);
  const updateProcess = usePortfolioStore((state) => state.updateProcess);
  const updateMaterial = usePortfolioStore((state) => state.updateMaterial);
  const addMaterial = usePortfolioStore((state) => state.addMaterial);
  const deleteMaterial = usePortfolioStore((state) => state.deleteMaterial);

  const [activeTab, setActiveTab] = useState<'basic' | 'process' | 'materials'>('basic');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<Material['type']>('image');

  if (!project) return null;

  const handleBasicChange = (field: keyof Pick<Project, 'title' | 'description' | 'category'>, value: string) => {
    updateProject(project.id, { [field]: value });
  };

  const handleProcessChange = (field: keyof Process, value: string) => {
    updateProcess(project.id, { [field]: value });
  };

  const handleToggleMaterial = (materialId: string) => {
    const material = project.materials.find((m) => m.id === materialId);
    if (material) {
      updateMaterial(project.id, materialId, { isComplete: !material.isComplete });
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    addMaterial(project.id, {
      name: newMaterialName.trim(),
      type: newMaterialType,
      isComplete: false,
      description: '',
    });
    setNewMaterialName('');
  };

  const tabs = [
    { key: 'basic', label: '基本信息' },
    { key: 'process', label: '过程标注' },
    { key: 'materials', label: '素材管理' },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑项目" size="xl">
      <div className="p-6">
        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                项目标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => handleBasicChange('title', e.target.value)}
                placeholder="给项目起一个清晰的名称"
                className="w-full px-4 py-2.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                项目分类
              </label>
              <div className="flex flex-wrap gap-2">
                {projectCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleBasicChange('category', cat)}
                    className={`px-3 py-1.5 text-sm rounded transition-all ${
                      project.category === cat
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                项目简介
              </label>
              <textarea
                value={project.description}
                onChange={(e) => handleBasicChange('description', e.target.value)}
                placeholder="简要描述项目的目标、范围和成果"
                rows={4}
                className="w-full px-4 py-2.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 rounded border border-indigo-100 mb-6">
              <p className="text-sm text-indigo-700">
                <strong>提示：</strong>完整填写项目的五个过程阶段，能够显著提升作品集的说服力。
                招生官非常看重"从零到一"的思考过程。
              </p>
            </div>

            {processSteps.map((step, index) => (
              <div key={step.key} className="relative">
                {index < processSteps.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-stone-200" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-sm font-semibold text-indigo-700 z-10">
                    {index + 1}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-stone-800">{step.label}</h4>
                      {project.process[step.key].length > 50 && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                          已填写
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mb-2">{step.description}</p>
                    <textarea
                      value={project.process[step.key]}
                      onChange={(e) => handleProcessChange(step.key, e.target.value)}
                      placeholder={`请详细描述${step.label}的过程...`}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 rounded border border-amber-100 mb-6">
              <p className="text-sm text-amber-700">
                <strong>素材建议：</strong>每个项目建议包含封面图、过程草图、调研数据、原型截图、
                成品展示和项目说明文档，以完整展示项目成果。
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="输入素材名称..."
                className="flex-1 px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
              />
              <select
                value={newMaterialType}
                onChange={(e) => setNewMaterialType(e.target.value as Material['type'])}
                className="px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                {materialTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <Button onClick={handleAddMaterial} size="sm">
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </div>

            <div className="space-y-2">
              {project.materials.map((material) => (
                <div
                  key={material.id}
                  className={`flex items-center justify-between p-3 rounded border transition-all ${
                    material.isComplete
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleMaterial(material.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        material.isComplete
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {material.isComplete && <Check className="w-3 h-3" />}
                    </button>
                    <div>
                      <span className={`text-sm font-medium ${material.isComplete ? 'text-emerald-700 line-through' : 'text-stone-700'}`}>
                        {material.name}
                      </span>
                      <span className="ml-2 text-xs text-stone-400">
                        {materialTypes.find((t) => t.value === material.type)?.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMaterial(project.id, material.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-stone-200">
          <Button variant="ghost" onClick={onClose}>
            完成
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ProjectEditor;
