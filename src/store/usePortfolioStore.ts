import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  Background,
  PortfolioState,
  TargetMajor,
  Material,
  Process,
  PortfolioVersion,
} from '../types';
import { defaultMaterials } from '../data/majors';

interface PortfolioStore extends PortfolioState {
  addProject: () => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (activeId: string, overId: string) => void;
  updateBackground: (updates: Partial<Background>) => void;
  setTargetMajor: (major: TargetMajor | undefined) => void;
  updateSubmissionItem: (itemId: string, isCompleted: boolean) => void;
  addMaterial: (projectId: string, material: Omit<Material, 'id'>) => void;
  updateMaterial: (projectId: string, materialId: string, updates: Partial<Material>) => void;
  deleteMaterial: (projectId: string, materialId: string) => void;
  updateProcess: (projectId: string, updates: Partial<Process>) => void;
  saveVersion: (name: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  importData: (data: PortfolioState) => void;
  exportData: () => PortfolioState;
  resetAll: () => void;
}

const initialBackground: Background = {
  education: '',
  experience: '',
  skills: [],
};

const createEmptyProject = (order: number): Project => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: '',
    description: '',
    order,
    category: '交互设计',
    process: {
      motivation: '',
      research: '',
      ideation: '',
      implementation: '',
      reflection: '',
    },
    materials: defaultMaterials.map((m) => ({
      id: uuidv4(),
      name: m.name,
      type: m.type,
      isComplete: false,
      description: m.description,
    })),
    createdAt: now,
    updatedAt: now,
  };
};

const initialState: PortfolioState = {
  projects: [],
  background: initialBackground,
  targetMajor: undefined,
  versions: [],
};

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addProject: () => {
        const projects = get().projects;
        const newProject = createEmptyProject(projects.length);
        set({ projects: [...projects, newProject] });
      },

      updateProject: (id, updates) => {
        const projects = get().projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        );
        set({ projects });
      },

      deleteProject: (id) => {
        const projects = get()
          .projects.filter((p) => p.id !== id)
          .map((p, index) => ({ ...p, order: index }));
        set({ projects });
      },

      reorderProjects: (activeId, overId) => {
        const projects = get().projects;
        const oldIndex = projects.findIndex((p) => p.id === activeId);
        const newIndex = projects.findIndex((p) => p.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newProjects = [...projects];
        const [removed] = newProjects.splice(oldIndex, 1);
        newProjects.splice(newIndex, 0, removed);

        const reordered = newProjects.map((p, index) => ({
          ...p,
          order: index,
        }));

        set({ projects: reordered });
      },

      updateBackground: (updates) => {
        const background = { ...get().background, ...updates };
        set({ background });
      },

      setTargetMajor: (major) => {
        if (major) {
          const submissionItems = major.submissionItems.map((item) => ({
            ...item,
            isCompleted: false,
          }));
          set({ targetMajor: { ...major, submissionItems } });
        } else {
          set({ targetMajor: undefined });
        }
      },

      updateSubmissionItem: (itemId, isCompleted) => {
        const targetMajor = get().targetMajor;
        if (!targetMajor) return;

        const submissionItems = targetMajor.submissionItems.map((item) =>
          item.id === itemId ? { ...item, isCompleted } : item
        );
        set({ targetMajor: { ...targetMajor, submissionItems } });
      },

      addMaterial: (projectId, material) => {
        const projects = get().projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              materials: [...p.materials, { ...material, id: uuidv4() }],
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        set({ projects });
      },

      updateMaterial: (projectId, materialId, updates) => {
        const projects = get().projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              materials: p.materials.map((m) =>
                m.id === materialId ? { ...m, ...updates } : m
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        set({ projects });
      },

      deleteMaterial: (projectId, materialId) => {
        const projects = get().projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              materials: p.materials.filter((m) => m.id !== materialId),
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        set({ projects });
      },

      updateProcess: (projectId, updates) => {
        const projects = get().projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              process: { ...p.process, ...updates },
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        set({ projects });
      },

      saveVersion: (name) => {
        const state = get();
        const snapshot: PortfolioState = {
          projects: JSON.parse(JSON.stringify(state.projects)),
          background: JSON.parse(JSON.stringify(state.background)),
          targetMajor: state.targetMajor ? JSON.parse(JSON.stringify(state.targetMajor)) : undefined,
          versions: [],
        };

        const version: PortfolioVersion = {
          id: uuidv4(),
          name,
          createdAt: new Date().toISOString(),
          snapshot,
        };

        set({ versions: [version, ...state.versions] });
      },

      restoreVersion: (versionId) => {
        const version = get().versions.find((v) => v.id === versionId);
        if (!version) return;

        const { projects, background, targetMajor } = version.snapshot;
        set({
          projects: JSON.parse(JSON.stringify(projects)),
          background: JSON.parse(JSON.stringify(background)),
          targetMajor: targetMajor ? JSON.parse(JSON.stringify(targetMajor)) : undefined,
        });
      },

      deleteVersion: (versionId) => {
        const versions = get().versions.filter((v) => v.id !== versionId);
        set({ versions });
      },

      importData: (data) => {
        set({
          projects: data.projects || [],
          background: data.background || initialBackground,
          targetMajor: data.targetMajor,
          versions: data.versions || [],
        });
      },

      exportData: () => {
        const state = get();
        return {
          projects: state.projects,
          background: state.background,
          targetMajor: state.targetMajor,
          versions: state.versions,
        };
      },

      resetAll: () => {
        set(initialState);
      },
    }),
    {
      name: 'portfolio-diagnosis-storage',
    }
  )
);
