import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า GROQ_API_KEY ใน Vercel Environment Variables" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { base64, mimeType } = body as { base64: string; mimeType: string };
  if (!base64 || !mimeType) {
    return NextResponse.json({ error: "base64 and mimeType required" }, { status: 400 });
  }

  const prompt = `วิเคราะห์อาหารในรูปนี้และตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น

ตอบในรูปแบบนี้เท่านั้น:
{"name":"ชื่ออาหารภาษาไทย","amount":"ปริมาณ เช่น 1 จาน / 200g","calories":0,"protein":0,"carbs":0,"fat":0}

ค่าโปรตีน/คาร์บ/ไขมัน เป็นหน่วยกรัม ประมาณค่าตามปริมาณที่เห็นในรูป`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[${res.status}] ${errText.slice(0, 300)}`);
    }

    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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
    console.error("Groq analyze error:", msg);
    return NextResponse.json(
      { error: `วิเคราะห์รูปไม่สำเร็จ: ${msg.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
