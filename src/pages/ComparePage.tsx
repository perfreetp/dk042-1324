import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, GitCompare, Trash2, RotateCcw, FileCheck, AlertCircle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/io';
import type { PortfolioVersion, Project, Process } from '../types';

interface FieldChange {
  field: string;
  oldVal: string;
  newVal: string;
}

interface ProjectDiff {
  type: 'added' | 'removed' | 'modified';
  project: Project;
  changes: FieldChange[];
}

interface VersionDiffResult {
  projectDiffs: ProjectDiff[];
  majorChanged: boolean;
  oldMajor: string;
  newMajor: string;
  narrativeChanged: boolean;
  oldNarrative: string;
  newNarrative: string;
  summary: { added: number; removed: number; modified: number };
}

function compareProjects(curr: Project, prev: Project): FieldChange[] {
  const changes: FieldChange[] = [];

  if (curr.title !== prev.title) {
    changes.push({ field: '项目标题', oldVal: prev.title || '(空)', newVal: curr.title || '(空)' });
  }
  if (curr.description !== prev.description) {
    changes.push({ field: '项目简介', oldVal: prev.description || '(空)', newVal: curr.description || '(空)' });
  }
  if (curr.category !== prev.category) {
    changes.push({ field: '项目分类', oldVal: prev.category, newVal: curr.category });
  }

  const processFields: { key: keyof Process; label: string }[] = [
    { key: 'motivation', label: '项目动机' },
    { key: 'research', label: '调研分析' },
    { key: 'ideation', label: '方案构思' },
    { key: 'implementation', label: '设计实现' },
    { key: 'reflection', label: '反思总结' },
  ];

  processFields.forEach(({ key, label }) => {
    if (curr.process[key] !== prev.process[key]) {
      changes.push({
        field: label,
        oldVal: prev.process[key] ? (prev.process[key].length > 60 ? prev.process[key].slice(0, 60) + '...' : prev.process[key]) : '(空)',
        newVal: curr.process[key] ? (curr.process[key].length > 60 ? curr.process[key].slice(0, 60) + '...' : curr.process[key]) : '(空)',
      });
    }
  });

  const currCompleted = curr.materials.filter((m) => m.isComplete).length;
  const prevCompleted = prev.materials.filter((m) => m.isComplete).length;
  const currTotal = curr.materials.length;
  const prevTotal = prev.materials.length;

  if (currCompleted !== prevCompleted || currTotal !== prevTotal) {
    changes.push({
      field: '素材完成度',
      oldVal: `${prevCompleted}/${prevTotal} 已完成`,
      newVal: `${currCompleted}/${currTotal} 已完成`,
    });

    const currNames = new Set(curr.materials.filter((m) => m.isComplete).map((m) => m.name));
    const prevNames = new Set(prev.materials.filter((m) => m.isComplete).map((m) => m.name));

    const newlyCompleted = [...currNames].filter((n) => !prevNames.has(n));
    const newlyUnchecked = [...prevNames].filter((n) => !currNames.has(n));

    if (newlyCompleted.length > 0) {
      changes.push({ field: '新完成素材', oldVal: '—', newVal: newlyCompleted.join('、') });
    }
    if (newlyUnchecked.length > 0) {
      changes.push({ field: '取消完成素材', oldVal: newlyUnchecked.join('、'), newVal: '—' });
    }
  }

  return changes;
}

