import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { DiagnosisResult, PortfolioState } from '../types';

export type ReportType = 'full' | 'basic' | 'narrative';

const reportTypeLabels: Record<ReportType, string> = {
  full: '作品集诊断报告',
  basic: '作品集整理报告',
  narrative: '申请叙事建议报告',
};

function scoreColor(score: number) {
  if (score >= 85) return '#059669';
  if (score >= 70) return '#d97706';
  if (score >= 55) return '#ea580c';
  return '#dc2626';
}

function scoreLabel(score: number) {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '中等';
  return '待提升';
}

function buildHeader(title: string, date: string, targetMajor: { school: string; major: string } | undefined): string {
  return `
    <div style="text-align:center;margin-bottom:36px;border-bottom:3px solid #1e3a5f;padding-bottom:24px;">
      <h1 style="font-size:28px;font-weight:800;color:#1e3a5f;margin:0 0 8px 0;font-family:'Noto Serif SC',serif;">${title}</h1>
      <p style="font-size:13px;color:#78716c;margin:0;">生成日期：${date}</p>
      ${targetMajor ? `<p style="font-size:14px;color:#1e3a5f;margin:8px 0 0 0;font-weight:600;">目标：${targetMajor.school} · ${targetMajor.major}</p>` : ''}
    </div>
  `;
}

