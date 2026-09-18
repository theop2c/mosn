// La panoplie des langues de MOSN : un fichier de labels par langue.
// La langue active est choisie par un admin (/admin/settings), stockée dans
// Firestore (settings/app.language) et appliquée immédiatement — sans
// redéploiement.
import { fr, type Labels } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { zh } from "./zh";
import { pt } from "./pt";
import { ja } from "./ja";
import { ko } from "./ko";

export type { Labels };

export const DEFAULT_LANGUAGE = "fr";

export interface LanguageOption {
  id: string;
  /** Nom de la langue, dans la langue elle-même. */
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "zh", label: "中文（普通话）" },
  { id: "pt", label: "Português" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

export const DICTIONARIES: Record<string, Labels> = {
  fr,
  en,
  es,
  zh,
  pt,
  ja,
  ko,
};

export function getLabels(language: string): Labels {
  return DICTIONARIES[language] ?? fr;
}

/** Langue par défaut devinée depuis le navigateur (pour l'assistant). */
export function detectBrowserLanguage(): string {
  const code = navigator.language?.slice(0, 2).toLowerCase();
  return DICTIONARIES[code] ? code : DEFAULT_LANGUAGE;
}