export default function ComparePage() {
  const navigate = useNavigate();
  const targetMajor = usePortfolioStore((state) => state.targetMajor);
  const versions = usePortfolioStore((state) => state.versions);
  const updateSubmissionItem = usePortfolioStore((state) => state.updateSubmissionItem);
  const restoreVersion = usePortfolioStore((state) => state.restoreVersion);
  const deleteVersion = usePortfolioStore((state) => state.deleteVersion);
  const partialRestoreVersion = usePortfolioStore((state) => state.partialRestoreVersion);
  const projects = usePortfolioStore((state) => state.projects);
  const narrativeDraft = usePortfolioStore((state) => state.narrativeDraft);

  const [activeTab, setActiveTab] = useState<'checklist' | 'versions'>('checklist');
  const [selectedVersion, setSelectedVersion] = useState<PortfolioVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [restoreParts, setRestoreParts] = useState({ projects: true, targetMajor: true, narrativeDraft: true });
  const [expandedDiffs, setExpandedDiffs] = useState<Set<number>>(new Set());

  const requiredItems = targetMajor?.submissionItems.filter((item) => item.isRequired) || [];
  const optionalItems = targetMajor?.submissionItems.filter((item) => !item.isRequired) || [];
  const completedRequired = requiredItems.filter((item) => item.isCompleted).length;
  const completedOptional = optionalItems.filter((item) => item.isCompleted).length;

  const tabs = [
    { key: 'checklist', label: '提交清单', icon: FileCheck },
    { key: 'versions', label: '版本对比', icon: GitCompare },
  ] as const;

  const handleToggleItem = (itemId: string) => {
    const item = targetMajor?.submissionItems.find((i) => i.id === itemId);
    if (item) {
      updateSubmissionItem(itemId, !item.isCompleted);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    const isPartial = !restoreParts.projects || !restoreParts.targetMajor || !restoreParts.narrativeDraft;
    if (isPartial) {
      partialRestoreVersion(versionId, restoreParts);
    } else {
      restoreVersion(versionId);
    }
    setShowRestoreConfirm(null);
    setSelectedVersion(null);
    setRestoreParts({ projects: true, targetMajor: true, narrativeDraft: true });
  };

  const getVersionDiff = (version: PortfolioVersion): VersionDiffResult => {
    const currentProjects = projects;
    const versionProjects = version.snapshot.projects;

    const projectDiffs: ProjectDiff[] = [];

    currentProjects.forEach((curr) => {
      const verProj = versionProjects.find((p) => p.id === curr.id);
      if (!verProj) {
        projectDiffs.push({ type: 'added', project: curr, changes: [] });
      } else {
        const changes = compareProjects(curr, verProj);
        if (changes.length > 0) {
          projectDiffs.push({ type: 'modified', project: curr, changes });
        }
      }
    });

    versionProjects.forEach((verProj) => {
      if (!currentProjects.find((p) => p.id === verProj.id)) {
        projectDiffs.push({ type: 'removed', project: verProj, changes: [] });
      }
    });

    const currMajorStr = targetMajor ? `${targetMajor.school} · ${targetMajor.major}` : '(未选择)';
    const verMajorStr = version.snapshot.targetMajor ? `${version.snapshot.targetMajor.school} · ${version.snapshot.targetMajor.major}` : '(未选择)';

    const currNarrative = narrativeDraft || '';
    const verNarrative = version.snapshot.narrativeDraft || '';

    return {
      projectDiffs,
      majorChanged: currMajorStr !== verMajorStr,
      oldMajor: verMajorStr,
      newMajor: currMajorStr,
      narrativeChanged: currNarrative !== verNarrative,
      oldNarrative: verNarrative,
      newNarrative: currNarrative,
      summary: {
        added: projectDiffs.filter((d) => d.type === 'added').length,
        removed: projectDiffs.filter((d) => d.type === 'removed').length,
        modified: projectDiffs.filter((d) => d.type === 'modified').length,
      },
    };
  };

  const toggleDiff = (index: number) => {
    const newSet = new Set(expandedDiffs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedDiffs(newSet);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-stone-800 mb-2"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          对照检查
        </h1>
        <p className="text-stone-500">对照提交清单，查看版本差异</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {!targetMajor ? (
            <Card className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-800 mb-2">请先选择目标专业</h3>
              <p className="text-stone-500 max-w-md mx-auto">
                在诊断页选择目标院校和专业后，这里会显示该专业的提交材料清单。
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <Card.Header>
                  <Card.Title>申请材料提交进度</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-600 mb-1">必填材料</p>
                      <p className="text-3xl font-bold text-emerald-700">
                        {completedRequired} / {requiredItems.length}
                      </p>
                      <div className="w-full h-2 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-600 mb-1">选填材料</p>
                      <p className="text-3xl font-bold text-amber-700">
                        {completedOptional} / {optionalItems.length}
                      </p>
                      <div className="w-full h-2 bg-amber-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${optionalItems.length > 0 ? (completedOptional / optionalItems.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <Card.Title>必填材料</Card.Title>
                      <p className="text-sm text-stone-500">必须提交的材料</p>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2">
                    {requiredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          item.isCompleted
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <button
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            item.isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-stone-300 hover:border-stone-400'
                          }`}
                        >
                          {item.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              item.isCompleted ? 'text-emerald-700 line-through' : 'text-stone-800'
                            }`}
                          >
                            {item.name}
                          </p>
                          <p className="text-sm text-stone-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              {optionalItems.length > 0 && (
                <Card>
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <Card.Title>选填材料</Card.Title>
                        <p className="text-sm text-stone-500">建议补充的加分材料</p>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      {optionalItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                            item.isCompleted
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <button
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              item.isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-stone-300 hover:border-stone-400'
                            }`}
                          >
                            {item.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${
                                item.isCompleted ? 'text-emerald-700 line-through' : 'text-stone-800'
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-sm text-stone-500">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-6">
          {versions.length === 0 ? (
            <Card className="text-center py-16">
              <GitCompare className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-800 mb-2">还没有保存版本</h3>
              <p className="text-stone-500 max-w-md mx-auto mb-6">
                在创建页保存作品集的不同版本，可以在这里对比差异、恢复历史版本。
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <Card.Header>
                    <Card.Title>历史版本</Card.Title>
                  </Card.Header>
                  <Card.Content className="p-0">
                    <div className="divide-y divide-stone-100">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          onClick={() => { setSelectedVersion(version); setExpandedDiffs(new Set()); }}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedVersion?.id === version.id
                              ? 'bg-indigo-50'
                              : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-800 truncate">{version.name}</p>
                              <p className="text-xs text-stone-500 mt-1">
                                {formatDate(version.createdAt)}
                              </p>
                              <p className="text-xs text-stone-400 mt-1">
                                {version.snapshot.projects.length} 个项目
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRestoreConfirm(version.id);
                                }}
                                className="p-1.5 rounded hover:bg-white text-stone-500 hover:text-indigo-600 transition-colors"
                                title="恢复此版本"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVersion(version.id);
                                  if (selectedVersion?.id === version.id) {
                                    setSelectedVersion(null);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-white text-stone-500 hover:text-red-600 transition-colors"
                                title="删除此版本"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedVersion ? (() => {
                  const diff = getVersionDiff(selectedVersion);
                  const hasChanges = diff.projectDiffs.length > 0 || diff.majorChanged || diff.narrativeChanged;

                  return (
                    <Card>
                      <Card.Header>
                        <div>
                          <Card.Title>版本对比：{selectedVersion.name}</Card.Title>
                          <p className="text-sm text-stone-500">
                            对比当前版本与 {formatDate(selectedVersion.createdAt)}
                          </p>
                        </div>
                      </Card.Header>
                      <Card.Content>
                        {!hasChanges ? (
                          <div className="text-center py-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <p className="text-stone-500">与当前版本无差异</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(diff.summary.added > 0 || diff.summary.removed > 0 || diff.summary.modified > 0) && (
                              <div className="flex gap-3 mb-4">
                                {diff.summary.added > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                                    +{diff.summary.added} 新增
                                  </span>
                                )}
                                {diff.summary.removed > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                    -{diff.summary.removed} 删除
                                  </span>
                                )}
                                {diff.summary.modified > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                                    ~{diff.summary.modified} 修改
                                  </span>
                                )}
                              </div>
                            )}

                            {diff.majorChanged && (
                              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <h4 className="text-sm font-medium text-indigo-800 mb-2">目标专业变更</h4>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-stone-600 line-through">{diff.oldMajor}</span>
                                  <span className="text-indigo-600">→</span>
                                  <span className="text-indigo-800 font-medium">{diff.newMajor}</span>
                                </div>
                              </div>
                            )}

                            {diff.narrativeChanged && (
                              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-purple-800">申请叙事变更</h4>
                                  <button
                                    onClick={() => navigate('/create?tab=narrative')}
                                    className="p-1.5 text-purple-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="去编辑叙事草稿"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {diff.oldNarrative && !diff.newNarrative && (
                                  <p className="text-sm text-red-700">叙事草稿已被删除</p>
                                )}
                                {!diff.oldNarrative && diff.newNarrative && (
                                  <div>
                                    <p className="text-xs text-emerald-700 mb-1 font-medium">新增叙事草稿</p>
                                    <p className="text-sm text-stone-700 line-clamp-3">{diff.newNarrative}</p>
                                  </div>
                                )}
                                {diff.oldNarrative && diff.newNarrative && (
                                  <div>
                                    <p className="text-xs text-amber-700 mb-2 font-medium">内容已修改</p>
                                    <div className="space-y-2">
                                      <div className="p-2 bg-red-50 border border-red-100 rounded text-sm text-stone-700 line-clamp-2">
                                        <span className="text-xs text-red-600 font-medium mr-1">旧：</span>{diff.oldNarrative}
                                      </div>
                                      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-sm text-stone-700 line-clamp-2">
                                        <span className="text-xs text-emerald-600 font-medium mr-1">新：</span>{diff.newNarrative}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {diff.projectDiffs.map((item, index) => (
                              <div
                                key={index}
                                className={`rounded-lg border overflow-hidden ${
                                  item.type === 'added'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : item.type === 'removed'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-amber-50 border-amber-200'
                                }`}
                              >
                                <button
                                  onClick={() => toggleDiff(index)}
                                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/50 transition-colors"
                                >
                                  {item.type === 'modified' && item.changes.length > 0 && (
                                    expandedDiffs.has(index) ? (
                                      <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                    )
                                  )}
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                                      item.type === 'added'
                                        ? 'bg-emerald-200 text-emerald-800'
                                        : item.type === 'removed'
                                        ? 'bg-red-200 text-red-800'
                                        : 'bg-amber-200 text-amber-800'
                                    }`}
                                  >
                                    {item.type === 'added' ? '新增' : item.type === 'removed' ? '删除' : '修改'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-stone-800">
                                      {item.project.title || '未命名项目'}
                                    </p>
                                    <p className="text-sm text-stone-500">{item.project.category}</p>
                                  </div>
                                  {item.type === 'modified' && (
                                    <span className="text-xs text-stone-500 flex-shrink-0">
                                      {item.changes.length} 处变更
                                    </span>
                                  )}
                                  {item.type !== 'removed' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigate(`/create?editProject=${item.project.id}`); }}
                                      className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex-shrink-0"
                                      title="去编辑此项目"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </button>

                                {item.type === 'modified' && expandedDiffs.has(index) && item.changes.length > 0 && (
                                  <div className="px-4 pb-4 border-t border-amber-100">
                                    <div className="mt-3 space-y-2">
                                      {item.changes.map((change, ci) => (
                                        <div key={ci} className="p-3 bg-white rounded border border-stone-200">
                                          <p className="text-xs font-medium text-indigo-700 mb-1">{change.field}</p>
                                          <div className="space-y-1">
                                            <div className="flex items-start gap-2 text-xs">
                                              <span className="text-red-500 flex-shrink-0">旧</span>
                                              <span className="text-stone-600 break-all">{change.oldVal}</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-xs">
                                              <span className="text-emerald-600 flex-shrink-0">新</span>
                                              <span className="text-stone-800 font-medium break-all">{change.newVal}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-stone-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-stone-50 rounded-lg">
                              <p className="text-stone-500 mb-1">历史版本项目数</p>
                              <p className="text-2xl font-bold text-stone-800">
                                {selectedVersion.snapshot.projects.length}
                              </p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg">
                              <p className="text-indigo-600 mb-1">当前版本项目数</p>
                              <p className="text-2xl font-bold text-indigo-700">
                                {projects.length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  );
                })() : (
                  <Card className="text-center py-16">
                    <GitCompare className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-stone-800 mb-2">选择一个版本进行对比</h3>
                    <p className="text-stone-500 max-w-md mx-auto">
                      从左侧列表选择一个历史版本，查看与当前版本的差异。
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowRestoreConfirm(null); setRestoreParts({ projects: true, targetMajor: true, narrativeDraft: true }); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-2">恢复版本</h3>
            <p className="text-sm text-stone-500 mb-4">
              选择要恢复的内容，未勾选的部分将保持当前状态不变。
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreParts.projects}
                  onChange={(e) => setRestoreParts({ ...restoreParts, projects: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium text-stone-800">项目列表与顺序</p>
                  <p className="text-xs text-stone-500">恢复该版本的所有项目内容</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreParts.targetMajor}
                  onChange={(e) => setRestoreParts({ ...restoreParts, targetMajor: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium text-stone-800">目标专业</p>
                  <p className="text-xs text-stone-500">恢复该版本的目标院校和专业</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreParts.narrativeDraft}
                  onChange={(e) => setRestoreParts({ ...restoreParts, narrativeDraft: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium text-stone-800">申请叙事草稿</p>
                  <p className="text-xs text-stone-500">恢复该版本的叙事草稿内容</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setShowRestoreConfirm(null); setRestoreParts({ projects: true, targetMajor: true, narrativeDraft: true }); }}>
                取消
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRestoreVersion(showRestoreConfirm)}
                disabled={!restoreParts.projects && !restoreParts.targetMajor && !restoreParts.narrativeDraft}
              >
                确认恢复
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
