import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// 点检 / 巡检 / 保养统计报表共用的「正常 / 异常」堆叠柱状图。
// 绿 = 正常、琥珀 = 异常（组合通过色盲校验；图例 + 表格数值为二次编码）。
export default function StatusStackChart({ data, xKey, height = 220, unit = '项' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e8ea" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip formatter={v => `${v} ${unit}`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="normal" name="正常" stackId="s" fill="#16a34a" barSize={26} stroke="#fff" strokeWidth={1} />
        <Bar dataKey="abnormal" name="异常" stackId="s" fill="#d97706" barSize={26} stroke="#fff" strokeWidth={1} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
