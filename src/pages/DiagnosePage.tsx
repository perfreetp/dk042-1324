import { useState } from 'react';
import { ChevronDown, Activity, Target, AlertTriangle, FileCheck, Layout } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { majorsData } from '../data/majors';
import { useDiagnosis } from '../hooks/useDiagnosis';
import AbilityRadarChart from '../components/diagnose/AbilityRadarChart';
import AbilityGapList from '../components/diagnose/AbilityGapList';
import MaterialCheckList from '../components/diagnose/MaterialCheckList';
import StructurePreview from '../components/diagnose/StructurePreview';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '../utils/io';
import type { TargetMajor } from '../types';

export default function DiagnosePage() {
  const projects = usePortfolioStore((state) => state.projects);
  const targetMajor = usePortfolioStore((state) => state.targetMajor);
  const setTargetMajor = usePortfolioStore((state) => state.setTargetMajor);

  const { diagnosisResult, isDiagnosing, runFullDiagnosis, priorityGaps, canDiagnose } = useDiagnosis();

  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'ability' | 'material' | 'structure'>('ability');

  const handleSelectMajor = (major: TargetMajor) => {
    setTargetMajor(major);
    setShowMajorDropdown(false);
  };

  const tabs = [
    { key: 'ability', label: '能力缺口', icon: AlertTriangle },
    { key: 'material', label: '素材检查', icon: FileCheck },
    { key: 'structure', label: '结构预览', icon: Layout },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-stone-800 mb-2"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            智能诊断
          </h1>
          <p className="text-stone-500">对照目标专业要求，发现能力缺口</p>
        </div>
        <Button onClick={runFullDiagnosis} disabled={!canDiagnose || isDiagnosing} loading={isDiagnosing}>
          <Activity className="w-4 h-4" />
          {isDiagnosing ? '诊断中...' : '重新诊断'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <Card.Title>目标专业选择</Card.Title>
                  <p className="text-sm text-stone-500">选择你的目标院校和专业</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="relative">
                <button
                  onClick={() => setShowMajorDropdown(!showMajorDropdown)}
                  disabled={projects.length === 0}
                  className="w-full flex items-center justify-between px-4 py-3 border border-stone-300 rounded-lg text-left hover:border-stone-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {targetMajor ? (
                    <div>
                      <p className="font-medium text-stone-800">
                        {targetMajor.school} · {targetMajor.major}
                      </p>
                      <p className="text-sm text-stone-500 line-clamp-1">
                        {targetMajor.description}
                      </p>
                    </div>
                  ) : projects.length === 0 ? (
                    <span className="text-stone-400">请先在创建页添加项目</span>
                  ) : (
                    <span className="text-stone-500">请选择目标院校和专业</span>
                  )}
                  <ChevronDown className="w-5 h-5 text-stone-400" />
                </button>

                {showMajorDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {majorsData.map((major) => (
                      <button
                        key={major.id}
                        onClick={() => handleSelectMajor(major)}
                        className={`w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0 ${
                          targetMajor?.id === major.id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <p className="font-medium text-stone-800">
                          {major.school} · {major.major}
                        </p>
                        <p className="text-sm text-stone-500 line-clamp-1">{major.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {targetMajor && (
                <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <h4 className="font-medium text-stone-800 mb-2">招生偏好</h4>
                  <p className="text-sm text-stone-600">{targetMajor.admissionPreferences}</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <Card.Header>
              <Card.Title>综合评分</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col items-center justify-center h-full">
              {diagnosisResult ? (
                <>
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${getScoreBgColor(
                      diagnosisResult.overallScore
                    )}`}
                  >
                    <span
                      className={`text-5xl font-bold ${getScoreColor(diagnosisResult.overallScore)}`}
                    >
                      {diagnosisResult.overallScore}
                    </span>
                  </div>
                  <p
                    className={`text-xl font-semibold mb-2 ${getScoreColor(
                      diagnosisResult.overallScore
                    )}`}
                  >
                    {getScoreLabel(diagnosisResult.overallScore)}
                  </p>
                  <p className="text-sm text-stone-500 text-center">
                    {diagnosisResult.overallScore >= 85
                      ? '作品集准备充分，继续保持！'
                      : diagnosisResult.overallScore >= 70
                      ? '基础扎实，部分能力需要加强'
                      : diagnosisResult.overallScore >= 55
                      ? '有一定基础，但存在明显缺口'
                      : '需要大幅完善作品集'}
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">暂无诊断结果</p>
                  <p className="text-sm text-stone-400">
                    {!targetMajor ? '请先选择目标专业' : '请添加项目后开始诊断'}
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      {diagnosisResult && (
        <>
          {priorityGaps.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50/50">
              <Card.Header className="border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <Card.Title>待改进重点</Card.Title>
                    <p className="text-sm text-stone-500">优先弥补以下能力缺口</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-2">
                  {priorityGaps.slice(0, 3).map((gap) => (
                    <span
                      key={gap.name}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 rounded-full"
                    >
                      <span className="font-medium text-stone-800">{gap.name}</span>
                      <span className="text-amber-600 font-semibold">+{gap.gap}</span>
                    </span>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>能力雷达图</Card.Title>
              </Card.Header>
              <Card.Content>
                <AbilityRadarChart abilityGaps={diagnosisResult.abilityGaps} />
              </Card.Content>
            </Card>

            <div>
              <div className="flex gap-1 mb-4 border-b border-stone-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
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

              <div className="min-h-[400px]">
                {activeTab === 'ability' && (
                  <AbilityGapList abilityGaps={diagnosisResult.abilityGaps} />
                )}
                {activeTab === 'material' && (
                  <MaterialCheckList checks={diagnosisResult.materialChecks} />
                )}
                {activeTab === 'structure' && <StructurePreview projects={projects} />}
              </div>
            </div>
          </div>
        </>
      )}

      {!diagnosisResult && (
        <Card className="text-center py-16">
          <Activity className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-stone-800 mb-2">开始诊断你的作品集</h3>
          <p className="text-stone-500 max-w-md mx-auto mb-6">
            {!targetMajor
              ? '请先选择你的目标院校和专业，系统将根据该专业的招生要求对你的作品集进行全面诊断。'
              : projects.length === 0
              ? '请先在创建页添加你的项目，然后进行诊断。'
              : '点击右上角的"开始诊断"按钮，系统将分析你的作品集并生成详细报告。'}
          </p>
          {canDiagnose && (
            <Button onClick={runFullDiagnosis} size="lg" loading={isDiagnosing}>
              <Activity className="w-5 h-5" />
              开始诊断
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
