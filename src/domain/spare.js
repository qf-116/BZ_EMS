// ============================================================
// 备件库存领域层（纯 JS：可用库存口径、出库校验、幂等约束；§6.6）
// ============================================================

// 库存口径：现存 = 在库实物；预留 = 已被工单锁定；可用 = 现存 − 预留；
// 出库后现存减少、已出库累计增加；退库回冲现存。
export function availableQty(stock) {
  if (!stock) return null; // 未配置库存与 0 严格区分
  return stock.onHand - stock.reserved;
}

// 出库校验：数量必须为正且不得超过指定仓库可用库存（返回 {ok, error}）
export function validateOutbound(stock, qty) {
  if (!stock) return { ok: false, error: '该仓库未配置此备件库存' };
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) return { ok: false, error: '出库数量必须为正数' };
  const avail = availableQty(stock);
  if (q > avail) return { ok: false, error: `出库数量 ${q} 超过该仓库可用库存 ${avail}` };
  return { ok: true };
}

// 入库校验
export function validateInbound(qty) {
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) return { ok: false, error: '入库数量必须为正数' };
  return { ok: true };
}

// 退库校验：退库数量不得超过该工单该备件的已出库量（余料退库）
export function validateReturn(outboundQty, returnedQty, qty) {
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) return { ok: false, error: '退库数量必须为正数' };
  if (q > outboundQty - returnedQty) return { ok: false, error: `退库数量超过该工单可退余量 ${outboundQty - returnedQty}` };
  return { ok: true };
}

// 幂等键约定：
//   出库：outbound:{repairOrderId}:{spareCode}:{requestId}
//   退库：return:{outboundId}:{requestId}
//   入库：inbound:{warehouseId}:{spareCode}:{requestId}
export function outboundIdempotencyKey(repairOrderId, spareCode, requestId) {
  return `outbound:${repairOrderId}:${spareCode}:${requestId}`;
}

// 库存水位：低于安全库存预警，高于最大库存积压预警
export function stockLevel(stock) {
  if (!stock) return '未配置';
  if (stock.onHand < stock.safe) return '低于安全库存';
  if (stock.max && stock.onHand > stock.max) return '超过最大库存';
  return '正常';
}
