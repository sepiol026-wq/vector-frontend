export type ModuleCommand = { cmd: string; desc: string; desc_ru?: string; desc_ua?: string; desc_de?: string; desc_jp?: string; desc_leet?: string; desc_neofit?: string; desc_tiktok?: string; desc_uwu?: string; is_inline?: boolean; is_placeholder?: boolean };

export type SecurityQuota = {
  limit: number;
  used: number;
  remaining: number;
  day_key: string;
  reset_at: string;
};

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };

export type ModuleView = {
  targetModule: {
    name: string;
    class_name: string;
    description: string;
    developer: string;
    version: string;
    banner: string | null;
    tags: string | null;
    source_owner: string;
    commands: ModuleCommand[];
    dependencies: string[];
    raw_code: string;
    raw_code_size: number | null;
    updated_at: string;
  };
  revisions: Array<{
    id: string;
    revision_no: number;
    raw_code: string;
    raw_code_size: number | null;
    created_at: string;
  }>;
  user: { display_name: string; username: string | null; photo_url: string | null } | null;
  ratingSummary: { likes: number; dislikes: number; userAction: "like" | "dislike" | null };
  securityCheck: {
    checked: true;
    verdict: "safe" | "suspicious" | "unsafe";
    label: string;
    confidence: number;
    summary: string;
    created_at: string;
    details: JsonValue;
    quota?: SecurityQuota;
    ai_failed?: boolean;
  } | null;
  securityQuota: SecurityQuota | null;
  officialDeveloper: boolean;
  sourceToken: string;
};
