import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("vitals")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (from) {
    query = query.gte("recorded_at", from);
  }
  if (to) {
    query = query.lte("recorded_at", to);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("vitals")
    .insert({
      user_id: user.id,
      heart_rate: body.heart_rate,
      systolic_bp: body.systolic_bp,
      diastolic_bp: body.diastolic_bp,
      spo2: body.spo2,
      temperature: body.temperature,
      arrhythmia_detected: body.arrhythmia_detected ?? false,
      recorded_at: body.recorded_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
