import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { DiagnosisResult, PortfolioState, Project } from '../types';

export async function exportToPDF(
  portfolioState: PortfolioState,
  diagnosisResult: DiagnosisResult | null
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('作品集诊断报告', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const date = new Date().toLocaleDateString('zh-CN');
  doc.text(`生成日期：${date}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (portfolioState.targetMajor) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`目标院校：${portfolioState.targetMajor.school}`, margin, yPosition);
    yPosition += 8;
    doc.text(`目标专业：${portfolioState.targetMajor.major}`, margin, yPosition);
    yPosition += 15;
  }

  if (diagnosisResult) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('一、综合评分', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`综合得分：${diagnosisResult.overallScore} / 100`, margin, yPosition);
    yPosition += 8;

    let evaluation = '';
    if (diagnosisResult.overallScore >= 85) {
      evaluation = '优秀：作品集准备充分，能力展示全面，符合目标专业要求。';
    } else if (diagnosisResult.overallScore >= 70) {
      evaluation = '良好：作品集基础扎实，部分能力需要补充加强。';
    } else if (diagnosisResult.overallScore >= 55) {
      evaluation = '中等：作品集有一定基础，但存在明显能力缺口需要弥补。';
    } else {
      evaluation = '待提升：作品集需要大幅完善，建议重点补充核心能力项目。';
    }
    doc.text(evaluation, margin, yPosition);
    yPosition += 15;

    if (yPosition + 30 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('二、能力缺口分析', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    diagnosisResult.abilityGaps.forEach((gap) => {
      if (yPosition + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      const gapText = gap.gap > 0 ? '⚠️' : '✓';
      doc.text(
        `${gapText} ${gap.name}：当前 ${gap.currentLevel} / 要求 ${gap.requiredLevel}${gap.gap > 0 ? `，缺口 ${gap.gap}` : ''}`,
        margin + 5,
        yPosition
      );
      yPosition += 7;
    });
    yPosition += 8;

    if (yPosition + 30 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('三、叙事连贯性评估', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`叙事得分：${diagnosisResult.narrativeEvaluation.score} / 100`, margin, yPosition);
    yPosition += 8;

    diagnosisResult.narrativeEvaluation.feedback.forEach((fb) => {
      if (yPosition + 10 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(`• ${fb}`, margin + 5, yPosition);
      yPosition += 7;
    });
    yPosition += 8;

    if (diagnosisResult.materialChecks.length > 0) {
      if (yPosition + 30 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('四、素材完整性检查', margin, yPosition);
      yPosition += 12;

      diagnosisResult.materialChecks.forEach((check) => {
        if (yPosition + 15 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${check.projectTitle}（完整度：${check.result.completeness}%）`, margin, yPosition);
        yPosition += 7;

        if (check.result.missingItems.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('缺失素材：', margin + 5, yPosition);
          yPosition += 6;
          check.result.missingItems.forEach((item) => {
            if (yPosition + 6 > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(`  - ${item.name}`, margin + 8, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 5;
      });
    }
  }

  if (yPosition + 30 > pageHeight - margin) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('五、项目列表', margin, yPosition);
  yPosition += 12;

  portfolioState.projects
    .sort((a, b) => a.order - b.order)
    .forEach((project, index) => {
      if (yPosition + 35 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${project.title || '未命名项目'}`, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const categoryText = `类型：${project.category}`;
      const materialsComplete = project.materials.filter((m) => m.isComplete).length;
      const materialsTotal = project.materials.length;
      const materialText = `素材：${materialsComplete}/${materialsTotal}`;

      doc.text(categoryText, margin + 5, yPosition);
      doc.text(materialText, margin + 60, yPosition);
      yPosition += 6;

      if (project.description) {
        const descLines = doc.splitTextToSize(project.description, pageWidth - margin * 2 - 5);
        descLines.forEach((line: string) => {
          if (yPosition + 5 > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      }
      yPosition += 5;
    });

  if (portfolioState.targetMajor?.submissionItems) {
    if (yPosition + 30 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('六、提交材料清单', margin, yPosition);
    yPosition += 12;

    portfolioState.targetMajor.submissionItems.forEach((item) => {
      if (yPosition + 10 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      const status = item.isCompleted ? '✓' : '○';
      const required = item.isRequired ? '[必填]' : '[选填]';
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${status} ${required} ${item.name}`, margin, yPosition);
      yPosition += 7;
    });
  }

  doc.save(`作品集诊断报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`);
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
