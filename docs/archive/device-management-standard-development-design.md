> ⚠️ **本文档已归档（2026-09-16），其中 §0.3「明确不做」与 §7.3「范围外路由」已过时：点检/保养/巡检三模块应需求方要求已恢复为演示模块并保留，任何后续迭代不得再移除。当前需求范围与项目状态唯一以 `docs/PROJECT-STATUS.md` 为准。**

# 东浩智创设备管理系统标准版：前端演示闭环开发设计方案

> 版本：V1.0
> 日期：2026-09-16
> 适用工程：`D:/项目管理/项目管理/东浩智创-设备管理监测/设备管理系统标准版`
> 执行对象：GLM-5.3 Flash（前端编码代理）
> 文档定位：可直接执行的前端演示开发设计，不等同于生产后端或真实 IoT 实施方案。

---

## 0. 执行契约（必须先读）

### 0.1 目标

在现有 React 19 + Ant Design 6 + Vite 7 单文件工程内，完成“设备资产—IoT 绑定—数据健康—运行监测—报警—维修—备件—停机—OEE—报表—大屏”的**可演示、可追踪、跨页面同步的前端业务闭环**。保持现有部署形态：不新增后端服务器，不改变 `dist/index.html` 单文件交付方式。

本方案以当前标准版产品内容为功能范围依据，以 `docs/架构设计-数据接入与物联网平台集成V2.md`（V2.1）作为 IoT 系统边界和数据责任的最高约束；历史文档与 README 仅用于识别现状。若发现基线冲突，停止自行猜测，记录冲突并报告，不得通过代码绕过。

### 0.2 范围锁

本次只实现以下业务域：

1. 工作台；
2. 设备资产基础档案、设备详情和统一设备履历；
3. IoT 绑定、平台指标只读消费、接入健康、程序参数比对处理记录；
4. 运行监测、设备详情、OEE、计划停机和实际停机事实；
5. 报警中心、报警规则版本、通知策略的演示闭环；
6. 报修、派工、维修执行、维修验收/返修和维修履历；
7. 备件台账、入库、预留、出库、退库和库存流水；
8. 运行/OEE、报警、数据质量、维修、库存、生产/质量报表；
9. 唯一权威的只读监测大屏。

### 0.3 明确不做

不得在本方案范围内新增或扩展：

- 平台统一登录、统一身份认证、账号、组织、角色、权限、会话、平台级审计/日志服务；
- 本系统自己的 `Login`、`Permission`、`RBAC`、`Audit`、`Log` 领域对象或管理页面；
- 点检、巡检、保养的内部项目、标准、计划、任务、执行和报表流程；
- PLC、网关、协议、IP、端口、点位地址、采集规则和边缘节点维护；
- 真实 IoT、WebSocket、MQTT、MES、后端 API、数据库、消息队列或远程控制；
- 采购、到货验收、安装调试、调拨、维保合同、财务资产和完整报废供应链；除非另行确认，不得用菜单占位暗示已交付。

点检/巡检/保养如产生异常，只定义复用 `deviceId`、报警、维修和备件公共对象的接口边界，不设计其内部业务。

### 0.4 公共服务依赖契约

宿主平台提供：当前用户上下文、组织/设备范围上下文、可执行的业务动作标识、宿主跳转信息和平台级日志。本系统只消费这些上下文：

- 页面按上下文显示或禁用业务动作；
- 上下文缺失、过期或不允许动作时，显示明确原因，不伪造成功；
- 本系统保留设备、绑定、报警、维修、库存、停机、OEE、接入任务等**业务履历**；
- 不重复建设平台公共服务，也不把公共服务当作本系统开发任务。

当前独立演示工程可保留现有登录页作为启动壳，但 GLM 不得扩展登录逻辑；后续嵌入宿主平台时，以宿主上下文替换启动壳。

### 0.5 防跑偏硬规则

