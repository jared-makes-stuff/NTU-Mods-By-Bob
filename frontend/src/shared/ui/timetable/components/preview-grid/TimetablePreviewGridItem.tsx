import { Trash2 } from "lucide-react";
import { calculateSpan, getIndexColor } from "@/shared/lib/timetable-utils";
import type { IndexData } from "@/shared/types/timetable";
import { buildItemKey, getOpacityClass } from "./previewGridUtils";

interface TimetablePreviewGridItemProps {
  item: IndexData & { isPreview?: boolean };
  moduleCode: string;
  colorBy: "module" | "index";
  layout: { width: number; left: number };
  effectiveHoveredIndex: string | null;
  previewIndexes: IndexData[];
  clashingIndexes: Set<string>;
  allIndexes: IndexData[];
  onIndexClick?: (indexNumber: string, moduleCode?: string, isPreview?: boolean) => void;
  onDeleteCustomEvent?: (id: string) => void;
  setHoveredIndex: React.Dispatch<React.SetStateAction<string | null>>;
  setTooltipData: React.Dispatch<React.SetStateAction<{ x: number; y: number; classes: IndexData[] } | null>>;
  variant: "merged" | "standard";
}

/**
 * Timetable preview grid item block.
 */
export function TimetablePreviewGridItem({
  item,
  moduleCode,
  colorBy,
  layout,
  effectiveHoveredIndex,
  previewIndexes,
  clashingIndexes,
  allIndexes,
  onIndexClick,
  onDeleteCustomEvent,
  setHoveredIndex,
  setTooltipData,
  variant,
}: TimetablePreviewGridItemProps) {
  const span = calculateSpan(item.startTime, item.endTime);
  const isPlanner = (item.moduleCode || moduleCode) === "PLANNER";
  const colorKey =
    variant === "merged"
      ? item.moduleCode || moduleCode
      : colorBy === "index"
        ? item.indexNumber
        : item.moduleCode || item.indexNumber;
  const colors = getIndexColor(colorKey, isPlanner);
  const key = buildItemKey(item);
  const isPreview = item.isPreview;
  const isHovered = effectiveHoveredIndex === item.indexNumber;
  const hasPreviewItems = previewIndexes.length > 0;
  const isSameModule = (item.moduleCode || moduleCode) === moduleCode;
  const opacityClass = getOpacityClass({
    hasPreviewItems,
    effectiveHoveredIndex,
    isSameModule,
    isPreview,
    itemIndex: item.indexNumber,
  });

  const baseStyle: React.CSSProperties = {
    left: `${layout.left}%`,
    width: `${layout.width}%`,
    top: 0,
    zIndex: isHovered ? 40 : isPreview ? 20 : 10,
  };

  const style: React.CSSProperties =
    variant === "merged"
      ? {
          ...baseStyle,
          height: `calc(${span * 100}% + ${span - 1}px)`,
          pointerEvents: "auto",
        }
      : {
          ...baseStyle,
          bottom: `calc(-${span - 1} * 30px - ${span - 1}px)`,
          height: `calc(${span}00% + ${span - 1}px)`,
        };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredIndex(item.indexNumber);
    const indexClasses = allIndexes.filter((data) => data.indexNumber === item.indexNumber);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      x: rect.right + 10,
      y: rect.top,
      classes: indexClasses,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipData(null);
  };

  return (
    <div
      key={key}
      className={`absolute ${colors.bg} border-2 ${colors.border} rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${opacityClass}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={variant === "merged" ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        onIndexClick?.(item.indexNumber, item.moduleCode, item.isPreview);
      } : undefined}
      onMouseDown={variant === "standard" ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        onIndexClick?.(item.indexNumber, item.moduleCode, item.isPreview);
      } : undefined}
    >
      <div className="p-1.5 h-full flex flex-col relative">
        {item.isCustomEvent && onDeleteCustomEvent && (
          <div
            className={
              variant === "merged"
                ? "absolute top-0 right-0 h-[30px] w-[30px] flex items-center justify-center cursor-pointer hover:text-destructive z-50"
                : "absolute top-0 right-0 p-1 cursor-pointer hover:text-destructive z-50"
            }
            onPointerDown={(event) => {
              event.stopPropagation();
              onDeleteCustomEvent(item.indexNumber);
            }}
          >
            <Trash2 className={variant === "merged" ? "size-4" : "size-3.5"} />
          </div>
        )}

        <div className="flex justify-between items-start gap-1 mb-0.5">
          <span className="text-[13px] font-bold leading-tight truncate pr-4" style={{ color: "#000" }}>
            {item.moduleCode || moduleCode}
          </span>
          {!item.isCustomEvent && (
            <span
              className="text-[12px] font-semibold leading-tight flex-shrink-0"
              style={{
                color: clashingIndexes.has(`${item.moduleCode || moduleCode}-${item.indexNumber}`)
                  ? "#ef4444"
                  : "#000",
              }}
            >
              {item.indexNumber}
            </span>
          )}
        </div>

        <div className="text-[12px] leading-tight mb-0.5" style={{ color: "#000" }}>
          {item.type} {item.startTime.substring(0, 2)}:{item.startTime.substring(2)}
        </div>

        {span > 2 && (
          <>
            {item.weeks && (
              <div className="text-[11px] leading-tight mb-0.5" style={{ color: "#000" }}>
                {item.weeks}
              </div>
            )}
            {item.venue && (
              <div className="text-[11px] leading-tight truncate" style={{ color: "#000" }}>
                {item.venue}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
