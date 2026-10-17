import { CONTRACTS_SCAFFOLD } from "@yitom/contracts";

export const READER_CORE_SCAFFOLD = `reader-core:${CONTRACTS_SCAFFOLD}` as const;

// A: shared (toc-signature, book-index)
export * from "./book-index.js";
export { computeTocSignature, normalizeTocTitle, type TocSignatureEntry } from "./toc-signature.js";

// B: navigation (11)
export * from "./epub-navigation.js";
export * from "./reader-chapter-nav.js";
export {
  flattenReaderToc,
  resolveUnitNav,
  type ReaderUnit,
  type ReaderUnitNavState,
  type ReaderTocSource,
} from "./reader-navigation.js";
export * from "./foliate-section-nav.js";
export * from "./pdf-outline.js";
export * from "./pdf-page-metrics.js";
export {
  PdfTextLayerMappingSink,
  registerPdfPageTextGeometry,
  type PdfSelectionSnapshot,
  normalizeClientRects,
  coalescePdfLineRects,
  unionClientRects,
  coalescePdfTextQuads,
  rectsFromPdfRange,
  buildPdfSnapshotFromRange,
  readPdfSelection,
  getSelectionToolbarPosition,
} from "./pdf-selection.js";
export * from "./reader-copy-shortcut.js";
export * from "./reader-selection-dismiss.js";
export * from "./reader-viewport-nav.js";
export * from "./reader-wheel-navigation.js";

// C: marks & notes (8)
export * from "./epub-selection.js";
export * from "./mobi-selection.js";
export * from "./reading-mark-colors.js";
export * from "./reading-mark-hit.js";
export * from "./reading-mark-kind-filters.js";
export * from "./export-reading-notes.js";
export * from "./reader-typography.js";
export {
  suggestTocPageOffset,
  type TocOffsetCandidate,
  type TocOffsetSearchOptions,
  type TocOffsetSuggestion,
} from "./toc-offset.js";

// D: web-doc navigation & themes (3)
export * from "./web-doc-toc.js";
export * from "./epub-themes.js";
export * from "./reader-navigation-sync.js";

// E: marks helpers (3)
export * from "./reader-mark-geometry.js";
export * from "./reading-mark-labels.js";
export * from "./reading-mark-passages.js";