1. 每次改动前先读取目标文件及其导入依赖，不得凭文件名猜结构。
2. 每批只改一个业务域；先列计划，再改代码，再执行构建和路由烟测。
3. 页面禁止直接 import 旧静态业务数组并修改数组；业务事实只能经 Store、actions、selectors 获取和改变。
4. 所有跨模块引用必须使用 canonical `deviceId`，禁止通过名称、数组顺序或字符串拼接推导设备。
5. IoT 平台在本系统中只呈现绑定、平台指标、健康和消费结果；不得编辑协议、网关、IP、端口、点位。
6. `null`、`--`、暂无数据、未配置、数据质量不足、不适用和数字 `0` 必须严格区分。
7. `sourceTime` 决定统计分桶；`receiveTime` 只用于数据延迟；不得混用。
8. 每个动作必须声明输入、状态变化、关联实体、幂等键和用户反馈；不得只 toast 而不更新共享状态。
9. 无真实订阅只能称“演示订阅/演示轮询/降级模式”，不得宣称真实实时或秒级报警。
10. 旧路由、点巡保养和公共服务路由只能进入 `ScopeNoticePage` 或宿主接管说明，不得自动跳转到可执行页面。
11. 详情参数无效时显示明确空态和返回入口，禁止 `|| rows[0]` 回退第一条记录。
12. 发现设备 ID 冲突、口径无法解释、接口契约未确认或构建失败时停止扩展并报告，不得自行猜测。
13. 不得删除现有页面或数据；如需迁移，先列旧文件—新对象—回退方式。
14. 每一小批输出：已修改文件、未实现功能、已知风险、构建结果、路由烟测结果。

---

## 1. 产品复审结论与开发目标

当前标准版已经具备较广的页面骨架，但还不是可验收的闭环产品。最大问题不是缺少菜单，而是不同页面分别持有设备、报警、维修、库存、停机和 OEE 事实，导致“页面提示成功、下游不变化”。本次开发必须从对象和业务事实收敛，而不是继续增加页面。

核心链路：

```text
统一业务设备
  → IoT 绑定版本与指标
  → 数据健康 / 实时状态
  → 报警事件
  → 确认 / 处置 / 故障主线
  → 维修派工 / 执行 / 验收
  → 停机事实 + 备件预留 / 出库 / 退库
  → 设备恢复 / 报警关闭
  → OEE 重算、报表、工作台、设备履历、大屏
```

“完成”不以新增页面数量判定，而以八条演示验收场景通过判定。

---

## 2. 技术与目录设计

### 2.1 现有工程约束

- React 19.2、Ant Design 6.1、React Router DOM 7.9、Recharts 3.4、Vite 7；
- 当前为纯前端演示，内置静态数据，最终产物为可双击的 `dist/index.html`；
- 使用现有深青蓝/冷灰蓝 Ant Design 视觉，不引入赛博霓虹、营销 Hero、3D 装饰；
- 优先复用 `PageHeader`、`MetricTile`、`ReportFilter`、现有表格、状态标签和大屏视觉。

### 2.2 推荐目录

```text
src/
  domain/
    device.js
    binding.js
    iot.js
    monitoring.js
    alarm.js
    repair.js
    spare.js
    downtime.js
    oee.js
    report.js
  data/
    demo/
      devices.js
      deviceCrosswalk.js
      bindings.js
      metrics.js
      samples.js
      health.js
      alarms.js
      repairs.js
      spares.js
      downtime.js
      oee.js
      reports.js
      programCompare.js
      screen.js
      index.js
    demoData.js                 # 兼容导出，迁移完成前保留
    standardData.js              # 兼容导出，迁移完成前保留
    oeeData.js                   # 兼容导出，迁移完成前保留
  state/
    DemoStore.jsx
    reducer.js
    actions.js
    selectors.js
    persistence.js
  services/
    provider.js
    demoProvider.js
    realtimeProvider.js
    providerConfig.js
  components/
    DataSourceBadge.jsx
    DegradedBanner.jsx
    ScopeNoticePage.jsx
    EmptyState.jsx
    StatusTag.jsx
    MetricSourceChain.jsx
    EntityDrawer.jsx
    ReportToolbar.jsx
  routes/
    routeConfig.js
```

`domain/` 只能放纯 JavaScript 的枚举、校验、状态转换和计算，不得引用 React、Ant Design、localStorage。`data/demo/` 只提供初始快照。页面局部 state 只允许保存筛选、分页、弹窗和未提交草稿。

### 2.3 关键现有文件

执行前必须先读：

- `src/App.jsx`：应用壳、菜单、路由和大屏短路；
- `src/data/standardData.js`：资产、绑定、平台指标、维修/备件种子；
- `src/data/demoData.js`：监测、报警、质量、报表种子；
- `src/data/oeeData.js`：现有 OEE 数据与计算；
- `src/services/provider.js`、`demoProvider.js`、`providerConfig.js`、`index.js`：数据源抽象；
- `src/pages/DeviceNetConfigPage.jsx`、`BindingOverviewPage.jsx`；
- `src/pages/AlarmCenterPage.jsx`；
- `src/pages/RepairOrdersPage.jsx`、`RepairExecutePage.jsx`；
- `src/pages/SparePartsStockPage.jsx`；
- `src/pages/PlannedDowntimePage.jsx`、所有 OEE 页面；
- `src/components/ReportFilter.jsx`；
- `src/pages/DeviceScreenStandalone.jsx`、`src/screen/deviceScreen.html`；
- `check-pages.cjs`（如存在，先读取后扩展）。

