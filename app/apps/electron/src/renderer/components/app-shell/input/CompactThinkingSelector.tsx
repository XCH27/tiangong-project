import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Zap } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  getThinkingLevelNameKey,
  type ThinkingLevel,
} from "@craft-agent/shared/agent/thinking-levels";
import { useModelThinkingContext } from "./model-picker-helpers";
import { connectionSupportsFastMode } from "@config/llm-connections";

interface CompactThinkingSelectorProps {
  currentModel: string;
  currentConnection?: string;
  thinkingLevel?: ThinkingLevel;
  onThinkingLevelChange?: (level: ThinkingLevel) => void;
  fastMode?: boolean;
  onFastModeChange?: (enabled: boolean) => void;
  isProcessing?: boolean;
  isEmptySession?: boolean;
  connectionUnavailable?: boolean;
}

export function CompactThinkingSelector({
  currentModel,
  currentConnection,
  thinkingLevel = "medium",
  onThinkingLevelChange,
  fastMode = false,
  onFastModeChange,
  isProcessing = false,
  connectionUnavailable = false,
}: CompactThinkingSelectorProps) {
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
  const canChooseThinking =
    availableThinkingLevels.length > 0 && !!onThinkingLevelChange;
  if (
    (availableThinkingLevels.length === 0 && !supportsFastMode) ||
    connectionUnavailable
  ) {
    return null;
  }

  const chipLabel = canChooseThinking
    ? t(getThinkingLevelNameKey(effectiveThinkingLevel))
    : t("chat.modelPicker.fastMode");

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={t("chat.modelPicker.thinkingSection")}
          className={cn(
            "flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-xs font-medium transition-colors",
            "text-foreground/60 hover:bg-foreground/5 hover:text-foreground/80",
            open && "bg-foreground/5",
          )}
        >
          <span className="max-w-[72px] truncate">{chipLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("chat.modelPicker.thinkingSection")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-0.5 px-1 pb-4">
          {canChooseThinking &&
            availableThinkingLevels.map(({ id }) => {
              const isSelected = effectiveThinkingLevel === id;
              return (
                <DrawerClose asChild key={id}>
                  <button
                    type="button"
                    onClick={() => onThinkingLevelChange?.(id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left transition-colors",
                      isSelected && "bg-foreground/5",
                      !isSelected && "hover:bg-foreground/5",
                    )}
                  >
                    <span className="min-w-0 text-sm">{t(getThinkingLevelNameKey(id))}</span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-foreground/60 shrink-0 ml-3" />
                    )}
                  </button>
                </DrawerClose>
              );
            })}
          {supportsFastMode && onFastModeChange && (
            <DrawerClose asChild>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (!isProcessing) onFastModeChange(!fastMode);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[6px] border-t border-border/60 px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  fastMode ? "bg-foreground/5" : "hover:bg-foreground/5",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{t("chat.modelPicker.fastMode")}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {t("chat.modelPicker.fastModeDescription")}
                    </span>
                  </span>
                </span>
                {fastMode && <Check className="h-3 w-3 text-foreground/60" />}
              </button>
            </DrawerClose>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
