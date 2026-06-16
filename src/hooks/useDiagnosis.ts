import { useState, useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { runDiagnosis } from '../utils/analysis';
import type { DiagnosisResult } from '../types';

export function useDiagnosis() {
  const projects = usePortfolioStore((state) => state.projects);
  const targetMajor = usePortfolioStore((state) => state.targetMajor);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const diagnosisResult: DiagnosisResult | null = useMemo(() => {
    if (!targetMajor || projects.length === 0) return null;
    return runDiagnosis(projects, targetMajor.abilityRequirements);
  }, [projects, targetMajor]);

  const runFullDiagnosis = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
    }, 500);
  };

  const priorityGaps = useMemo(() => {
    if (!diagnosisResult) return [];
    return diagnosisResult.abilityGaps
      .filter((gap) => gap.gap > 0)
      .sort((a, b) => b.gap * b.weight - a.gap * a.weight);
  }, [diagnosisResult]);

  const totalMaterialCompleteness = useMemo(() => {
    if (!diagnosisResult || diagnosisResult.materialChecks.length === 0) return 0;
    const total = diagnosisResult.materialChecks.reduce(
      (sum, check) => sum + check.result.completeness,
      0
    );
    return Math.round(total / diagnosisResult.materialChecks.length);
  }, [diagnosisResult]);

  return {
    diagnosisResult,
    isDiagnosing,
    runFullDiagnosis,
    priorityGaps,
    totalMaterialCompleteness,
    canDiagnose: targetMajor && projects.length > 0,
  };
}
