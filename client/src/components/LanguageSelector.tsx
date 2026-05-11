import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/translations";

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  label?: string;
  hint?: string;
  /** Compact mode for inline usage (no label, smaller) */
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({
  value,
  onChange,
  label,
  hint,
  compact = false,
  className = "",
}: LanguageSelectorProps) {
  if (compact) {
    return (
      <Select value={value} onValueChange={(v) => onChange(v as SupportedLanguage)}>
        <SelectTrigger className={`w-auto gap-1.5 h-8 text-xs px-2.5 ${className}`}>
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-xs">
              <span className="mr-1.5">{lang.flag}</span>
              {lang.nativeLabel}
              {lang.code !== "en" && (
                <span className="text-muted-foreground ml-1">({lang.label})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          {label}
        </label>
      )}
      <Select value={value} onValueChange={(v) => onChange(v as SupportedLanguage)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="mr-2">{lang.flag}</span>
              {lang.nativeLabel}
              {lang.code !== "en" && (
                <span className="text-muted-foreground ml-1.5">({lang.label})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
