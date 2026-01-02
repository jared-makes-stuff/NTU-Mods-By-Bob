import type { ModulePreviewIndex, ModuleWithIndexes } from "../../../types";

export type PreviewIndex = ModulePreviewIndex;

export type ModuleIndex = NonNullable<ModuleWithIndexes["indexes"]>[number];