---

## 3. Canonical 设备身份与数据模型

### 3.1 设备 crosswalk（第一优先级）

建立 `src/data/demo/deviceCrosswalk.js`，每条业务设备固定一条映射：

```js
{
  deviceId: 'device-004',
  assetCode: 'MT2024A1204',
  monitorCode: 'DEV-004',
  name: '数控铲齿机-04',
  ledgerRecordId: 'ledger-004',
  bindingId: 'binding-004-v1',
  oeeDeviceId: 'OEE-004',
  screenDeviceId: 'screen-004',
  iotMainDeviceId: 'iot-main-004',
  organizationId: 'org-demo',
  workshopId: 'workshop-a',
  lineId: 'line-a',
  stationId: 'station-04'
}
```

字段值以项目实际读取结果为准；不能凭示例覆盖真实数据。所有页面只传 `deviceId`，展示时由 selector 得到资产码、监测码、IoT 来源码和名称。禁止 `DEV-00x → MT2024A12xx` 字符串推导。

### 3.2 核心对象

#### DeviceAsset

`deviceId`、`assetCode`、`name`、`model`、`type`、`organizationId`、`workshopId`、`lineId`、`stationId`、`lifecycleStatus`、`oeeEligibility`、`responsibleContext`。

状态轴必须分开：

- 资产生命周期：草稿、在用、闲置、停用、报废/归档；
- 绑定配置：未配置、草稿、待生效、已启用、换绑中、已停用；
- 通信健康：正常、延迟、部分中断、数据中断、未知；
- 运行状态：运行、待机、计划停机、故障停机、维修中、无数据；
- 维修锁定：可维修、维修中、待验收；
- 生产可用性：可生产、计划停机、故障停机、待料、未配置。

#### DeviceBinding / BindingItem / MetricSelection

一个活动绑定版本对应一个业务设备；必须恰好一个 IoT 主设备，可有多个 IoT 子传感器。指标按来源设备分组，至少选择一项有效指标才能启用。绑定换绑不覆盖旧版本，保存 `effectiveFrom/effectiveTo` 和影响范围。

#### MetricSample / SourceHealth

样本至少包含 `deviceId`、`bindingVersion`、`iotDeviceId`、`metricCode`、`metricVersion`、`sourceTime`、`receiveTime`、`value`、`qualityCode`、`idempotencyKey`。健康状态不能覆盖绑定配置状态。

#### AlarmRule / AlarmEvent / NotificationDelivery

报警事件包含 `deviceId`、`bindingVersion`、规则版本、指标来源、严重度、状态、去重键、重复次数、处理人上下文、通知结果、关联维修单、恢复和关闭依据。

通知演示记录发送、送达、失败、重试和升级结果；不实现真实消息服务。

#### RepairReport / RepairOrder / RepairAcceptance

维修申请和维修主工单统一对象。主工单包含来源、设备、报警、故障现象、等级、责任上下文、SLA 时间、停机事实、备件、维修时间线、验收记录和返修记录。

#### SpareStock / StockReservation / Inbound / Outbound / Return

库存至少区分仓库、现存、预留、已出库、可退库、可用、单位、批次/序列号和关联工单。维修领料只能生成与 `repairOrderId` 幂等关联的出库事实。

#### DowntimeFact

计划停机、故障停机、维修停机、换模、待料、数据中断等统一为停机事实，包含 `deviceId`、开始/结束、原因分类、来源、班次、计划关联、报警关联、工单关联、生产影响和重叠裁决。

#### OeeConfig / OeeResult

包含 OEE 资格、班次日历、目标、理想速度/标准节拍、产量、良品、不良品、计划停机和实际停机口径。OEE 结果必须能返回各组成指标、数据状态、损失原因和下钻对象。

---

## 4. DemoState、Provider 与持久化

### 4.1 DemoState

