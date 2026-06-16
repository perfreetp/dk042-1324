import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  AbilityRequirement,
  AbilityGap,
  MaterialCheckResult,
  Material,
  NarrativeEvaluation,
  DiagnosisResult,
} from '../types';

export function calculateAbilityGap(
  projects: Project[],
  requirements: AbilityRequirement[]
): AbilityGap[] {
  const abilityEvidence: Record<string, number> = {};

  projects.forEach((project) => {
    const categoryScore = getCategoryAbilityScore(project.category);
    const processScore = getProcessCompleteness(project);
    const materialScore = getMaterialCompleteness(project);

    const evidence = extractAbilityEvidence(project);

    Object.entries(evidence).forEach(([ability, score]) => {
      if (!abilityEvidence[ability]) {
        abilityEvidence[ability] = 0;
      }
      abilityEvidence[ability] += score * categoryScore * processScore * materialScore;
    });
  });

  const maxScore = Math.max(...Object.values(abilityEvidence), 1);

  return requirements.map((req) => {
    const rawScore = abilityEvidence[req.name] || 0;
    const normalizedScore = Math.min(5, (rawScore / maxScore) * 5);
    const currentLevel = Math.round(normalizedScore * 2) / 2;
    const gap = Math.max(0, req.requiredLevel - currentLevel);

    return {
      name: req.name,
      currentLevel,
      requiredLevel: req.requiredLevel,
      gap,
      weight: req.weight,
    };
  });
}

function getCategoryAbilityScore(category: string): number {
  const scores: Record<string, number> = {
    '交互设计': 1.2,
    '视觉设计': 1.1,
    '产品设计': 1.2,
    '用户研究': 1.3,
    '编程开发': 1.1,
    '学术研究': 1.0,
    '社会实践': 0.9,
    '其他': 0.8,
  };
  return scores[category] || 1.0;
}

function getProcessCompleteness(project: Project): number {
  const process = project.process;
  let score = 0;
  const fields = ['motivation', 'research', 'ideation', 'implementation', 'reflection'] as const;
  fields.forEach((field) => {
    if (process[field] && process[field].length > 50) {
      score += 0.2;
    }
  });
  return Math.max(0.5, score);
}

function getMaterialCompleteness(project: Project): number {
  if (project.materials.length === 0) return 0.5;
  const completeCount = project.materials.filter((m) => m.isComplete).length;
  return completeCount / project.materials.length;
}

function extractAbilityEvidence(project: Project): Record<string, number> {
  const evidence: Record<string, number> = {};
  const text = `${project.description} ${project.process.motivation} ${project.process.research} ${project.process.ideation} ${project.process.implementation} ${project.process.reflection}`;
  const lowerText = text.toLowerCase();

  if (lowerText.includes('设计') || lowerText.includes('design')) {
    evidence['设计思维'] = (evidence['设计思维'] || 0) + 3;
  }
  if (lowerText.includes('用户') || lowerText.includes('user') || lowerText.includes('调研') || lowerText.includes('research')) {
    evidence['用户研究'] = (evidence['用户研究'] || 0) + 3;
  }
  if (lowerText.includes('视觉') || lowerText.includes('visual') || lowerText.includes('界面') || lowerText.includes('ui')) {
    evidence['视觉表达'] = (evidence['视觉表达'] || 0) + 3;
  }
  if (lowerText.includes('代码') || lowerText.includes('编程') || lowerText.includes('开发') || lowerText.includes('code') || lowerText.includes('开发')) {
    evidence['技术实现'] = (evidence['技术实现'] || 0) + 3;
  }
  if (lowerText.includes('创新') || lowerText.includes('innovation') || lowerText.includes('创意')) {
    evidence['创新能力'] = (evidence['创新能力'] || 0) + 2;
  }
  if (lowerText.includes('跨学科') || lowerText.includes('interdisciplinary') || lowerText.includes('跨界')) {
    evidence['跨学科素养'] = (evidence['跨学科素养'] || 0) + 2;
  }
  if (lowerText.includes('心理学') || lowerText.includes('psychology')) {
    evidence['心理学基础'] = (evidence['心理学基础'] || 0) + 3;
  }
  if (lowerText.includes('研究方法') || lowerText.includes('methodology') || lowerText.includes('实验')) {
    evidence['研究方法'] = (evidence['研究方法'] || 0) + 3;
  }
  if (lowerText.includes('数据分析') || lowerText.includes('data') || lowerText.includes('统计')) {
    evidence['数据分析'] = (evidence['数据分析'] || 0) + 3;
  }
  if (lowerText.includes('洞察') || lowerText.includes('insight') || lowerText.includes('发现')) {
    evidence['用户洞察'] = (evidence['用户洞察'] || 0) + 2;
  }
  if (lowerText.includes('论文') || lowerText.includes('写作') || lowerText.includes('paper') || lowerText.includes('文档')) {
    evidence['学术写作'] = (evidence['学术写作'] || 0) + 2;
  }
  if (lowerText.includes('艺术') || lowerText.includes('art') || lowerText.includes('美学') || lowerText.includes('审美')) {
    evidence['艺术素养'] = (evidence['艺术素养'] || 0) + 3;
  }
  if (lowerText.includes('软件') || lowerText.includes('software') || lowerText.includes('figma') || lowerText.includes('ps') || lowerText.includes('ai')) {
    evidence['软件技能'] = (evidence['软件技能'] || 0) + 2;
  }
  if (lowerText.includes('动手') || lowerText.includes('制作') || lowerText.includes('原型') || lowerText.includes('prototype')) {
    evidence['动手能力'] = (evidence['动手能力'] || 0) + 2;
  }
  if (lowerText.includes('批判') || lowerText.includes('critical') || lowerText.includes('反思') || lowerText.includes('思考')) {
    evidence['批判性思维'] = (evidence['批判性思维'] || 0) + 2;
  }

  const categoryBonus: Record<string, Record<string, number>> = {
    '交互设计': { '设计思维': 2, '用户研究': 1, '技术实现': 1 },
    '视觉设计': { '视觉表达': 2, '艺术素养': 1, '设计思维': 1 },
    '产品设计': { '设计思维': 2, '动手能力': 1, '创新能力': 1 },
    '用户研究': { '用户研究': 2, '研究方法': 1, '数据分析': 1 },
    '编程开发': { '技术实现': 2, '创新能力': 1, '跨学科素养': 1 },
    '学术研究': { '研究方法': 2, '学术写作': 1, '数据分析': 1 },
  };

  const bonuses = categoryBonus[project.category];
  if (bonuses) {
    Object.entries(bonuses).forEach(([ability, score]) => {
      evidence[ability] = (evidence[ability] || 0) + score;
    });
  }

  return evidence;
}

