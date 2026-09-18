export interface ThemeOption {
  id: string;
  label: string;
  /** Couleurs d'aperçu pour le sélecteur : [primary, bg, surface] */
  preview: [string, string, string];
}

export const DEFAULT_THEME = "indigo";

/** La panoplie des 10 designs (une feuille CSS par design, src/styles/themes). */
export const THEMES: ThemeOption[] = [
  { id: "indigo", label: "Indigo (défaut)", preview: ["#4f46e5", "#f4f5f7", "#ffffff"] },
  { id: "ocean", label: "Océan", preview: ["#0284c7", "#f0f9ff", "#ffffff"] },
  { id: "forest", label: "Forêt", preview: ["#16a34a", "#f1f7f2", "#ffffff"] },
  { id: "sunset", label: "Coucher de soleil", preview: ["#ea580c", "#fff7ed", "#ffffff"] },
  { id: "rose", label: "Rose", preview: ["#db2777", "#fdf2f8", "#ffffff"] },
  { id: "midnight", label: "Minuit (toujours sombre)", preview: ["#6366f1", "#0a0a12", "#14141f"] },
  { id: "paper", label: "Papier (serif)", preview: ["#8b5e34", "#f5f0e6", "#fffdf7"] },
  { id: "mono", label: "Mono (noir & blanc)", preview: ["#111111", "#fafafa", "#ffffff"] },
  { id: "violet", label: "Violet", preview: ["#7c3aed", "#faf5ff", "#ffffff"] },
  { id: "citrus", label: "Agrumes", preview: ["#65a30d", "#fefce8", "#ffffff"] },
];
