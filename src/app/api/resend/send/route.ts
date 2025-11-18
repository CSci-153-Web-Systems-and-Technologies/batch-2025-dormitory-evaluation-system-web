import { Resend } from "resend";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Missing RESEND_API_KEY on server');
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const { to, subject, html, from } = await req.json();
    console.log('/api/resend/send payload:', { to, subject, from });
    if (!to) {
      return NextResponse.json({ error: 'Missing "to" field' }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: from || 'Dormitory Evaluation System <des@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject: subject || 'Invitation',
      html: html || '',
    });
    console.log('/api/resend/send result:', result);

    // Return the SDK result so the client can see details for debugging.
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('Error in /api/resend/send:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to send email', details: message }, { status: 500 });
  }
}
