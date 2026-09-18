# 设备管理系统标准版 — 项目约定

> 当前需求范围与项目进度的**唯一权威文档是 `docs/PROJECT-STATUS.md`**，先读它再动手。
> 历史设计/需求文档已全部移入 `docs/archive/`（其中的范围结论已过时，只作背景参考，不得作为删除功能的依据）。

## 铁律（违反 = 重大事故，必须先问用户）

1. **点检 / 保养 / 巡检页面（src/pages/Inspection*、Maintenance*、Patrol*，共 27 个文件 + App.jsx 中对应菜单与路由 + 报表中心 /report/inspection|patrol|maintenance）是用户明确要求保留的业务模块，永久不得删除或移除。** 历史上它们已被误删过两次、重建过两次，绝不允许第三次。任何文档中"范围外/不做"的表述仅指其业务闭环归属点巡保养业务模块，不等于可以删页面。
2. **删除/覆盖任何文件前必须先向用户确认并列出清单**，尤其是页面文件、数据种子、specs 内容。项目虽有本地 git 兜底，但确认规则不豁免。
3. 需求细则（src/specs/pageSpecs.jsx）必须与页面同步维护，新增/修改页面时一并更新。

## 架构速查（改代码前先看这里，避免重复踩坑）

- 技术栈：React 19 + AntD 6 + React Router 7（HashRouter）+ Vite 7 + vite-plugin-singlefile，产物为双击即开的 dist/index.html。
- 状态：`src/state/DemoStore.jsx` 的 `useDemoState()` **直接返回 state**（不要解构 `{ state }`，会得到 undefined）。lastAction 在 `state.meta.lastAction`（不是 ui.lastAction）。
- 动作：`src/state/actions.js` 工厂 + `src/state/reducer.js`（动作白名单 + 幂等键 entities.idempotencyByKey）。领域规则在 `src/domain/*.js`， selectors 在 `src/state/selectors.js`（OEE 全部派生，不落静态值）。
- 设备唯一标识：canonical `DEV-001..008` ↔ 资产编码 MT2024A1201..1208，映射唯一来源 `src/data/demo/deviceCrosswalk.js`。空值显示 `--`（null ≠ 0）；sourceTime 与 receiveTime 分开。
- 演示时钟：基准 2026-09-16T16:41:08+08:00，每个动作 tick+1（约 +7 秒）。
- 范围外演示模块（点检/保养/巡检）：只读种子来自 `src/data/standardData.js`，执行交互用页面内 useState，完整闭环归属点巡保养业务模块。
- `/permissions`、`/audit` 统一走 ScopeNoticePage。

## 验证流程（每次改动后必跑）

1. `npm run build`（esbuild 语法检查单文件可用：`npx esbuild <file> --loader:.jsx=jsx --jsx=automatic --log-level=error`，**只看 stderr，stdout 是编译产物**）。
2. `node check-pages.cjs`：Playwright 对 dist/index.html 全 84 路由烟测（file:// 打开），要求 0 空白、0 JS 错误。
3. 涉及业务闭环时用 Node 在 reducer 层验证场景（报警→维修→停机→备件→OEE 幂等与状态推进）。

## git

本地仓库已初始化（main 分支）。**每完成一个稳定阶段就 commit**，保持可回滚。
