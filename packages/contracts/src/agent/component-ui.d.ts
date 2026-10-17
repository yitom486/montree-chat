/**
 * `montree_present(kind=component-ui)` 生成式 UI 组件树契约（G1）。
 *
 * 模型经 MCP 工具提交 JSON 界面描述，宿主用官方 `GenerativeUIRender`
 *（`@assistant-ui/react@0.15.27` 已含，无需新增依赖/替换运行时）渲染。
 * 树形状与官方 `GenerativeUISpec` 同形：
 * `{ component, props?, children?, key? }`，仅白名单组件可渲染。
 * 校验与渲染共用同一入口，两端行为一致；未知组件/动作与超限一律
 * 返回可读错误，不执行、不截断后运行。不传函数/JSX/任意 IPC 名。
 */
export declare const COMPONENT_UI_SCHEMA_VERSION: 1;
/** 模型输入整体 UTF-8 上限（MCP 请求体 256KiB，留封装余量） */
export declare const COMPONENT_UI_MAX_BYTES: number;
/** 树深度上限（官方渲染器内部为 64，此处更严，防模型失控） */
export declare const COMPONENT_UI_MAX_DEPTH = 12;
/** 元素总数上限（含文本叶） */
export declare const COMPONENT_UI_MAX_NODES = 200;
/** 单文本上限（字符） */
export declare const COMPONENT_UI_MAX_TEXT_CHARS = 4000;
/** 可提交表单值总量上限（UTF-8 字节） */
export declare const COMPONENT_UI_MAX_SUBMIT_BYTES: number;
/** 首批白名单组件（G2 按官方包实际能力命名，复用 shadcn/主题） */
export declare const COMPONENT_UI_COMPONENTS: readonly ['Card', 'Row', 'Column', 'Text', 'Select', 'Button', 'Evidence'];
export type ComponentUiComponentName = (typeof COMPONENT_UI_COMPONENTS)[number];
/** 首批白名单动作：本地选择提交与原文定位，不含写入/删除/任意 IPC */
export declare const COMPONENT_UI_ACTIONS: readonly ['submit-selection', 'locate'];
export type ComponentUiAction = (typeof COMPONENT_UI_ACTIONS)[number];
export interface ComponentUiNode {
    component: ComponentUiComponentName;
    props?: Record<string, unknown>;
    children?: ComponentUiNode[] | ComponentUiNode | string | number;
    key?: string;
}
export interface ComponentUiSpec {
    root: ComponentUiNode | ComponentUiNode[] | string | number;
}
/**
 * 组件属性白名单校验；失败返回中文原因，成功返回 null。
 * 仅校验形状与上限，不校验业务语义（如章节归属由 builder 验证摘录）。
 */
export declare function validateComponentProps(component: ComponentUiComponentName, props: unknown): string | null;
/** 树整体校验；失败返回中文原因，成功返回 null */
export declare function validateComponentUiSpec(spec: unknown): string | null;
/** 收集所有 Select.id（提交字段名），重复即非法 */
export declare function collectSelectIds(root: unknown): {
    ids: string[];
    error?: string;
};
/** 收集所有 Evidence 引用与 locate Button 引用（builder 逐条验摘录） */
export declare function collectEvidenceRefs(root: unknown): Array<{
    excerpt: string;
    chapterKey: string;
}>;
export declare function componentUiUtf8Bytes(text: string): number;
//# sourceMappingURL=component-ui.d.ts.map