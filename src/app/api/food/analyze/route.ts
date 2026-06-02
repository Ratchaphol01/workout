import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const JSON_FORMAT = `{"name":"ชื่ออาหารภาษาไทย","amount":"ปริมาณ เช่น 1 จาน / 200g","calories":0,"protein":0,"carbs":0,"fat":0}`;

function buildResult(data: Record<string, unknown>) {
  return NextResponse.json({
    name: String(data.name ?? ""),
    amount: String(data.amount ?? ""),
    calories: Math.round(Number(data.calories) || 0),
    protein: Math.round(Number(data.protein) || 0),
    carbs: Math.round(Number(data.carbs) || 0),
    fat: Math.round(Number(data.fat) || 0),
  });
}

async function callGroq(apiKey: string, messages: unknown[]) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
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
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`ไม่พบ JSON ในคำตอบ: "${text.slice(0, 100)}"`);
  return JSON.parse(match[0]);
}

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
  const { base64, mimeType, menuText } = body as {
    base64?: string;
    mimeType?: string;
    menuText?: string;
  };

  try {
    let data: Record<string, unknown>;

    if (menuText?.trim()) {
      // Text mode: estimate from menu name
      data = await callGroq(apiKey, [
        {
          role: "user",
          content: `ประมาณคุณค่าโภชนาการของ "${menuText.trim()}" 1 จาน/1 ที่ ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น\n${JSON_FORMAT}\nค่าโปรตีน/คาร์บ/ไขมัน หน่วยกรัม`,
        },
      ]);
    } else if (base64 && mimeType) {
      // Image mode: analyze photo
      data = await callGroq(apiKey, [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `วิเคราะห์อาหารในรูปและตอบเป็น JSON เท่านั้น\n${JSON_FORMAT}\nค่าโปรตีน/คาร์บ/ไขมัน หน่วยกรัม`,
            },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ]);
    } else {
      return NextResponse.json({ error: "ต้องส่ง menuText หรือ base64+mimeType" }, { status: 400 });
    }

    return buildResult(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Groq analyze error:", msg);
    return NextResponse.json({ error: `วิเคราะห์ไม่สำเร็จ: ${msg.slice(0, 300)}` }, { status: 500 });
  }
}