export function checkMaterialCompleteness(project: Project): MaterialCheckResult {
  const missingItems: Material[] = [];
  const suggestions: string[] = [];

  const coreMaterials = ['项目封面图', '设计草图/思维导图', '用户调研数据', '原型截图', '最终成品展示', '项目说明文档'];

  coreMaterials.forEach((name) => {
    const material = project.materials.find((m) => m.name === name);
    if (!material) {
      missingItems.push({
        id: uuidv4(),
        name,
        type: 'image',
        isComplete: false,
        description: '',
      });
    } else if (!material.isComplete) {
      missingItems.push(material);
    }
  });

  const process = project.process;
  if (process.motivation.length < 100) {
    suggestions.push('建议补充项目动机的详细描述，说明为什么选择这个项目');
  }
  if (process.research.length < 100) {
    suggestions.push('建议补充调研过程和用户研究的详细说明');
  }
  if (process.ideation.length < 100) {
    suggestions.push('建议补充构思过程和方案迭代的详细描述');
  }
  if (process.implementation.length < 100) {
    suggestions.push('建议补充具体实现过程和技术细节');
  }
  if (process.reflection.length < 50) {
    suggestions.push('建议补充项目反思和改进方向的思考');
  }

  let completeness: number;
  if (project.materials.length === 0) {
    completeness = 0;
  } else {
    const completedCount = project.materials.filter((m) => m.isComplete).length;
    completeness = Math.round((completedCount / project.materials.length) * 100);
  }

  return {
    completeness,
    missingItems,
    suggestions,
  };
}