function buildDiagnosisSection(diagnosisResult: DiagnosisResult, narrativeDraft?: string): string {
  const overallColor = scoreColor(diagnosisResult.overallScore);

  const gapsHTML = diagnosisResult.abilityGaps.map(gap => {
    const barWidth = (gap.currentLevel / 5) * 100;
    const reqWidth = (gap.requiredLevel / 5) * 100;
    return `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:600;font-size:13px;color:#1c1917;">${gap.name}</span>
          <span style="font-size:12px;color:${gap.gap > 0 ? '#dc2626' : '#059669'};font-weight:600;">
            ${gap.gap > 0 ? `缺口 ${gap.gap}` : '达标'}
          </span>
        </div>
        <div style="position:relative;height:18px;background:#f5f5f4;border-radius:4px;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;height:100%;width:${reqWidth}%;background:#e7e5e4;border-radius:4px;"></div>
          <div style="position:absolute;top:0;left:0;height:100%;width:${barWidth}%;background:${gap.gap > 0 ? '#f59e0b' : '#10b981'};border-radius:4px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;">
          <span style="font-size:11px;color:#78716c;">当前 ${gap.currentLevel}</span>
          <span style="font-size:11px;color:#78716c;">要求 ${gap.requiredLevel}</span>
        </div>
      </div>
    `;
  }).join('');

  const narrativeHTML = diagnosisResult.narrativeEvaluation.feedback.map(fb =>
    `<li style="margin-bottom:6px;font-size:12px;color:#44403c;line-height:1.6;">${fb}</li>`
  ).join('');

  const materialHTML = diagnosisResult.materialChecks.map(check => {
    const completedCount = check.result.missingItems.length === 0;
    const missingNames = check.result.missingItems.map(m => m.name).join('、');
    return `
      <div style="margin-bottom:14px;padding:12px;border:1px solid #e7e5e4;border-radius:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:13px;color:#1c1917;">${check.projectTitle || '未命名项目'}</span>
          <span style="font-size:13px;font-weight:700;color:${scoreColor(check.result.completeness)};">${check.result.completeness}%</span>
        </div>
        ${!completedCount ? `<p style="margin-top:6px;font-size:12px;color:#dc2626;">缺失：${missingNames}</p>` : '<p style="margin-top:6px;font-size:12px;color:#059669;">素材完整</p>'}
        ${check.result.suggestions.length > 0 ? `<div style="margin-top:6px;">${check.result.suggestions.map(s => `<p style="font-size:11px;color:#92400e;margin:2px 0;">• ${s}</p>`).join('')}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">一、综合评分</h2>
      <div style="text-align:center;padding:20px 0;">
        <div style="display:inline-block;width:90px;height:90px;border-radius:50%;background:${overallColor}15;display:inline-flex;align-items:center;justify-content:center;">
          <span style="font-size:36px;font-weight:800;color:${overallColor};">${diagnosisResult.overallScore}</span>
        </div>
        <div style="margin-top:8px;font-size:18px;font-weight:700;color:${overallColor};">${scoreLabel(diagnosisResult.overallScore)}</div>
        <div style="margin-top:4px;font-size:12px;color:#78716c;">
          ${diagnosisResult.overallScore >= 85 ? '作品集准备充分，能力展示全面' : diagnosisResult.overallScore >= 70 ? '基础扎实，部分能力需要加强' : diagnosisResult.overallScore >= 55 ? '有一定基础，但存在明显缺口' : '需要大幅完善作品集'}
        </div>
      </div>
    </div>

    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">二、能力缺口分析</h2>
      ${gapsHTML}
    </div>

    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">三、叙事连贯性评估</h2>
      <div style="margin-bottom:8px;font-size:14px;color:#1c1917;">
        叙事得分：<strong style="color:${scoreColor(diagnosisResult.narrativeEvaluation.score)};">${diagnosisResult.narrativeEvaluation.score}</strong> / 100
      </div>
      <ul style="padding-left:18px;margin:0;">${narrativeHTML}</ul>
      ${narrativeDraft && narrativeDraft.trim() ? `
      <div style="margin-top:14px;padding:12px;background:#f5f5f4;border-radius:8px;border:1px solid #e7e5e4;">
        <p style="font-size:11px;font-weight:600;color:#1e3a5f;margin:0 0 6px 0;">申请叙事草稿：</p>
        <p style="font-size:11px;color:#44403c;margin:0;line-height:1.8;white-space:pre-wrap;">${narrativeDraft}</p>
      </div>
      ` : ''}
    </div>

    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">四、素材完整性检查</h2>
      ${materialHTML}
    </div>
  `;
}

function buildProjectsSection(projects: { title: string; description: string; category: string; process: Record<string, string>; materials: { name: string; isComplete: boolean }[] }[], sectionNumber: string): string {
  const processLabels: { key: string; label: string }[] = [
    { key: 'motivation', label: '项目动机' },
    { key: 'research', label: '调研分析' },
    { key: 'ideation', label: '方案构思' },
    { key: 'implementation', label: '设计实现' },
    { key: 'reflection', label: '反思总结' },
  ];

  const projectsHTML = projects.map((project, index) => {
    const processEntries = processLabels.map(({ key, label }) => {
      const val = project.process[key];
      return val ? `<div style="margin-bottom:8px;"><span style="font-size:11px;font-weight:600;color:#1e3a5f;">${label}：</span><span style="font-size:11px;color:#44403c;line-height:1.5;">${val}</span></div>` : '';
    }).join('');

    const materialsHTML = project.materials.length > 0
      ? project.materials.map(m =>
          `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;font-size:10px;border-radius:4px;background:${m.isComplete ? '#d1fae5' : '#fee2e2'};color:${m.isComplete ? '#065f46' : '#991b1b'};">${m.isComplete ? '✓' : '○'} ${m.name}</span>`
        ).join('')
      : '<span style="font-size:11px;color:#a8a29e;">暂无素材</span>';

    return `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #e7e5e4;border-radius:8px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#1e3a5f;color:#fff;font-size:12px;font-weight:700;">${index + 1}</span>
          <span style="font-size:16px;font-weight:700;color:#1c1917;">${project.title || '未命名项目'}</span>
          <span style="font-size:11px;padding:2px 8px;background:#eef3fb;color:#1e3a5f;border-radius:4px;">${project.category}</span>
        </div>
        ${project.description ? `<p style="font-size:12px;color:#57534e;margin:0 0 10px 0;line-height:1.6;">${project.description}</p>` : ''}
        ${processEntries ? `<div style="margin-bottom:10px;padding-top:8px;border-top:1px dashed #e7e5e4;">${processEntries}</div>` : ''}
        <div style="padding-top:8px;border-top:1px dashed #e7e5e4;">
          <span style="font-size:11px;font-weight:600;color:#78716c;">素材：</span>
          ${materialsHTML}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">${sectionNumber}、项目列表</h2>
      ${projectsHTML.length > 0 ? projectsHTML : '<p style="font-size:13px;color:#a8a29e;">暂无项目</p>'}
    </div>
  `;
}

function buildBackgroundSection(background: { education: string; experience: string; skills: string[] }, sectionNumber: string): string {
  if (!background.education && !background.experience && background.skills.length === 0) return '';
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">${sectionNumber}、个人背景</h2>
      ${background.education ? `<div style="margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#1e3a5f;">教育背景：</span><p style="font-size:12px;color:#44403c;margin:4px 0 0 0;white-space:pre-wrap;">${background.education}</p></div>` : ''}
      ${background.experience ? `<div style="margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#1e3a5f;">相关经历：</span><p style="font-size:12px;color:#44403c;margin:4px 0 0 0;white-space:pre-wrap;">${background.experience}</p></div>` : ''}
      ${background.skills.length > 0 ? `<div><span style="font-size:12px;font-weight:600;color:#1e3a5f;">技能清单：</span><span style="font-size:12px;color:#44403c;">${background.skills.join('、')}</span></div>` : ''}
    </div>
  `;
}

function buildNarrativeDraftSection(narrativeDraft: string, sectionNumber: string): string {
  if (!narrativeDraft || !narrativeDraft.trim()) return '';
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">${sectionNumber}、申请叙事草稿</h2>
      <div style="padding:12px;background:#f5f5f4;border-radius:8px;border:1px solid #e7e5e4;">
        <p style="font-size:12px;color:#44403c;margin:0;line-height:1.8;white-space:pre-wrap;">${narrativeDraft}</p>
      </div>
    </div>
  `;
}

function buildSubmissionSection(items: { name: string; description: string; isRequired: boolean; isCompleted: boolean }[] | undefined, sectionNumber: string): string {
  if (!items || items.length === 0) return '';
  const html = items.map(item =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-size:13px;color:${item.isCompleted ? '#059669' : '#a8a29e'};">${item.isCompleted ? '✓' : '○'}</span>
      <span style="font-size:12px;font-weight:${item.isRequired ? '600' : '400'};color:#1c1917;">${item.name}</span>
      <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${item.isRequired ? '#fee2e2' : '#fef3c7'};color:${item.isRequired ? '#991b1b' : '#92400e'};">${item.isRequired ? '必填' : '选填'}</span>
      <span style="font-size:11px;color:#78716c;">${item.description}</span>
    </div>`
  ).join('');
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">${sectionNumber}、提交材料清单</h2>
      ${html}
    </div>
  `;
}

function createReportHTML(portfolioState: PortfolioState, diagnosisResult: DiagnosisResult | null, reportType: ReportType): string {
  const { projects, background, targetMajor, narrativeDraft } = portfolioState;
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const projData = sortedProjects.map(p => ({
    title: p.title,
    description: p.description,
    category: p.category,
    process: p.process as unknown as Record<string, string>,
    materials: p.materials.map(m => ({ name: m.name, isComplete: m.isComplete })),
  }));

  let body = '';

  if (reportType === 'narrative') {
    const title = reportTypeLabels.narrative;
    body = buildHeader(title, date, targetMajor);

    if (diagnosisResult) {
      const narScoreColor = scoreColor(diagnosisResult.narrativeEvaluation.score);
      const narFeedbackHTML = diagnosisResult.narrativeEvaluation.feedback.map(fb => {
        const isPos = fb.includes('清晰') || fb.includes('充分') || fb.includes('完整') || fb.includes('结合') || fb.includes('展现') || fb.includes('提及') || fb.includes('有效') || fb.includes('引用了');
        const isWarn = fb.includes('未提及') || fb.includes('未引用') || fb.includes('未利用') || fb.includes('未点出') || fb.includes('建议') || fb.includes('不足') || fb.includes('简短') || fb.includes('尚未') || fb.includes('泛泛');
        const icon = isPos ? '✓' : isWarn ? '✗' : '•';
        const color = isPos ? '#059669' : isWarn ? '#dc2626' : '#78716c';
        return `<li style="margin-bottom:8px;font-size:12px;color:#44403c;line-height:1.6;"><span style="color:${color};font-weight:700;margin-right:6px;">${icon}</span>${fb}</li>`;
      }).join('');

      body += `
        <div style="margin-bottom:28px;">
          <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">一、叙事连贯性评分</h2>
          <div style="text-align:center;padding:16px 0;">
            <div style="display:inline-block;width:80px;height:80px;border-radius:50%;background:${narScoreColor}15;display:inline-flex;align-items:center;justify-content:center;">
              <span style="font-size:32px;font-weight:800;color:${narScoreColor};">${diagnosisResult.narrativeEvaluation.score}</span>
            </div>
            <div style="margin-top:6px;font-size:16px;font-weight:700;color:${narScoreColor};">${scoreLabel(diagnosisResult.narrativeEvaluation.score)}</div>
          </div>
        </div>

        <div style="margin-bottom:28px;">
          <h2 style="font-size:18px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;">二、叙事评估详情</h2>
          <ul style="padding-left:18px;margin:0;">${narFeedbackHTML}</ul>
        </div>
      `;
    } else {
      body += `
        <div style="margin-bottom:28px;padding:16px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;">
          <p style="font-size:13px;color:#92400e;margin:0;">尚未完成诊断，无法提供叙事评估。建议先在诊断页完成诊断后再导出叙事建议报告。</p>
        </div>
      `;
    }

    body += buildNarrativeDraftSection(narrativeDraft, diagnosisResult ? '三' : '一');
    body += buildBackgroundSection(background, diagnosisResult ? (narrativeDraft && narrativeDraft.trim() ? '四' : '三') : (narrativeDraft && narrativeDraft.trim() ? '二' : '一'));

  } else if (reportType === 'full' && diagnosisResult) {
    body = buildHeader(reportTypeLabels.full, date, targetMajor);
    body += buildDiagnosisSection(diagnosisResult, narrativeDraft);
    body += buildProjectsSection(projData, '五');
    body += buildBackgroundSection(background, '六');
    body += buildNarrativeDraftSection(narrativeDraft, '七');
    body += buildSubmissionSection(targetMajor?.submissionItems, '八');

  } else {
    body = buildHeader(reportTypeLabels.basic, date, targetMajor);
    body += `
      <div style="margin-bottom:28px;padding:16px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;">
        <p style="font-size:13px;color:#92400e;margin:0;">尚未完成诊断，以下为作品集基础整理报告。建议在诊断页完成诊断后导出完整报告。</p>
      </div>
    `;
    body += buildProjectsSection(projData, '一');
    body += buildBackgroundSection(background, '二');
    body += buildNarrativeDraftSection(narrativeDraft, '三');
    body += buildSubmissionSection(targetMajor?.submissionItems, '四');
  }

  return `
    <div id="pdf-report-content" style="font-family:'Noto Sans SC','Microsoft YaHei',sans-serif;color:#1c1917;line-height:1.6;padding:40px 48px;background:#fff;width:794px;">
      ${body}
    </div>
  `;
}

export async function exportToPDF(
  portfolioState: PortfolioState,
  diagnosisResult: DiagnosisResult | null,
  reportType: ReportType = 'full'
): Promise<void> {
  const html = createReportHTML(portfolioState, diagnosisResult, reportType);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  container.appendChild(wrapper);

  await new Promise(resolve => setTimeout(resolve, 200));

  const contentEl = wrapper.querySelector('#pdf-report-content') as HTMLElement;
  if (!contentEl) {
    document.body.removeChild(container);
    throw new Error('PDF content element not found');
  }

  const canvas = await html2canvas(contentEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = -(imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const prefix = reportTypeLabels[reportType];
  pdf.save(`${prefix}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`);
}

export async function exportHTMLToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
