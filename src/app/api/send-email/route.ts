import { NextResponse } from 'next/server';
import nodemailer, { Transporter } from 'nodemailer';

// Specify Node.js runtime for environment where Nodemailer is used
export const runtime = 'nodejs'; 

// Initialize the Transporter outside the POST handler for performance (memoization)
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  // If transporter is already initialized, return it
  if (transporter) {
    return transporter;
  }

  // Check for required SMTP environment variables
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const portString = process.env.SMTP_PORT || '587';
  const port = parseInt(portString, 10);

  if (!host || !user || !pass) {
    throw new Error('Missing one or more required SMTP environment variables (HOST, USER, PASS)');
  }

  // Initialize and store the transporter
  transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // Use SSL/TLS if port is 465
    auth: {
      user: user,
      pass: pass,
    },
  });

  return transporter;
};

// Define the API route handler function
export async function POST(req: Request) {
  try {
    // 1. Get the data from the request body
    // We expect 'to', 'subject', 'html', and 'from' (optional override)
    const { to, subject, html, from } = await req.json();

    console.log('/api/send-email payload:', { to, subject, from });

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" field' }, { status: 400 });
    }
    
    // Convert 'to' to an array if it's a single string, similar to the Resend structure
    const recipients = Array.isArray(to) ? to : [to];

    // 2. Initialize the SMTP transporter
    const mailTransporter = getTransporter();

    // 3. Define the email options
    const mailOptions = {
      // Use the 'from' value from the payload if provided, 
      // otherwise, use a default from the SMTP user (must be authorized)
      from: from || process.env.SMTP_USER,
      to: recipients.join(', '), // Nodemailer expects a comma-separated string or array
      subject: subject || 'No Subject',
      html: html || '',
      // Add a text version for better deliverability
      text: html ? html.replace(/<[^>]+>/g, '') : 'Email content is in HTML format.',
    };

    // 4. Send the email
    const result = await mailTransporter.sendMail(mailOptions);
    console.log('/api/send-email result:', result);

    // Return the SDK result (info object) for client debugging
    return NextResponse.json({ ok: true, result });
    
  } catch (err) {
    console.error('Error in /api/send-email:', err);
    const message = err instanceof Error ? err.message : String(err);
    
    // 5. Return a standardized error response
    return NextResponse.json(
      { error: 'Failed to send email', details: message }, 
      { status: 500 }
    );
  }
}