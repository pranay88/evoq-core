'use server';

import { Resend } from 'resend';

export async function sendOnboardingEmail(email: string, link: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

    // We will use the onboarding subdomain if configured, or just default domain
    const { data, error } = await resend.emails.send({
      from: 'House of Evoq <onboarding@evoqcore.in>',
      to: email,
      subject: 'Welcome to House of Evoq! Your Onboarding Link',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #000;">Welcome to House of Evoq!</h2>
          <p>We are thrilled to have you join the team.</p>
          <p>To get started, please complete your onboarding registration by clicking the link below:</p>
          <div style="margin: 30px 0;">
            <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Onboarding</a>
          </div>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${link}</p>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} House of Evoq. All rights reserved.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Email sent successfully!' };
  } catch (err: any) {
    console.error('Email action error:', err);
    return { success: false, message: err.message || 'Failed to send email.' };
  }
}
