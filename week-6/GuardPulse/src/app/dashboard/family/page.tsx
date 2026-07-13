"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Connection {
  id: string;
  status: string;
  created_at: string;
  guardian?: { id: string; name: string; email: string; phone: string | null };
  wearer?: { id: string; name: string; email: string; phone: string | null };
}

export default function FamilyPage() {
  const [guardians, setGuardians] = useState<Connection[]>([]);
  const [wearers, setWearers] = useState<Connection[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userRole, setUserRole] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    fetchConnections();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (data) setUserRole(data.role);
  }

  async function fetchConnections() {
    const res = await fetch("/api/family");
    const data = await res.json();
    setGuardians(data.guardians ?? []);
    setWearers(data.wearers ?? []);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage({ type: "", text: "" });

    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guardian_email: email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: `${email}님에게 보호자 초대를 보냈습니다` });
      setEmail("");
      await fetchConnections();
    } else {
      setMessage({ type: "error", text: data.error });
    }

    setInviting(false);
  }

  async function handleAccept(connectionId: string) {
    await fetch("/api/family", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connectionId, status: "accepted" }),
    });
    await fetchConnections();
  }

  async function handleReject(connectionId: string) {
    await fetch("/api/family", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connectionId, status: "rejected" }),
    });
    await fetchConnections();
  }

  async function handleRemove(connectionId: string) {
    await fetch(`/api/family?id=${connectionId}`, { method: "DELETE" });
    await fetchConnections();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: "대기 중",
    accepted: "연결됨",
    rejected: "거절됨",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">가족 관리</h1>
        <p className="text-lg text-gray-500 mt-1">
          보호자를 초대하고 건강 데이터를 공유하세요
        </p>
      </div>

      {/* 메시지 */}
      {message.text && (
        <div
          className={`p-4 rounded-xl mb-6 text-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* 착용자: 보호자 초대 */}
      {userRole === "wearer" && (
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍👩‍👧 보호자 초대</h2>
          <p className="text-gray-600 mb-4">
            보호자의 이메일을 입력하면 초대가 전송됩니다. 보호자가 수락하면 건강 데이터를 공유할 수 있습니다.
          </p>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="보호자 이메일 입력"
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-3 bg-rose-600 text-white text-lg font-medium rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {inviting ? "전송 중..." : "초대"}
            </button>
          </form>
        </div>
      )}

      {/* 착용자 시점: 내 보호자 목록 */}
      {guardians.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">내 보호자 목록</h2>
          <div className="space-y-3">
            {guardians.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {conn.guardian?.name ?? "알 수 없음"}
                    </p>
                    <p className="text-gray-500">{conn.guardian?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[conn.status]
                    }`}
                  >
                    {statusLabels[conn.status]}
                  </span>
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 보호자 시점: 나에게 연결된 착용자 목록 */}
      {wearers.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">모니터링 대상</h2>
          <div className="space-y-3">
            {wearers.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⌚</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {conn.wearer?.name ?? "알 수 없음"}
                    </p>
                    <p className="text-gray-500">{conn.wearer?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {conn.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleAccept(conn.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleReject(conn.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                      >
                        거절
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[conn.status]
                        }`}
                      >
                        {statusLabels[conn.status]}
                      </span>
                      {conn.status === "accepted" && (
                        <a
                          href={`/guardian/${conn.wearer?.id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          모니터링
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 연결 없을 때 */}
      {guardians.length === 0 && wearers.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">👨‍👩‍👧‍👦</p>
          <p className="text-xl text-gray-600 mb-2">아직 연결된 가족이 없습니다</p>
          <p className="text-lg text-gray-400">
            {userRole === "wearer"
              ? "위에서 보호자를 초대하세요"
              : "착용자가 초대를 보내면 여기에 표시됩니다"}
          </p>
        </div>
      )}
    </div>
  );
}
