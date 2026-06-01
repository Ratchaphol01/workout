import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const PROMPT = `วิเคราะห์อาหารในรูปนี้และตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น

ตอบในรูปแบบ:
{
  "name": "ชื่ออาหารภาษาไทย",
  "amount": "ปริมาณโดยประมาณ เช่น 1 จาน / 200g",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0
}

หากไม่แน่ใจ ให้ประมาณค่าตามปริมาณที่เห็นในรูป ค่าโปรตีน/คาร์บ/ไขมัน เป็นหน่วย กรัม`;

// Try a model via direct REST — returns parsed JSON or throws with status text
async function callGemini(apiKey: string, model: string, base64: string, mimeType: string) {
  // Try as x-goog-api-key header (works for AIza... and AQ... keys)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
    }],
    generationConfig: { temperature: 0.2 },
  };

  // AQ. prefix = OAuth token → Bearer auth; AIza prefix = API key → x-goog-api-key
  const authHeader = apiKey.startsWith("AIza")
    ? { "x-goog-api-key": apiKey }
    : { "Authorization": `Bearer ${apiKey}` };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[${res.status}] ${errText.slice(0, 300)}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { base64, mimeType } = body as { base64: string; mimeType: string };
  if (!base64 || !mimeType) {
    return NextResponse.json({ error: "base64 and mimeType required" }, { status: 400 });
  }

  // Try models in order until one works
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro-vision"];
  let lastErr = "";

  for (const model of models) {
    try {
      const json = await callGemini(apiKey, model, base64, mimeType);
      const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const data = JSON.parse(clean);
      return NextResponse.json({
        name: String(data.name ?? ""),
        amount: String(data.amount ?? ""),
        calories: Math.round(Number(data.calories) || 0),
        protein: Math.round(Number(data.protein) || 0),
        carbs: Math.round(Number(data.carbs) || 0),
        fat: Math.round(Number(data.fat) || 0),
      });
    } catch (err: unknown) {
      lastErr = err instanceof Error ? err.message : String(err);
      // If it's not a 404 (model not found), stop trying other models
      if (!lastErr.includes("[404]")) break;
    }
  }

  console.error("Gemini analyze error:", lastErr);
  return NextResponse.json(
    { error: `วิเคราะห์รูปไม่สำเร็จ: ${lastErr.slice(0, 300)}` },
    { status: 500 }
  );
}
