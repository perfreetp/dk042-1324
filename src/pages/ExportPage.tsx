import { useState, useRef } from 'react';
import { Download, Upload, FileJson, FileText, HardDrive, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useDiagnosis } from '../hooks/useDiagnosis';
import { exportToPDF, type ReportType } from '../utils/pdf';
import { exportToJSON, importFromJSON, validatePortfolioData, formatDate } from '../utils/io';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { PortfolioState } from '../types';

export default function ExportPage() {
  const store = usePortfolioStore();
  const { diagnosisResult } = useDiagnosis();
  const importData = usePortfolioStore((state) => state.importData);
  const resetAll = usePortfolioStore((state) => state.resetAll);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(diagnosisResult ? 'full' : 'basic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const portfolioState: PortfolioState = {
    projects: store.projects,
    background: store.background,
    targetMajor: store.targetMajor,
    versions: store.versions,
    narrativeDraft: store.narrativeDraft,
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF(portfolioState, diagnosisResult, selectedReportType);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportJSON = () => {
    exportToJSON(portfolioState);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJSON(file);
      if (validatePortfolioData(data)) {
        importData(data);
        setImportStatus('success');
        setImportMessage('数据导入成功！');
      } else {
        setImportStatus('error');
        setImportMessage('文件格式不正确，请检查数据结构');
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : '导入失败');
    }

    setTimeout(() => {
      setImportStatus('idle');
      setImportMessage('');
    }, 3000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    resetAll();
    setShowResetConfirm(false);
  };

  const totalProjects = store.projects.length;
  const totalVersions = store.versions.length;
  const hasTargetMajor = !!store.targetMajor;
  const hasDiagnosis = !!diagnosisResult;
  const lastSaved = localStorage.getItem('portfolio-diagnosis-storage')
    ? new Date().toLocaleDateString('zh-CN')
    : '暂无';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-stone-800 mb-2"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          导出与备份
        </h1>
        <p className="text-stone-500">导出诊断报告、备份数据、离线保存</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <Card.Content className="text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{totalProjects}</p>
            <p className="text-sm text-stone-500">项目数量</p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HardDrive className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{totalVersions}</p>
            <p className="text-sm text-stone-500">历史版本</p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="text-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${hasTargetMajor ? 'bg-amber-50' : 'bg-stone-50'}`}>
              <CheckCircle2 className={`w-6 h-6 ${hasTargetMajor ? 'text-amber-600' : 'text-stone-400'}`} />
            </div>
            <p className="text-2xl font-bold text-stone-800">
              {hasTargetMajor ? '✓' : '—'}
            </p>
            <p className="text-sm text-stone-500">目标专业</p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="text-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${hasDiagnosis ? 'bg-blue-50' : 'bg-stone-50'}`}>
              <CheckCircle2 className={`w-6 h-6 ${hasDiagnosis ? 'text-blue-600' : 'text-stone-400'}`} />
            </div>
            <p className="text-2xl font-bold text-stone-800">
              {hasDiagnosis ? '✓' : '—'}
            </p>
            <p className="text-sm text-stone-500">诊断报告</p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover>
          <Card.Header>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <Card.Title>导出报告</Card.Title>
                <p className="text-sm text-stone-500">选择报告类型并生成 PDF</p>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3 mb-4">
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-stone-50 border-indigo-200 bg-indigo-50/50">
                <input
                  type="radio"
                  name="reportType"
                  value="full"
                  checked={selectedReportType === 'full'}
                  onChange={() => setSelectedReportType('full')}
                  disabled={!diagnosisResult}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-sm text-stone-800">完整诊断报告</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">综合评分、能力缺口、叙事评估、素材检查、项目列表、提交清单</p>
                  {!diagnosisResult && <p className="text-xs text-amber-600 mt-1">需要先完成诊断</p>}
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-stone-50 border-stone-200">
                <input
                  type="radio"
                  name="reportType"
                  value="basic"
                  checked={selectedReportType === 'basic'}
                  onChange={() => setSelectedReportType('basic')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-stone-600" />
                    <span className="font-medium text-sm text-stone-800">基础整理报告</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">项目列表、个人背景、叙事草稿、提交清单</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-stone-50 border-stone-200">
                <input
                  type="radio"
                  name="reportType"
                  value="narrative"
                  checked={selectedReportType === 'narrative'}
                  onChange={() => setSelectedReportType('narrative')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-stone-600" />
                    <span className="font-medium text-sm text-stone-800">申请叙事建议报告</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">叙事评分、评估详情、草稿原文、个人背景</p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">
                {selectedReportType === 'full' && diagnosisResult ? '完整诊断报告已就绪' : selectedReportType === 'basic' ? '基础整理报告已就绪' : '叙事建议报告已就绪'}
              </span>
              <Button
                onClick={handleExportPDF}
                disabled={isExportingPDF || store.projects.length === 0 || (selectedReportType === 'full' && !diagnosisResult)}
                loading={isExportingPDF}
              >
                <Download className="w-4 h-4" />
                导出 PDF
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card hover>
          <Card.Header>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center">
                <FileJson className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <Card.Title>导出数据备份</Card.Title>
                <p className="text-sm text-stone-500">导出所有数据为 JSON 格式</p>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-stone-600 mb-4">
              导出完整的作品集数据，包括项目、背景、版本历史等，可以在其他设备上导入恢复。
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">
                上次备份：{lastSaved}
              </span>
              <Button variant="secondary" onClick={handleExportJSON}>
                <Download className="w-4 h-4" />
                导出 JSON
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card hover>
          <Card.Header>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <Card.Title>导入数据</Card.Title>
                <p className="text-sm text-stone-500">从 JSON 文件恢复作品集数据</p>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-stone-600 mb-4">
              导入之前导出的 JSON 数据文件，恢复作品集内容。当前数据将被覆盖。
            </p>
            <div className="flex items-center justify-between">
              {importStatus !== 'idle' && (
                <div className={`flex items-center gap-2 text-sm ${importStatus === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {importStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {importMessage}
                </div>
              )}
              {importStatus === 'idle' && <span className="text-xs text-stone-500">选择 JSON 数据文件</span>}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" onClick={handleImportClick}>
                  <Upload className="w-4 h-4" />
                  选择文件
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card hover className="border-red-100">
          <Card.Header className="border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <Card.Title className="text-red-700">重置所有数据</Card.Title>
                <p className="text-sm text-stone-500">清空所有作品集内容</p>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-stone-600 mb-4">
              清空所有项目、背景信息、目标专业选择和版本历史。此操作不可撤销，请谨慎操作。
            </p>
            <div className="flex items-center justify-end">
              <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
                重置数据
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="mt-8 bg-stone-50">
        <Card.Header>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-200 rounded flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <Card.Title>离线存储说明</Card.Title>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3 text-sm text-stone-600">
            <p>
              <strong>✓ 完全离线：</strong>所有数据都保存在您的浏览器本地存储中，不会上传到任何服务器。
            </p>
            <p>
              <strong>✓ 数据安全：</strong>您的数据完全由您掌控，建议定期导出 JSON 备份以防浏览器数据丢失。
            </p>
            <p>
              <strong>✓ 隐私保护：</strong>本工具不收集任何个人信息，所有操作都在本地完成。
            </p>
            <p>
              <strong>⚠️ 注意：</strong>清除浏览器缓存或更换设备会导致数据丢失，请务必导出备份。
            </p>
          </div>
        </Card.Content>
      </Card>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800">确认重置所有数据</h3>
                <p className="text-sm text-stone-500">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 mb-6">
              确定要清空所有数据吗？这将删除所有项目、背景信息、目标专业选择和版本历史。
              建议先导出数据备份。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleReset}>
                确认重置
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
