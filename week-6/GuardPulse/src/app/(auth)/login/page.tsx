"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
        로그인
      </h1>
      <p className="text-lg text-center text-gray-500 mb-8">
        GuardPulse에 다시 오신 것을 환영합니다
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-rose-600 text-white text-xl font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="text-center text-lg text-gray-500 mt-6">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-rose-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