```text
DemoState
├── meta
│   ├── mode: demo
│   ├── source: demo
│   ├── provider: mock-subscription | mock-polling
│   ├── updatedAt
│   ├── lastSampleAt
│   ├── latencySec
│   ├── degraded
│   └── timezone
├── entities
│   ├── devicesById
│   ├── crosswalkById
│   ├── bindingsByDeviceId
│   ├── bindingVersionsById
│   ├── sourceDevicesById
│   ├── metricsByKey
│   ├── samplesByKey
│   ├── healthBySource
│   ├── alarmRulesById
│   ├── alarmRuleVersionsById
│   ├── alarmEventsById
│   ├── notificationDeliveriesById
│   ├── repairReportsById
│   ├── repairOrdersById
│   ├── repairAcceptancesById
│   ├── sparesByCode
│   ├── stockByWarehouseAndSpare
│   ├── inboundsById
│   ├── outboundsById
│   ├── returnsById
│   ├── downtimeFactsById
│   ├── oeeConfigByDeviceId
│   ├── oeeResultsByKey
│   ├── programCompareById
│   ├── ingestionTasksById
│   ├── businessHistoryById
│   └── reportsByKey
└── ui
    ├── filtersByRoute
    ├── screenPage
    └── lastAction
```

### 4.2 持久化

- 初始快照由 `src/data/demo/index.js` 创建；
- 只将可序列化业务快照写入 `localStorage` 键 `dms-demo:state`；
- 解析失败、版本不兼容或存储不可用时回到初始快照，并给出明确演示提示；
- `resetDemo` 清空快照并恢复三个标准剧本的初始状态；
- 不把临时弹窗、输入草稿和分页写入业务快照。

### 4.3 Provider 统一契约

统一 `DataProvider` 返回：

```js
{
  data,
  source: 'demo',
  updatedAt,
  isStale,
  degraded,
  latency,
  error
}
```

`RealtimeDataProvider` 只实现：

- mock subscription：演示事件推送；
- mock polling：演示轮询；
- disconnect/reconnect：演示降级和恢复。

不新增真实 API、token、WebSocket、MQTT 或认证代码。`createApiProvider` 可保留兼容，但本次页面不得切换到真实 API。

---

## 5. Reducer、Actions、Selectors

### 5.1 Action 通用结构

```js
{
  type: 'alarm/ack',
  actionId: 'demo-action-20260916-0001',
  idempotencyKey: 'ack:alarm-004-001:v1',
  actorContext: { userId: 'demo-user', source: 'host-context' },
  at: '2026-09-16T08:00:00+08:00',
  payload: { alarmId, note }
}
```

演示时间应使用确定性时间；重复 `idempotencyKey` 必须返回同一结果，不得重复创建事实。

### 5.2 动作白名单

```text
validateSource
addSource
removeSource
toggleMetric
saveBinding
enableBinding
disableBinding
refreshRealtime
setProviderMode
raiseAlarm
ackAlarm
handleAlarm
createRepairFromAlarm
createRepairReport
assignRepair
startRepair
pauseRepair
resumeRepair
consumeSpare
returnSpare
submitRepair
acceptRepair
rejectRepair
finishRepair
closeAlarm
saveDowntime
deleteDowntime
saveSpeedConfig
saveOeeConfig
recomputeOee
runReport
createExportTask
setScreenPage
resetDemo
```

每个 action 必须写明：输入实体、前置状态、状态变化、关联实体、幂等键、成功反馈、失败反馈和可重放行为。

### 5.3 必须提供的 selectors

- `selectDevice(deviceId)`、`selectDeviceCrosswalk(deviceId)`；
- `selectBinding(deviceId)`、`selectBindingImpact(deviceId)`；
- `selectRealtime(deviceId)`、`selectHealth(deviceId)`；
- `selectActiveAlarms(deviceId)`、`selectAlarmTimeline(alarmId)`、`selectNotificationDeliveries(alarmId)`；
- `selectRepairById(repairOrderId)`、`selectRepairThread(deviceId)`；
- `selectAvailableStock(warehouseId, spareCode)`、`selectRepairParts(repairOrderId)`；
- `selectDowntime(deviceId, range)`、`selectPlannedVsActual(deviceId, range)`；
- `selectOeeResult(deviceId, range, shiftId, materialId)`、`selectOeeLosses(...)`；
- `selectReport(theme, filters)`；
- `selectScreenViewModel(filters)`；
- `selectBusinessHistory(entityType, entityId)`。

页面只能消费 selectors 的读模型，不得自己拼装跨域事实。

---

## 6. 状态机与跨模块联动

### 6.1 绑定

```text
待配置 → 编辑草稿 → 校验中 → 校验通过 → 待生效 → 已启用
已启用 → 已停用
已启用 → 换绑中：关闭旧版本 → 新版本待生效/已启用
```

健康状态独立：正常、延迟、部分中断、数据中断、恢复中、补偿中。空绑定必须能创建首个绑定；主设备只能一个；活动 IoT 来源编码不可重复占用；失效指标不能静默继续参与报警/OEE。

### 6.2 接入任务

```text
已创建 → 执行中 → 成功
                 ↘ 部分成功 → 可重试
                 ↘ 失败 → 重试中 / 待人工处理
补偿中 → 补偿成功 / 部分成功 / 人工终止
```

