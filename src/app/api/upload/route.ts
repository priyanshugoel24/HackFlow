import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getToken } from "next-auth/jwt";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check for required environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET;
    
    if (!supabaseUrl || !supabaseKey || !bucket) {
      console.error("Missing Supabase configuration. Please check your environment variables:");
      console.error("- SUPABASE_URL:", !!supabaseUrl);
      console.error("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
      console.error("- SUPABASE_BUCKET:", !!bucket);
      return NextResponse.json({ 
        error: "File upload is not configured. Missing Supabase environment variables." 
      }, { status: 500 });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `user-${token.sub}/${randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }

    const publicUrl = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath).data.publicUrl;

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}