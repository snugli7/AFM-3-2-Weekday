"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DEFAULT_THRESHOLDS } from "@/lib/constants";
import type { VitalData } from "@/types/vitals";

interface SpO2ChartProps {
  data: VitalData[];
}

export function SpO2Chart({ data }: SpO2ChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((v) => ({
      time: new Date(v.recorded_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: v.spo2 ? Number(v.spo2) : null,
    }));

  const thresholds = DEFAULT_THRESHOLDS.spo2;

  return (
    <div className="bg-white rounded-2xl p-6 border">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🫁 산소포화도 추이</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis domain={[85, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value) => [`${value}%`, "SpO2"]}
          />
          <ReferenceLine
            y={thresholds.warning.min}
            stroke="#f97316"
            strokeDasharray="5 5"
            label="경고"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0891b2"
            fill="#cffafe"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