任务详情必须展示设备、指标、时间范围、成功/失败数量、失败原因、影响范围、责任上下文和下一步。死信/缺失数据不可只有静态数组或 toast。

### 6.3 实时 Provider

```text
mock-subscription 正常 → 断开 → mock-polling 降级 → 恢复
```

页面同时展示来源、最后更新时间、延迟、过期和降级。断开时不继续把旧值标成实时。

### 6.4 报警

```text
候选 → 已触发 → 已确认 → 处理中 → 已恢复待关闭 → 已关闭
```

候选条件中断不生成正式事件；同一 `deviceId + ruleVersion + bindingVersion + active` 去重；已关闭不能直接重开，重新触发生成新事件并关联历史。温度/压力可恢复待关闭，通信质量可稳定恢复后自动关闭，程序不一致和维修关联故障需业务处理；实际演示口径全系统一致。

确认必须填写说明；处置必须填写措施和预计完成时间；关闭必须填写恢复证据和原因。关闭前检查设备恢复、维修验收和关联停机；具体动作是否可执行由宿主平台上下文决定。

### 6.5 维修

```text
报修草稿 → 已提交/待派工 → 已派工 → 维修中 → 待验收 → 已完成
                          ↘ 挂起 → 恢复
                          ↘ 已取消
待验收 → 返修 → 维修中
```

一条活动故障默认一张主工单。报警转维修必须幂等并回写 `repairOrderId`。提交维修结果只进入待验收；验收通过才恢复设备/结算，退回返修保留原履历。

### 6.6 备件

```text
领料申请 → 待审核/待预留 → 已出库 → 使用/退库 → 工单结算
入库申请 → 待审核 → 已入库 → 盘点/调整
```

出库数量不得超过指定仓库可用库存；提交出库同时减少该仓库可用量、增加已出库量，并以 `repairOrderId + spareCode + requestId` 幂等。取消、余料或返修支持退库/冲销。

### 6.7 停机

计划停机、故障停机、维修停机、换模、待料、数据中断均写入 `DowntimeFact`。必须校验结束时间、跨天、重叠和取消；计划停机只能按明确口径影响可用率，不能扣性能率或合格率。

### 6.8 OEE

```text
可用率 = 运行时间 / (负荷时间 - 计划停机时间)
性能率 = 实际速度 / 理想速度（或已确认的产出/运行时间口径）
合格率 = 良品 / 总产量
OEE = 可用率 × 性能率 × 合格率
```

统计窗口左闭右开；`sourceTime` 分桶，`receiveTime` 计算延迟；迟到数据回原窗口并触发重算。缺少资格、班次/日历、速度、负荷、产量或质量条件时返回 `null`/“不可计算”，不得用 0。无生产数据的设备整行显示不可计算原因，不只把 OEE 置空而把可用率/性能率伪造成 0。多物料汇总按运行时间/产量加权或明确展示分物料结果，不做无说明的等权平均。

MTTR 使用故障开始至设备恢复/验收的维修事实；MTBF 使用故障事件之间的有效运行时间；不能从页面数值均值推导。

---

## 7. 页面与路由白名单

### 7.1 白名单页面职责

| 业务域 | 页面职责 |
|---|---|
| 工作台 | 待办、报警、维修、库存和接入异常的行动入口，不复制完整 KPI |
| 设备资产 | 台账、基础档案、设备 360 详情、统一履历；采购等生命周期后续不做 |
| 数据接入 | 绑定总览、绑定编辑、平台指标只读、接入任务/质量/补偿、程序比对处理 |
| 运行监测 | 总览做管理判断；实时监控做设备处置；详情做跨模块入口 |
| 报警中心 | 事件状态、通知履历、处置时间线、故障主线、规则版本和策略 |
| 维修管理 | 报修、待派工、派工、执行、待验收、返修、完成、履历 |
| 备品备件 | 台账、入库、领料/预留、出库、退库、库存流水和工单关联 |
| OEE | 实时/历史/详情、资格、目标、速度、班次、计划/实际停机、损失下钻 |
| 报表 | 运行/OEE、报警、数据质量、维修、库存、生产/质量主题 |
| 大屏 | 唯一只读展示，同源 selector，显示演示快照和数据状态 |

### 7.2 建议保留/新增的路由

以现有实际路由为准，只补缺失闭环，不凭本表创建重复页面：

