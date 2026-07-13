import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 내 가족 연결 목록 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 내가 착용자일 때: 연결된 보호자 목록
  const { data: guardians } = await supabase
    .from("family_connections")
    .select(`
      id,
      status,
      created_at,
      guardian:profiles!family_connections_guardian_id_fkey(id, name, email, phone)
    `)
    .eq("wearer_id", user.id);

  // 내가 보호자일 때: 연결된 착용자 목록
  const { data: wearers } = await supabase
    .from("family_connections")
    .select(`
      id,
      status,
      created_at,
      wearer:profiles!family_connections_wearer_id_fkey(id, name, email, phone)
    `)
    .eq("guardian_id", user.id);

  return NextResponse.json({
    guardians: guardians ?? [],
    wearers: wearers ?? [],
  });
}

// POST: 가족 연결 초대 (이메일로)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { guardian_email } = body;

  if (!guardian_email) {
    return NextResponse.json({ error: "guardian_email is required" }, { status: 400 });
  }

  // 보호자 이메일로 프로필 조회
  const { data: guardian } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("email", guardian_email)
    .single();

  if (!guardian) {
    return NextResponse.json(
      { error: "해당 이메일의 사용자를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  if (guardian.id === user.id) {
    return NextResponse.json(
      { error: "자신을 보호자로 추가할 수 없습니다" },
      { status: 400 }
    );
  }

  // 이미 연결되었는지 확인
  const { data: existing } = await supabase
    .from("family_connections")
    .select("id, status")
    .eq("wearer_id", user.id)
    .eq("guardian_id", guardian.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "이미 연결 요청이 존재합니다", connection: existing },
      { status: 409 }
    );
  }

  // 연결 생성
  const { data: connection, error } = await supabase
    .from("family_connections")
    .insert({
      wearer_id: user.id,
      guardian_id: guardian.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connection, guardian }, { status: 201 });
}

// PATCH: 연결 상태 변경 (수락/거절)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { connection_id, status } = body;

  if (!connection_id || !["accepted", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "connection_id and valid status required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("family_connections")
    .update({ status })
    .eq("id", connection_id)
    .eq("guardian_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: 연결 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("id");

  if (!connectionId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("family_connections")
    .delete()
    .eq("id", connectionId)
    .or(`wearer_id.eq.${user.id},guardian_id.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
