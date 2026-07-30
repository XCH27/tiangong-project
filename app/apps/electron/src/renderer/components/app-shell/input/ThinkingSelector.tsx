import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Zap } from "lucide-react";
import {
  getThinkingLevelNameKey,
  type ThinkingLevel,
} from "@craft-agent/shared/agent/thinking-levels";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
} from "@/components/ui/styled-dropdown";
import { cn } from "@/lib/utils";
import { useModelThinkingContext } from "./model-picker-helpers";
import { connectionSupportsFastMode } from "@config/llm-connections";

interface ThinkingSelectorProps {
  currentModel: string;
  currentConnection?: string;
  thinkingLevel?: ThinkingLevel;
  onThinkingLevelChange?: (level: ThinkingLevel) => void;
  fastMode?: boolean;
  onFastModeChange?: (enabled: boolean) => void;
  /** Runtime changes are applied between turns, never to a live agent. */
  isProcessing?: boolean;
  connectionUnavailable?: boolean;
}

/**
 * Desktop thinking-level selector.
 *
 * Thinking is a model capability but not a model identity, so it owns a
 * separate toolbar control instead of being nested in the model menu.
 */
export function ThinkingSelector({
  currentModel,
  currentConnection,
  thinkingLevel = "medium",
  onThinkingLevelChange,
  fastMode = false,
  onFastModeChange,
  isProcessing = false,
  connectionUnavailable = false,
}: ThinkingSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const {
    availableThinkingLevels,
    effectiveThinkingLevel,
    effectiveConnectionDetails,
    selectedModelId,
  } = useModelThinkingContext(
    currentModel,
    currentConnection,
    thinkingLevel,
    connectionUnavailable,
  );

  const supportsFastMode = connectionSupportsFastMode(
    effectiveConnectionDetails,
    selectedModelId,
  );
  if (
    connectionUnavailable ||
    (availableThinkingLevels.length === 0 && !supportsFastMode)
  ) {
    return null;
  }

  const canChooseThinking =
    availableThinkingLevels.length > 0 && !!onThinkingLevelChange;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("chat.modelPicker.thinkingSection")}
          className={cn(
            "input-toolbar-btn inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] px-1.5 text-[13px] transition-colors select-none",
            "text-foreground/60 hover:bg-foreground/5 hover:text-foreground/80",
            open && "bg-foreground/5",
          )}
        >
          <span className="max-w-[88px] truncate">
            {canChooseThinking
              ? t(getThinkingLevelNameKey(effectiveThinkingLevel))
              : t("chat.modelPicker.fastMode")}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        className="min-w-[220px]"
      >
        {canChooseThinking &&
          availableThinkingLevels.map(({ id }) => {
            const isSelected = effectiveThinkingLevel === id;
            return (
              <StyledDropdownMenuItem
                key={id}
                onSelect={() => onThinkingLevelChange(id)}
                className="flex cursor-pointer items-center justify-between rounded-[6px] px-2 py-2"
              >
                <span className="min-w-0 text-left text-sm">
                  {t(getThinkingLevelNameKey(id))}
                </span>
                {isSelected && (
                  <Check className="ml-3 h-3 w-3 shrink-0 text-foreground" />
                )}
              </StyledDropdownMenuItem>
            );
          })}
        {supportsFastMode && onFastModeChange && (
          <StyledDropdownMenuItem
            disabled={isProcessing}
            onSelect={() => {
              if (!isProcessing) onFastModeChange(!fastMode);
            }}
            className="mt-1 flex cursor-pointer items-center justify-between rounded-[6px] border-t border-border/60 px-2 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{t("chat.modelPicker.fastMode")}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t("chat.modelPicker.fastModeDescription")}
                </span>
              </span>
            </div>
            {fastMode && <Check className="h-3 w-3 text-foreground" />}
          </StyledDropdownMenuItem>
        )}
      </StyledDropdownMenuContent>
    </DropdownMenu>
  );
}
