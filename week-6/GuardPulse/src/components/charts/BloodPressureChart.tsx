"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { VitalData } from "@/types/vitals";

interface BloodPressureChartProps {
  data: VitalData[];
}

export function BloodPressureChart({ data }: BloodPressureChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((v) => ({
      time: new Date(v.recorded_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      systolic: v.systolic_bp,
      diastolic: v.diastolic_bp,
    }));

  return (
    <div className="bg-white rounded-2xl p-6 border">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🩸 혈압 추이</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis domain={[50, 180]} tick={{ fontSize: 12 }} unit=" mmHg" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="systolic"
            name="수축기"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            name="이완기"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