```text
/workbench
/device-ledger
/device-ledger/detail/:deviceId
/device/:deviceId
/device/:deviceId/net-config
/binding-overview
/platform-metrics
/ingestion-tasks
/program-compare
/program-handle-record
/monitor-overview
/realtime
/alarm-center
/alarm-rules
/alarm-rule-versions
/notification-policy
/repair-reports
/repair-pending
/repair-orders
/repair-orders/:repairOrderId
/repair-orders/:repairOrderId/execute
/repair-orders/:repairOrderId/accept
/spare-parts-stock
/spare-parts-inbound
/spare-parts-outbound
/oee-realtime
/oee-history
/oee-history/detail/:deviceId
/oee-speed-config
/planned-downtime
/reports/*
/screen/device
```

### 7.3 范围外路由

点检、巡检、保养、系统管理、权限、审计、旧采集配置和旧数据接入路径统一渲染 `ScopeNoticePage`，说明“由宿主平台或其他业务模块提供/本次演示不包含”，并提供返回白名单入口。旧路由如 `/net-config`、`/metric-dictionary` 只允许重定向到已确认的新白名单页面；不得把范围外页面继续放入菜单。

`/screen/device` 必须绕过后台业务壳，使用 `DeviceScreenStandalone.jsx` + `src/screen/deviceScreen.html` 这一套唯一实现；`MonitorScreenPage.jsx` 不新增能力，可作为兼容文件或标记废弃。

---

## 8. 页面交互规范

### 8.1 页面通用头部

每个白名单页面统一使用：

```jsx
<PageHeader
  title="..."
  subtitle="..."
  source="demo"
  updatedAt={state.meta.updatedAt}
/>
<DataSourceBadge source={state.meta.source} provider={state.meta.provider} />
{state.meta.degraded && <DegradedBanner ... />}
```

页面明确显示：演示/真实（本次只能演示）、数据来源、更新时间、统计截止时间、降级/过期和动作是否仅在演示快照生效。

### 8.2 列表与筛选

- 筛选器必须受控；点击查询改变 selector 输入或显示明确的演示查询反馈；
- 重置恢复默认范围；分页改变展示；导出创建演示导出任务并展示任务状态；
- 下钻必须保留 `deviceId`、组织范围、时间、班次、产线、物料、状态和指标上下文；
- 设备、报警、工单、备件和 OEE 使用统一字典；
- 空结果显示原因和下一步，不显示空白表格或伪造 0；
- 无效详情参数显示“未找到对象”并返回，禁止回退第一条。

### 8.3 动作反馈

弹窗只保存草稿；确认后 dispatch action。成功反馈包含：对象、状态变化、关联对象、影响范围和下一步入口。失败反馈包含：失败原因、是否可重试和当前状态。toast 只作为辅助，不得代替列表、详情、摘要、库存或 OEE 的状态变化。

### 8.4 设备 360 详情

详情页按区块展示：资产档案、绑定/指标、实时健康、活动报警、故障主线、未完成维修、当前停机、备件使用、OEE 摘要、业务履历。任何区块无数据都显示明确空态；所有入口携带 canonical `deviceId`。

### 8.5 大屏

大屏只读、克制、与后台 selector 同源；显示状态文字与图形双编码、最后更新时间、演示快照/降级标识。设备切换必须更新该设备所有内容，不得只替换标题而保留固定龙门铣床趋势/事件数据。

---

## 9. 跨模块动作矩阵

| 动作 | 输入 | 共享状态变化 | 关联实体 | 幂等键 | 反馈 |
|---|---|---|---|---|---|
| `saveBinding` | deviceId、主/子源设备、指标 | 新绑定版本/配置待生效 | 设备、健康、规则、监测、OEE | `binding:deviceId:version` | 生效时间、影响范围 |
| `raiseAlarm` | deviceId、规则、样本 | 新活动事件或合并计数 | 通知、工作台、设备详情 | `alarm:dedupeKey` | 触发原因和来源 |
| `ackAlarm` | alarmId、说明 | 已确认、时间线追加 | 负责人上下文、通知 | `ack:alarmId:version` | 下一步处置 |
| `createRepairFromAlarm` | alarmId、故障信息 | 唯一主工单、报警回写 | 维修、停机、设备 | `repair-from-alarm:alarmId` | 工单号和入口 |
| `consumeSpare` | repairOrderId、仓库、备件、数量 | 预留/出库、仓库余额变化 | 维修成本、设备履历 | `outbound:repairOrderId:spareCode:requestId` | 单据号、余额 |
| `submitRepair` | repairOrderId、措施、验证 | 维修中→待验收 | 报警、停机、备件 | `submit-repair:repairOrderId:version` | 待验收提示 |
| `acceptRepair` | repairOrderId、通过/返修 | 完成或返修、设备恢复条件 | 报警、停机、OEE、履历 | `accept:repairOrderId:version` | 验收结果 |
| `saveDowntime` | deviceId、时间、原因 | 停机事实新增/变更 | OEE、运行报表、工单 | `downtime:deviceId:range:version` | 重算范围 |
| `recomputeOee` | deviceId、统计范围 | OEE 结果和数据状态更新 | 报表、大屏、设备详情 | `oee:deviceId:range:revision` | 公式、影响范围、不可计算原因 |

