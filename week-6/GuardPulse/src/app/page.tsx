import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      {/* 히어로 섹션 */}
      <section className="text-center max-w-3xl mx-auto py-20">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          <span className="text-rose-600">GuardPulse</span>
        </h1>
        <p className="text-2xl md:text-3xl text-gray-600 mb-4">
          소중한 사람의 건강을 지키는
        </p>
        <p className="text-2xl md:text-3xl text-gray-600 mb-10">
          실시간 생체 모니터링 서비스
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-rose-600 text-white text-xl font-semibold rounded-xl hover:bg-rose-700 transition-colors"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 border-2 border-rose-600 text-rose-600 text-xl font-semibold rounded-xl hover:bg-rose-50 transition-colors"
          >
            로그인
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="w-full max-w-5xl mx-auto py-16 px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl bg-gray-50">
            <div className="text-5xl mb-4">💓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              실시간 생체 모니터링
            </h3>
            <p className="text-lg text-gray-600">
              혈압, 심박수, 산소포화도, 부정맥을 실시간으로 확인하세요
            </p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gray-50">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              자동 위험 알림
            </h3>
            <p className="text-lg text-gray-600">
              위험 범위를 벗어나면 가족과 담당자에게 즉시 알림을 전달합니다
            </p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gray-50">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              3중 안전망
            </h3>
            <p className="text-lg text-gray-600">
              착용자 - 가족 - 전문 담당자까지 다층 안전 시스템
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