export function evaluateNarrativeFlow(projects: Project[], narrativeDraft?: string, background?: { education: string; experience: string; skills: string[] }, targetMajor?: { school: string; major: string; admissionPreferences: string }): NarrativeEvaluation {
  const feedback: string[] = [];
  let score = 50;

  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);

  if (projects.length < 3) {
    feedback.push('建议至少包含3个项目，以展示完整的能力体系');
    score -= 20;
  } else if (projects.length > 5) {
    feedback.push('项目数量较多，建议精选5个以内最有代表性的项目');
    score -= 5;
  }

  const categories = new Set(projects.map((p) => p.category));
  if (categories.size === 1) {
    feedback.push('项目类型较为单一，建议展示多种类型的项目以体现综合能力');
    score -= 10;
  }

  const hasAcademic = projects.some((p) => p.category === '学术研究');
  const hasPractical = projects.some((p) => ['交互设计', '产品设计', '编程开发'].includes(p.category));
  const hasSocial = projects.some((p) => p.category === '社会实践');

  if (hasAcademic && hasPractical) {
    score += 10;
    feedback.push('学术与实践结合，展示了理论与实践的平衡');
  }

  if (hasSocial) {
    score += 5;
    feedback.push('包含社会实践项目，展现了社会责任感');
  }

  let skillProgression = true;
  for (let i = 1; i < sortedProjects.length; i++) {
    const prev = sortedProjects[i - 1];
    const curr = sortedProjects[i];
    const prevDate = new Date(prev.createdAt);
    const currDate = new Date(curr.createdAt);
    if (currDate < prevDate) {
      skillProgression = false;
      break;
    }
  }

  if (!skillProgression) {
    feedback.push('建议按时间或能力递进顺序排列项目');
    score -= 10;
  } else {
    score += 10;
  }

  const allHaveCompleteProcess = projects.every((p) => {
    const proc = p.process;
    return (
      proc.motivation.length > 50 &&
      proc.research.length > 50 &&
      proc.ideation.length > 50 &&
      proc.implementation.length > 50
    );
  });

  if (allHaveCompleteProcess) {
    score += 10;
    feedback.push('所有项目都有完整的过程描述，叙事清晰');
  } else {
    feedback.push('部分项目过程描述不够完整');
  }

  if (narrativeDraft && narrativeDraft.trim().length > 0) {
    const draftLen = narrativeDraft.trim().length;

    if (draftLen < 50) {
      feedback.push('申请叙事过于简短，无法充分表达转专业动机和规划');
      score -= 15;
    } else if (draftLen < 100) {
      feedback.push('申请叙事较短，建议补充更多细节');
      score -= 5;
    } else if (draftLen >= 300) {
      score += 10;
      feedback.push('申请叙事篇幅充分，故事完整');
    }

    const draftLower = narrativeDraft.toLowerCase();
    const mentionsBackground = background && (background.education || background.experience);
    const mentionsProjects = projects.some((p) => p.title && draftLower.includes(p.title.toLowerCase()));

    if (!mentionsBackground && !draftLower.includes('背景') && !draftLower.includes('本科') && !draftLower.includes('专业') && !draftLower.includes('经历')) {
      feedback.push('申请叙事未提及个人背景，建议说明原专业经历如何影响你的转向决定');
      score -= 10;
    }

    if (!mentionsProjects && !draftLower.includes('项目') && !draftLower.includes('作品') && !draftLower.includes('实践')) {
      feedback.push('申请叙事未提及具体项目，建议引用作品集中的项目作为能力证据');
      score -= 10;
    }

    if (targetMajor) {
      const mentionsTarget = draftLower.includes(targetMajor.school.toLowerCase()) || draftLower.includes(targetMajor.major.toLowerCase());
      if (!mentionsTarget && !draftLower.includes('目标') && !draftLower.includes('申请') && !draftLower.includes('深造')) {
        feedback.push('申请叙事未提及目标院校或专业，建议明确表达申请意向');
        score -= 10;
      } else if (mentionsTarget) {
        score += 5;
        feedback.push('叙事中明确提及了目标专业，方向清晰');
      }
    }

    const hasTurningPoint = draftLower.includes('转') || draftLower.includes('决定') || draftLower.includes('触发') || draftLower.includes('改变') || draftLower.includes('意识') || draftLower.includes('发现');
    if (hasTurningPoint) {
      score += 5;
      feedback.push('叙事中有明确的转折点，展现了转向的内在驱动力');
    } else {
      feedback.push('建议在叙事中明确描述触发转专业决定的关键时刻');
      score -= 5;
    }
  } else {
    feedback.push('尚未填写申请叙事草稿，建议在创建页补充，以评估故事是否讲得通');
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    feedback,
  };
}

export function calculateOverallScore(abilityGaps: AbilityGap[], narrative: NarrativeEvaluation, materialChecks: { projectId: string; projectTitle: string; result: MaterialCheckResult }[]): number {
  const gapScore = 100 - abilityGaps.reduce((sum, gap) => sum + gap.gap * gap.weight * 10, 0);
  const materialScore = materialChecks.reduce((sum, check) => sum + check.result.completeness, 0) / Math.max(1, materialChecks.length);
  const narrativeScore = narrative.score;

  const overall = (gapScore * 0.4 + materialScore * 0.3 + narrativeScore * 0.3);

  return Math.round(Math.max(0, Math.min(100, overall)));
}

export function runDiagnosis(projects: Project[], requirements: AbilityRequirement[], narrativeDraft?: string, background?: { education: string; experience: string; skills: string[] }, targetMajor?: { school: string; major: string; admissionPreferences: string }): DiagnosisResult {
  const abilityGaps = calculateAbilityGap(projects, requirements);
  const narrativeEvaluation = evaluateNarrativeFlow(projects, narrativeDraft, background, targetMajor);
  const materialChecks = projects.map((project) => ({
    projectId: project.id,
    projectTitle: project.title,
    result: checkMaterialCompleteness(project),
  }));
  const overallScore = calculateOverallScore(abilityGaps, narrativeEvaluation, materialChecks);

  return {
    abilityGaps,
    overallScore,
    narrativeEvaluation,
    materialChecks,
  };
}