---

## 10. 三条标准演示剧本

### A：DEV-004 故障闭环

```text
DEV-004 状态 FAULT + 主轴温度 91.8
→ 触发紧急报警（唯一活动事件）
→ 确认并填写说明
→ 处置并转维修申请
→ 维修列表出现同一主工单
→ 派工、接单、开工
→ 选择备件 120004 数量 2
→ 指定仓库可用库存 -2，生成唯一维修出库
→ 提交维修结果进入待验收
→ 验收通过，设备恢复/停机结束
→ 报警进入恢复待关闭并按规则关闭
→ 工作台、总览、报警、维修、库存、OEE、报表、大屏同步变化
```

验收重点：重复转维修不重复建单；重复提交出库不重复扣库存；未验收不能伪装已完成。

### B：DEV-002 延迟与程序不一致

```text
DEV-002 数据延迟
→ 实时页显示延迟秒数和演示降级
→ 进入程序参数比对
→ 展示基线/实际差异
→ 记录处理结论
→ 处理记录可查询，影响范围可见
```

### C：DEV-005 离线与无数据

```text
DEV-005 OFFLINE
→ 健康状态为离线/无数据
→ 指标、产量、趋势和 OEE 显示 -- 或不可计算
→ 不显示 0% 代表效率为零
→ 不误判为运行
→ 提供重新绑定/查看接入健康的入口
```

---

## 11. OEE 产品设计与验收

### 11.1 资格与配置

OEE 设备必须通过资格矩阵：有有效绑定/指标、班次日历、负荷时间、理想速度/标准节拍、产量和良品质量来源。缺任一必要条件，页面显示具体“待配置/不可计算”原因。

速度、目标、班次、生产日历和计划停机必须有适用范围、版本、生效时间。修改计划停机必须写入统一停机事实并触发 OEE 重算任务，显示受影响的设备、班次和统计区间；不能只在计划停机页面内存变化。

### 11.2 下钻

- OEE → 可用率/性能率/合格率；
- 可用率 → 计划/故障/维修停机；
- 性能率 → 标准速度/实际速度/运行时间/产量；
- 合格率 → 良品/不良品/质量原因；
- 每个损失项 → 对应报警、维修、停机或质量明细；
- 返回时保留设备、时间、班次、物料和指标上下文。

### 11.3 OEE Given / When / Then

```text
Given 设备在选定班次有完整配置和生产/质量数据且 OEE 低于目标
When 用户点击 OEE 结果
Then 页面展示三率、目标、主要损失，并可进入停机/报警/维修/质量明细
```

```text
Given 设备无生产数据、离线或 OEE 配置不完整
When 用户打开实时/历史 OEE
Then 页面显示暂无数据/数据中断/待配置/不可计算原因，不显示 0%
```

```text
Given 用户保存计划停机或速度配置
When 保存成功
Then 页面显示版本、生效时间、影响范围并触发演示重算，历史窗口不被无提示覆盖
```

---

## 12. 报表与接入质量设计

### 12.1 报表统一契约

所有报表使用受控 `ReportToolbar/ReportFilter`：设备、组织范围、车间、产线、班次、日期、物料/工单、状态等条件与业务数据字典一致。查询使用 selector；导出创建 `ExportTask`，显示待生成/成功/失败和当前筛选口径。演示阶段可下载本地生成内容，但必须标注演示。

报表必须展示统计截止时间、数据来源、口径说明、空态、不可计算原因和下钻入口。MTTR/MTBF 引用事件和维修事实；库存报表按单位展示，不能统一写“件”。

### 12.2 接入质量

接入总览必须能进入任务详情、质量事件、缺失区间和死信/补偿处理；每条任务有状态、责任上下文、失败原因、影响设备/OEE/报警/报表、重试/人工终止和完成结果。不得把 `deadLetter.js` 或 `gapRows` 做成无可达动作的静态展示。

---

## 13. 分阶段实施与退出标准

### P0：范围、基线和交付护栏

建立本方案、白名单路由、`ScopeNoticePage`、数据源标签、crosswalk 草稿和验收清单。退出：范围外不再进入可执行页面，公共服务和点巡保养不被 Flash 扩展。

