/**
 * 主进程 ↔ 渲染进程 IPC 通道名（字符串才是线上协议）。
 * 属性上的 JSDoc 会在 IDE 悬停 `IPC.XXX` 时显示。
 *
 * 分区顺序（与 electron-api.types.ts 的 ElectronAPI 分区保持一致）：
 * 应用与窗口 → 应用更新 → Bun → 文件与工作区 → 阅读书签 → ACP → 在线文档 → OCR → PDF 解析 → 罗盘 → 测验 → 云同步
 */
export declare const IPC: {
    readonly COMPILE_REACT_ARTIFACT: 'artifact:compile-react';
    /** invoke：读取应用版本号 */
    readonly APP_GET_VERSION: 'app:get-version';
    /** send：请求退出应用 */
    readonly APP_QUIT: 'app:quit';
    /** send：同步当前文档是否未保存（关窗确认用） */
    readonly APP_SET_DIRTY: 'app:set-dirty';
    /** main→renderer：主进程请求关闭窗口，渲染进程可拦截未保存 */
    readonly APP_REQUEST_CLOSE: 'app:request-close';
    /** send：渲染进程回复是否允许关闭（proceed / cancel） */
    readonly APP_CLOSE_DECISION: 'app:close-decision';
    /** send：切换开发者工具 */
    readonly APP_TOGGLE_DEVTOOLS: 'app:toggle-devtools';
    /** invoke：把渲染进程错误写入日志文件 */
    readonly APP_LOG_RENDERER_ERROR: 'app:log-renderer-error';
    /** invoke：返回错误日志文件路径 */
    readonly APP_GET_ERROR_LOG_PATH: 'app:get-error-log-path';
    /** send：开关主进程详细日志 */
    readonly APP_SET_VERBOSE_LOGS: 'app:set-verbose-logs';
    /** send：再开一个主窗口（不恢复工作区） */
    readonly APP_NEW_WINDOW: 'app:new-window';
    /** invoke：取走一个待处理的外部打开文件（资源管理器双击/打开方式），无则返回 null */
    readonly APP_TAKE_PENDING_EXTERNAL_FILE: 'app:take-pending-external-file';
    /** main→renderer：触发全局快捷动作（quick-open / find / replace 等） */
    readonly APP_GLOBAL_ACTION: 'app:global-action';
    /** sendSync（preload）：取窗口启动参数，如 isFreshWindow */
    readonly APP_GET_WINDOW_INIT: 'app:get-window-init';
    /** invoke：用系统默认浏览器打开外链 */
    readonly APP_OPEN_EXTERNAL: 'app:open-external';
    /** send：最小化当前窗口 */
    readonly APP_WINDOW_MINIMIZE: 'app:window-minimize';
    /** send：切换最大化 / 还原当前窗口 */
    readonly APP_WINDOW_TOGGLE_MAXIMIZE: 'app:window-toggle-maximize';
    /** send：关闭当前窗口（走保存确认） */
    readonly APP_WINDOW_CLOSE: 'app:window-close';
    /** invoke：查询当前窗口是否最大化 */
    readonly APP_WINDOW_IS_MAXIMIZED: 'app:window-is-maximized';
    /** main→renderer：窗口最大化状态变更推送 */
    readonly APP_WINDOW_MAXIMIZE_CHANGED: 'app:window-maximize-changed';
    /** invoke：检查应用更新 */
    readonly APP_UPDATE_CHECK: 'app:update-check';
    /** invoke：下载已发现的更新 */
    readonly APP_UPDATE_DOWNLOAD: 'app:update-download';
    /** invoke：安装更新并重启 */
    readonly APP_UPDATE_INSTALL: 'app:update-install';
    /** invoke：读取当前更新状态快照 */
    readonly APP_UPDATE_GET_STATUS: 'app:update-get-status';
    /** main→renderer：更新状态推送（检查/下载进度等） */
    readonly APP_UPDATE_STATUS: 'app:update-status';
    /** invoke：探测本机 Bun 运行时是否可用 */
    readonly BUN_GET_STATUS: 'bun:get-status';
    /** invoke：安装 / 确保 Bun 运行时 */
    readonly BUN_INSTALL: 'bun:install';
    /** invoke：打开文件对话框（文档） */
    readonly FILE_OPEN: 'file:open';
    /** invoke：打开文件夹对话框（工作区根） */
    readonly FILE_OPEN_FOLDER: 'file:open-folder';
    /** invoke：扫描已有工作区路径，返回文件树 */
    readonly FILE_SCAN_WORKSPACE: 'file:scan-workspace';
    /** invoke：按路径读文本文件 */
    readonly FILE_READ: 'file:read';
    /** invoke：按路径读二进制文件 */
    readonly FILE_READ_BINARY: 'file:read-binary';
    readonly FILE_SAVE_BINARY_DOCUMENT: 'file:save-binary-document';
    /** invoke：保存到当前路径（可弹对话框） */
    readonly FILE_SAVE: 'file:save';
    /** invoke：另存为 */
    readonly FILE_SAVE_AS: 'file:save-as';
    /** invoke：读图片并转 data URL（预览/粘贴用） */
    readonly FILE_READ_IMAGE: 'file:read-image';
    /** invoke：把粘贴的图片写入工作区并返回路径 */
    readonly FILE_SAVE_PASTED_IMAGE: 'file:save-pasted-image';
    /** invoke：导出 HTML */
    readonly FILE_EXPORT_HTML: 'file:export-html';
    /** invoke：导出 PDF */
    readonly FILE_EXPORT_PDF: 'file:export-pdf';
    /** invoke：导出 Markdown */
    readonly FILE_EXPORT_MARKDOWN: 'file:export-markdown';
    /** send：根据路径/脏标记更新窗口标题 */
    readonly FILE_UPDATE_TITLE: 'file:update-title';
    /** invoke：在工作区新建文件 */
    readonly FILE_CREATE: 'file:create';
    /** invoke：在工作区新建目录 */
    readonly FILE_CREATE_DIR: 'file:create-dir';
    /** invoke：重命名工作区路径 */
    readonly FILE_RENAME: 'file:rename';
    /** invoke：删除工作区路径 */
    readonly FILE_DELETE: 'file:delete';
    /** invoke：复制工作区路径 */
    readonly FILE_COPY: 'file:copy';
    /** invoke：移动工作区路径 */
    readonly FILE_MOVE: 'file:move';
    /** invoke：工作区 Markdown 字面检索（只读，仅渲染端 inspect 链调用，不暴露给模型） */
    readonly WORKSPACE_SEARCH_MARKDOWN: 'workspace:search-markdown';
    /** send：开始监听工作区文件变化 */
    readonly WORKSPACE_WATCH: 'workspace:watch';
    /** send：停止监听工作区 */
    readonly WORKSPACE_UNWATCH: 'workspace:unwatch';
    /** main→renderer：工作区磁盘变化，渲染进程应刷新树 */
    readonly WORKSPACE_CHANGED: 'workspace:changed';
    /** invoke：绑定当前窗口到本机工作区宿主（返回描述符/代际/状态） */
    readonly WORKSPACE_CONNECT: 'workspace:connect';
    /** invoke：解绑当前窗口工作区并停止监听 */
    readonly WORKSPACE_DISCONNECT: 'workspace:disconnect';
    /** invoke：查询当前窗口工作区绑定状态 */
    readonly WORKSPACE_GET_STATUS: 'workspace:get-status';
    /** main→renderer：工作区连接状态变化（含代际，旧事件不得覆盖新状态） */
    readonly WORKSPACE_STATUS_CHANGED: 'workspace:status-changed';
    /** invoke：列出某文件的阅读书签/批注 */
    readonly MARKS_LIST: 'marks:list';
    /** invoke：新建阅读书签/批注 */
    readonly MARKS_CREATE: 'marks:create';
    /** invoke：更新阅读书签/批注 */
    readonly MARKS_UPDATE: 'marks:update';
    /** invoke：删除阅读书签/批注 */
    readonly MARKS_DELETE: 'marks:delete';
    /** invoke：本书内卡片全文搜（标题/摘录/批注/AI 洞见，走 marks_fts） */
    readonly MARKS_SEARCH: 'marks:search';
    /** invoke：按章查卡（走 chapter_key 索引，另捎带未固化卡由调用方窄化） */
    readonly MARKS_LIST_BY_CHAPTER: 'marks:list-by-chapter';
    /** invoke：本书待复习列表（未复习优先、其次最久未复习） */
    readonly FLASHCARDS_LIST_DUE: 'flashcards:list-due';
    /** invoke：记一次复习评分 */
    readonly FLASHCARDS_APPEND_REVIEW: 'flashcards:append-review';
    /** invoke：取某书会话行（无则 null，调用方建新会话后 put） */
    readonly AI_SESSIONS_GET: 'ai-sessions:get';
    /** invoke：upsert 会话行 */
    readonly AI_SESSIONS_PUT: 'ai-sessions:put';
    /** invoke：prompt 成功后计数 + 保活 */
    readonly AI_SESSIONS_TOUCH: 'ai-sessions:touch';
    /** invoke：列出可用 ACP Agent 运行时（如 codex-acp） */
    readonly ACP_LIST_RUNTIMES: 'acp:list-runtimes';
    /** invoke：连接前探测 Codex/ACP 认证是否已就绪 */
    readonly ACP_AUTH_PREFLIGHT: 'acp:auth-preflight';
    /** invoke：走 ACP authMethods 完成认证 */
    readonly ACP_AUTHENTICATE: 'acp:authenticate';
    /** invoke：拉起 ACP 传输并连接 */
    readonly ACP_CONNECT: 'acp:connect';
    /** invoke：断开 ACP 并清理子进程 */
    readonly ACP_DISCONNECT: 'acp:disconnect';
    /** invoke：加载已有 ACP session（恢复历史） */
    readonly ACP_LOAD_SESSION: 'acp:load-session';
    /** invoke：ACP session/new */
    readonly ACP_SESSION_NEW: 'acp:session-new';
    /** invoke：向当前 session 发送 prompt */
    readonly ACP_PROMPT: 'acp:prompt';
    /** invoke：取消正在进行的 prompt */
    readonly ACP_CANCEL: 'acp:cancel';
    /** invoke：设置 ACP 会话配置项（模型等） */
    readonly ACP_SET_CONFIG_OPTION: 'acp:set-config-option';
    /** invoke：读取自定义模型供应商配置（Key 不回传，只给 hasApiKey） */
    readonly ACP_PROVIDER_GET: 'acp:provider-get';
    /** invoke：保存自定义模型供应商配置（base URL + API Key + 模型） */
    readonly ACP_PROVIDER_SAVE: 'acp:provider-save';
    /** invoke：清除自定义供应商配置，回到本机 ~/.codex 订阅登录 */
    readonly ACP_PROVIDER_CLEAR: 'acp:provider-clear';
    /** invoke：读取 ACP 子进程代理设置 */
    readonly ACP_PROXY_GET: 'acp:proxy-get';
    /** invoke：保存 ACP 子进程代理设置（重新连接后生效） */
    readonly ACP_PROXY_SAVE: 'acp:proxy-save';
    /** send：渲染进程回复 Agent 的权限询问 */
    readonly ACP_PERMISSION_RESPONSE: 'acp:permission-response';
    /** send：渲染进程回传快照内容 */
    readonly ACP_SNAPSHOT_RESPONSE: 'acp:snapshot-response';
    /** main→renderer：ACP session/update 流式事件 */
    readonly ACP_SESSION_UPDATE: 'acp:session-update';
    /** main→renderer：ACP 连接/会话状态变化 */
    readonly ACP_STATUS_CHANGED: 'acp:status-changed';
    /** main→renderer：Agent 请求工具权限，需 UI 确认 */
    readonly ACP_PERMISSION_REQUEST: 'acp:permission-request';
    /** main→renderer：Agent 要当前编辑器/阅读器快照 */
    readonly ACP_SNAPSHOT_REQUEST: 'acp:snapshot-request';
    /** invoke：探测本机 Antigravity CLI (agy) 状态与路径 */
    readonly ACP_PROBE_AGY_CLI: 'acp:probe-agy-cli';
    /** invoke：一键安装 Antigravity CLI (agy) 并配置环境变量 */
    readonly ACP_INSTALL_AGY_CLI: 'acp:install-agy-cli';
    /** invoke：抓取在线文档一页 HTML */
    readonly WEB_DOC_FETCH_PAGE: 'web-doc:fetch-page';
    /** invoke：发现在线文档目录（TOC） */
    readonly WEB_DOC_DISCOVER_TOC: 'web-doc:discover-toc';
    /** invoke：读取 PDF OCR 目录缓存 */
    readonly OCR_GET_PDF_TOC: 'ocr:get-pdf-toc';
    /** invoke：对 PDF 目录页做 OCR 并缓存 */
    readonly OCR_RECOGNIZE_PDF_TOC: 'ocr:recognize-pdf-toc';
    /** invoke：探测 PDF 目录页范围（只建议范围，不识别不缓存） */
    readonly OCR_DETECT_PDF_TOC_PAGES: 'ocr:detect-pdf-toc-pages';
    /** invoke：删除某 PDF 的目录 OCR 缓存 */
    readonly OCR_DELETE_PDF_TOC: 'ocr:delete-pdf-toc';
    /** invoke：读取某页 PDF OCR 缓存 */
    readonly OCR_GET_PDF_PAGE: 'ocr:get-pdf-page';
    /** invoke：对指定 PDF 页 OCR 并缓存 */
    readonly OCR_RECOGNIZE_PDF_PAGE: 'ocr:recognize-pdf-page';
    /** invoke：列出已缓存 OCR 的 PDF 页码 */
    readonly OCR_LIST_PDF_PAGES: 'ocr:list-pdf-pages';
    /** invoke：清除单个 PDF 的 OCR 缓存 */
    readonly OCR_CLEAR_PDF_CACHE: 'ocr:clear-pdf-cache';
    /** invoke：清除全部 PDF OCR 缓存 */
    readonly OCR_CLEAR_ALL_CACHE: 'ocr:clear-all-cache';
    /** invoke：手动保存 PDF 目录 OCR 结果 */
    readonly OCR_SAVE_PDF_TOC: 'ocr:save-pdf-toc';
    /** invoke：OCR 组件（语言包/引擎）是否就绪 */
    readonly OCR_GET_COMPONENT_STATUS: 'ocr:get-component-status';
    /** invoke：下载并确保 OCR 组件可用 */
    readonly OCR_ENSURE_COMPONENT: 'ocr:ensure-component';
    /** invoke：取消 OCR 组件下载 */
    readonly OCR_CANCEL_COMPONENT_DOWNLOAD: 'ocr:cancel-component-download';
    /** main→renderer：OCR 组件下载/就绪状态推送 */
    readonly OCR_COMPONENT_STATUS: 'ocr:component-status';
    /** invoke：pdf-inspector 分类（类型/页数/待 OCR 页） */
    readonly PDF_INSPECT_CLASSIFY: 'pdf-inspect:classify';
    /** invoke：pdf-inspector 整档 Markdown（原生文字层） */
    readonly PDF_INSPECT_BOOK_MARKDOWN: 'pdf-inspect:book-markdown';
    /** invoke：扫描书一键导入罗盘索引（长任务，进度另走推送） */
    readonly ROSETTA_IMPORT_BOOK: 'rosetta:import-book';
    /** send：取消正在进行的罗盘导入 */
    readonly ROSETTA_CANCEL_IMPORT: 'rosetta:cancel-import';
    /** invoke：查询当前导入快照（窗口重载后恢复进度显示），无则返回 null */
    readonly ROSETTA_ACTIVE_IMPORT: 'rosetta:active-import';
    /** main→renderer：罗盘导入进度推送 */
    readonly ROSETTA_IMPORT_STATUS: 'rosetta:import-status';
    /** invoke：查询某书罗盘索引信息，未导入返回 null */
    readonly ROSETTA_BOOK_INFO: 'rosetta:book-info';
    /** invoke：罗盘统一读查询（页/章/目录/搜索/上下文/目录项） */
    readonly ROSETTA_QUERY_BOOK: 'rosetta:query-book';
    /** invoke：纯本地重建罗盘目录索引（只写 toc_entries/chapters/块归属，不调 OCR） */
    readonly ROSETTA_REBUILD_TOC: 'rosetta:rebuild-toc';
    /** invoke：只读预览正文水印清洗（readOnly + query_only，不写库，最多 20 条样例） */
    readonly ROSETTA_PREVIEW_BODY_WATERMARK: 'rosetta:preview-body-watermark';
    /** invoke：备份并应用正文水印清洗（先备份校验，再单事务条件写，需二次确认后调用） */
    readonly ROSETTA_APPLY_BODY_WATERMARK: 'rosetta:apply-body-watermark';
    /** invoke：已入库内容只读取证（readOnly + query_only，不写库；指纹由渲染端绑定当前文档） */
    readonly ROSETTA_INSPECT_CONTENT: 'rosetta:inspect-content';
    /** invoke：追加保存测验记录到 JSONL */
    readonly QUIZ_APPEND_SESSION: 'quiz:append-session';
    /** invoke：读取所有历史测验记录 */
    readonly QUIZ_GET_ALL_SESSIONS: 'quiz:get-all-sessions';
    /** invoke：按书籍路径读取测验历史 */
    readonly QUIZ_GET_SESSIONS_BY_FILE: 'quiz:get-sessions-by-file';
    /** invoke：读取同步配置 */
    readonly SYNC_GET_CONFIG: 'sync:get-config';
    /** invoke：保存同步配置 */
    readonly SYNC_SAVE_CONFIG: 'sync:save-config';
    /** invoke：测试 WebDAV 连通性与权限 */
    readonly SYNC_TEST_CONNECTION: 'sync:test-connection';
    /** invoke：立即执行一次双向同步 */
    readonly SYNC_RUN_NOW: 'sync:run-now';
    /** invoke：获取当前同步状态 */
    readonly SYNC_GET_STATUS: 'sync:get-status';
    /** main→renderer：同步状态更新推送 */
    readonly SYNC_STATUS_CHANGED: 'sync:status-changed';
    /** main→renderer：推送远端最新阅读进度给渲染端 Store */
    readonly SYNC_APPLY_REMOTE_PROGRESS: 'sync:apply-remote-progress';
    /** invoke：渲染端把最新阅读进度快照推送到主进程持久化保存 */
    readonly SYNC_SAVE_LOCAL_PROGRESS: 'sync:save-local-progress';
    /** invoke：获取 TTS 配置 */
    readonly TTS_GET_CONFIG: 'tts:get-config';
    /** invoke：保存 TTS 配置 */
    readonly TTS_SAVE_CONFIG: 'tts:save-config';
    /** invoke：语音合成（带本地磁盘缓存与双 Key 容灾） */
    readonly TTS_SYNTHESIZE: 'tts:synthesize';
    /** invoke：启动流式语音合成（首包即播 + 边播边拼装） */
    readonly TTS_SYNTHESIZE_STREAM: 'tts:synthesize-stream';
    /** send / invoke：取消当前流式合成 */
    readonly TTS_CANCEL_STREAM: 'tts:cancel-stream';
    /** main→renderer：TTS 流式音频分片推送 */
    readonly TTS_STREAM_CHUNK: 'tts:stream-chunk';
    /** main→renderer：排队、分段接收与完成进度 */
    readonly TTS_STREAM_PROGRESS: 'tts:stream-progress';
    /** main→renderer：TTS 流式合成完成推送（携带完整音频） */
    readonly TTS_STREAM_END: 'tts:stream-end';
    /** main→renderer：TTS 流式合成出错推送 */
    readonly TTS_STREAM_ERROR: 'tts:stream-error';
    /** invoke：测试指定 API Key 有效性 */
    readonly TTS_TEST_KEY: 'tts:test-key';
    /** invoke：获取本地音频缓存统计 */
    readonly TTS_GET_CACHE_STATS: 'tts:get-cache-stats';
    /** invoke：清空本地音频缓存 */
    readonly TTS_CLEAR_CACHE: 'tts:clear-cache';
    /** invoke：获取云端实际可用的语音模型列表 */
    readonly TTS_LIST_MODELS: 'tts:list-models';
    /** invoke：获取指定厂商的可用音色列表 */
    readonly TTS_LIST_VOICES: 'tts:list-voices';
    /** invoke：创建异步批量语音合成任务 (Batch API，半价折扣) */
    readonly TTS_CREATE_BATCH_JOB: 'tts:create-batch-job';
    /** invoke：查询异步批量任务状态与结果 */
    readonly TTS_GET_BATCH_JOB: 'tts:get-batch-job';
    /** invoke：取消异步批量任务 */
    readonly TTS_CANCEL_BATCH_JOB: 'tts:cancel-batch-job';
    /** invoke：查询指定目录 Git 仓库状态（分支、修改文件、ahead/behind） */
    readonly GIT_STATUS: 'git:status';
    /** invoke：推送到远程仓库（自动复用 WSL 或本机的 SSH/凭据） */
    readonly GIT_PUSH: 'git:push';
    /** invoke：提交修改 */
    readonly GIT_COMMIT: 'git:commit';
    /** invoke：B3 读取未暂存/已暂存 diff（过长截断并标记） */
    readonly GIT_DIFF: 'git:diff';
    /** invoke：B3 列出分支与当前分支（游离 HEAD 显式标记） */
    readonly GIT_BRANCHES: 'git:branches';
    /** invoke：B2 经宿主读文本（返回内容、编码/换行信息与 revision） */
    readonly WORKSPACE_READ_TEXT: 'workspace:read-text';
    /** invoke：B2 经宿主写文本（携带 expectedRevision；冲突报 REVISION_CONFLICT） */
    readonly WORKSPACE_WRITE_TEXT: 'workspace:write-text';
    /** invoke：B2 远端另存为（远端目录选择语义，不弹 Windows 对话框） */
    readonly WORKSPACE_SAVE_TEXT_AS: 'workspace:save-text-as';
    /** invoke：B2 经宿主读图片（相对预览图片，不走 renderer 文件接口） */
    readonly WORKSPACE_READ_IMAGE: 'workspace:read-image';
    /** invoke：列出系统动态探测到的 WSL 分发版 */
    readonly REMOTE_LIST_WSL_DISTROS: 'remote:list-wsl-distros';
    /** invoke：获取 WSL 指定分发版的 Linux 用户家目录（$HOME） */
    readonly REMOTE_GET_WSL_HOME: 'remote:get-wsl-home';
    /**
     * invoke：应用内浏览 WSL Linux 目录（B1 起经 Ubuntu 远端服务原生执行，
     * 不走 Windows UNC；调用前须先 remote:wsl-connect 建连，断线/未连接
     * 返回明确错误，禁静默回落 UNC 或伪装空目录）。
     */
    readonly REMOTE_BROWSE_WSL: 'remote:browse-wsl';
    /** invoke：经 wsl.exe 管道安装/启动远端服务并完成握手，返回连接状态 */
    readonly REMOTE_WSL_CONNECT: 'remote:wsl-connect';
    /** invoke：断开 WSL 远端连接并清理本连接启动的服务进程 */
    readonly REMOTE_WSL_DISCONNECT: 'remote:wsl-disconnect';
    /** invoke：查询当前 WSL 远端连接状态（含握手信息与代际） */
    readonly REMOTE_WSL_STATUS: 'remote:wsl-status';
    /** invoke：查询远端文件/目录 stat（Ubuntu 服务原生执行） */
    readonly REMOTE_WSL_STAT: 'remote:wsl-stat';
    /** invoke：打开远端工作区（连接选中根→注册远端宿主→绑定调用窗口→返回初始树） */
    readonly REMOTE_WSL_OPEN_WORKSPACE: 'remote:wsl-open-workspace';
    /** invoke：解析本机 ~/.ssh/config 里的 Host 主机列表 */
    readonly REMOTE_LIST_SSH_CONFIG_HOSTS: 'remote:list-ssh-config-hosts';
    /** invoke：启动本地管道远端服务并完成版本握手 */
    readonly REMOTE_SERVER_CONNECT: 'remote-server:connect';
    /** invoke：经已连接服务执行一次 workspace 协议调用 */
    readonly REMOTE_SERVER_INVOKE: 'remote-server:invoke';
    /** invoke：断开指定连接并回收服务进程 */
    readonly REMOTE_SERVER_DISCONNECT: 'remote-server:disconnect';
    /** invoke：查询本地管道连接状态（含握手信息） */
    readonly REMOTE_SERVER_STATUS: 'remote-server:status';
};
/** `IPC` 全部通道字符串的联合类型，用于约束 handle/on/invoke 的 channel 参数 */
export type IpcChannel = (typeof IPC)[keyof typeof IPC];
//# sourceMappingURL=channels.d.ts.map