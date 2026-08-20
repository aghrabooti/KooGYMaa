import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, role } = await req.json();
    
    return NextResponse.json({ 
      message: "Received", 
      data: { name, email, role } 
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}