### P1：领域数据与 canonical crosswalk

迁移设备、绑定、指标、健康、样本、报警、维修、备件、停机、OEE 初始数据。退出：所有白名单页面通过 `deviceId` 关联；没有字符串拼接和数组顺序映射；三个剧本初始状态可重置。

### P2：DemoStore、reducer、actions、selectors、持久化

建立共享状态和 provider。退出：跨页动作同步；刷新后快照保留；幂等动作不重复；演示降级可见；没有页面直接 mutate 静态数组。

### P3：设备资产与数据接入

改造设备台账/详情、绑定、平台指标、接入任务和程序比对。退出：空设备可首绑；1 主+N 子；占用校验；版本/生效/影响范围；协议/网关/IP/点位不可编辑；任务有结果。

### P4：运行监测与报警

改造总览、实时、设备详情、规则、报警中心、通知结果。退出：状态轴清晰；演示订阅/轮询/断开；报警状态机；通知履历；报警详情有趋势、版本、时间线和维修入口。

### P5：维修与备件

统一报修、故障主线、维修任务、验收/返修、库存预留/出库/退库。退出：报警只建一张主工单；维修进入待验收；出库按仓库可用扣减；重复提交幂等；完成回写设备、报警、停机和履历。

### P6：停机、OEE 与报表

统一计划/实际停机事实，改造 OEE 配置、实时/历史/详情和报表。退出：公式可复核；计划停机影响可见；无数据不显示 0；低值可下钻；查询/导出有结果；MTTR/MTBF 引用事实。

### P7：唯一大屏与最终交付

收敛 `DeviceScreenStandalone.jsx` + `src/screen/deviceScreen.html`，同源 selector。退出：切换设备时全部内容更新；演示快照/更新时间/降级可见；`dist/index.html` 可双击打开；旧大屏不再双轨维护。

每个阶段均必须记录已修改文件、未实现功能、风险、回退关系和验收结果。

---

## 14. 最终验收矩阵

### 14.1 工程验收

- `npm run build` 成功；
- 如工程存在 `check-pages.cjs`，执行 `node check-pages.cjs`；
- `dist/index.html` 可通过 `file://` 打开；
- 目标路由无空白页、pageerror、console error；
- HashRouter/深链/浏览器刷新/旧路由重定向按现有工程能力验证；
- 大屏独立入口不渲染后台菜单和平台公共服务页面。

### 14.2 产品验收

1. 绑定生效：台账设备→1 主+N IoT 源设备→验证/排他→指标→版本/影响范围。
2. 接入恢复：延迟/断流→质量事件→监测降级→通知/补偿任务→恢复结果。
3. 报警闭环：超限→唯一活动报警→确认说明→处置/通知→恢复待关闭→关闭依据。
4. 故障主线：报警转唯一维修工单→派工/开工→维修→待验收→通过或返修→设备/报警/停机/履历回写。
5. 库存闭环：领料预留→指定仓出库→库存变化→余料退库/冲销→工单结算；重复提交不重复扣减。
6. OEE 停机：计划/故障/维修停机同源→可用率变化→运行/OEE 报表一致；计划停机不扣性能率和合格率。
7. OEE 改善：低 OEE→三率/目标/数据质量→损失 Pareto→停机/报警/维修/质量下钻→处理后趋势可见。
8. 报表结果：设备/时间/组织/班次筛选→结果变化→明细下钻→演示导出任务成功或失败可见。

### 14.3 必须失败的反例

- 无效详情参数跳到第一条对象；
- 设备离线却显示正常运行或 OEE=0；
- 页面提示转维修成功但维修列表没有同一工单；
- 重复领料重复扣库存；
- 计划停机保存成功但 OEE 永远不变且无重算反馈；
- 页面出现可编辑网关、协议、IP、端口或点位；
- 页面新增本系统登录、权限、审计/日志管理；
- 页面新增点检、巡检、保养内部流程；
- 将演示轮询描述为真实 IoT 实时订阅；
- toast 成功但共享状态、详情、报表和大屏没有变化。

---

## 15. 给 GLM-5.3 Flash 的执行格式

每次开始编码前输出：

```text
本批目标：
本批业务域：
读取的目标文件及依赖：
将新增/修改的文件：
不会修改的范围：
状态对象与 action：
验收剧本：
```

每次完成一批后输出：

```text
已完成：
已修改文件：
共享状态变化：
未实现/明确不做：
已知风险：
npm run build：
node check-pages.cjs：
下一批建议：
```

若任一条硬规则无法满足，停止编码并报告冲突，不要通过新增页面、静态数据、toast、字符串映射或伪造接口绕过问题。
