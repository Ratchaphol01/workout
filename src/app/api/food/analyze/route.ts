import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables" }, { status: 500 });
  }

  const body = await request.json();
  const { base64, mimeType } = body as { base64: string; mimeType: string };

  if (!base64 || !mimeType) {
    return NextResponse.json({ error: "base64 and mimeType required" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `วิเคราะห์อาหารในรูปนี้และตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น

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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini analyze error:", msg);
    return NextResponse.json(
      { error: `วิเคราะห์รูปไม่สำเร็จ: ${msg.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
