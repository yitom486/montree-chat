/** Design references: cathrynlavery/diagram-design (MIT, Cathryn Lavery). Montree parameter templates are independently implemented. */
export declare const DIAGRAM_TYPES: readonly ['flowchart', 'sequence', 'architecture', 'mindmap', 'swimlane', 'timeline', 'fishbone', 'cycle', 'er'];
export type DiagramType = typeof DIAGRAM_TYPES[number];
/** Markdown document capabilities are separate from chat-only presentation actions. */
export declare const MARKDOWN_COMPONENT_GUIDE: string;
export declare function diagramDesignGuide(type: unknown): string;
//# sourceMappingURL=diagram-design.d.ts.map