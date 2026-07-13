"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/user";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("wearer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // profiles 테이블에 사용자 정보 저장
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        name,
        role,
      });

      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
        회원가입
      </h1>
      <p className="text-lg text-center text-gray-500 mb-8">
        GuardPulse에 오신 것을 환영합니다
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="이름을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="이메일을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="6자 이상 비밀번호"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            사용자 유형
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("wearer")}
              className={`p-4 rounded-xl border-2 text-center transition-colors ${
                role === "wearer"
                  ? "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-1">⌚</div>
              <div className="text-lg font-medium">착용자</div>
              <div className="text-sm text-gray-500">워치를 착용합니다</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("guardian")}
              className={`p-4 rounded-xl border-2 text-center transition-colors ${
                role === "guardian"
                  ? "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-1">👨‍👩‍👧</div>
              <div className="text-lg font-medium">보호자</div>
              <div className="text-sm text-gray-500">가족을 모니터링합니다</div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-rose-600 text-white text-xl font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="text-center text-lg text-gray-500 mt-6">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-rose-600 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
