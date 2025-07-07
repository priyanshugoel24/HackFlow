import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getToken } from "next-auth/jwt";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `user-${token.sub}/${randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .upload(filePath, file, {
      contentType: file.type,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .getPublicUrl(filePath).data.publicUrl;

  return NextResponse.json({ url: publicUrl, path: filePath });
}