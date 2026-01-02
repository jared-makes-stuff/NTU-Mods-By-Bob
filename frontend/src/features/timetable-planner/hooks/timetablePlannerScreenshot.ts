import { toPng } from "html-to-image";
import type { RefObject } from "react";
import type { ToastActionElement, ToastProps } from "@/shared/ui/toast";
import { getErrorMessage } from "@/shared/api/client";

type ToastPayload = {
  title?: string;
  description?: string;
  variant?: ToastProps["variant"];
  action?: ToastActionElement;
};

interface ScreenshotParams {
  screenshotRef: RefObject<HTMLDivElement | null>;
  currentTimetableName: string | null;
  toast: (props: ToastPayload) => void;
}

/**
 * Generates a timetable screenshot and triggers a download.
 */
export const downloadTimetableScreenshot = async ({
  screenshotRef,
  currentTimetableName,
  toast,
}: ScreenshotParams) => {
  if (!screenshotRef.current) {
    toast({
      title: "Screenshot Failed",
      description: "Timetable view not found. Please try again.",
      variant: "destructive",
    });
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dataUrl = await toPng(screenshotRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: screenshotRef.current.scrollWidth,
      height: screenshotRef.current.scrollHeight,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    const filename = currentTimetableName
      ? `${currentTimetableName}.png`
      : `timetable-${new Date().toISOString().split("T")[0]}.png`;
    link.download = filename;
    link.click();

    toast({
      title: "Screenshot Saved",
      description: "Timetable image has been downloaded.",
    });
  } catch (error: unknown) {
    toast({
      title: "Screenshot Failed",
      description: getErrorMessage(error) || "Could not generate screenshot.",
      variant: "destructive",
    });
  }
};
