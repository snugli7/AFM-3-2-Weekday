"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DEFAULT_THRESHOLDS } from "@/lib/constants";
import type { VitalData } from "@/types/vitals";

interface HeartRateChartProps {
  data: VitalData[];
}

export function HeartRateChart({ data }: HeartRateChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((v) => ({
      time: new Date(v.recorded_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: v.heart_rate,
    }));

  const thresholds = DEFAULT_THRESHOLDS.heart_rate;

  return (
    <div className="bg-white rounded-2xl p-6 border">
      <h3 className="text-xl font-bold text-gray-900 mb-4">💓 심박수 추이</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis domain={[40, 140]} tick={{ fontSize: 12 }} unit=" bpm" />
          <Tooltip
            formatter={(value) => [`${value} bpm`, "심박수"]}
          />
          <ReferenceLine
            y={thresholds.warning.max}
            stroke="#f97316"
            strokeDasharray="5 5"
            label="경고"
          />
          <ReferenceLine
            y={thresholds.warning.min}
            stroke="#f97316"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#e11d48"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
