import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as sgMail from '@sendgrid/mail';

setGlobalOptions({ region: 'us-central1' });
initializeApp();

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

type InvitePayload = {
    propertyId: string;
    unitId: string;
    email: string;
    tenantName?: string | null;
    unitNumber?: string | null;
};

export const tenantInvite = onCall({ secrets: [SENDGRID_API_KEY] }, async (req) => {
    const { email, propertyId, unitId, tenantName, unitNumber } = (req.data || {}) as InvitePayload;
    if (!email || typeof email !== 'string') throw new HttpsError('invalid-argument', 'email required');
    if (!propertyId || !unitId) throw new HttpsError('invalid-argument', 'propertyId and unitId required');

    const origin = (req.rawRequest?.headers?.origin as string) || 'http://localhost:3000';
    const continueUrl = `${origin}/tenant/onboarding?propertyId=${encodeURIComponent(propertyId)}&unitId=${encodeURIComponent(unitId)}`;

    const link = await getAuth().generateSignInWithEmailLink(email, {
        url: continueUrl,
        handleCodeInApp: true,
    });

    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const fromName = 'Domatia';             // change if you want
    const fromEmail = 'no-reply@domatia.com'; // verified sender in SendGrid
    const subject = 'Your tenant portal invite';
    const toName = tenantName || '';

    const html = `
    <div>
      <p>${toName ? `Hi ${escapeHtml(toName)},` : 'Hi,'}</p>
      <p>You’ve been invited to access your tenant portal${unitNumber ? ` for unit <strong>${escapeHtml(unitNumber)}</strong>` : ''}.</p>
      <p><a href="${link}">Finish setup & sign in</a></p>
      <p>If you didn’t expect this, you can ignore this email.</p>
    </div>
  `;
    const text = [
        toName ? `Hi ${toName},` : 'Hi,',
        `You’ve been invited to access your tenant portal${unitNumber ? ` for unit ${unitNumber}` : ''}.`,
        `Open this link to finish setup & sign in:`,
        link,
        `If you didn’t expect this, ignore this email.`,
    ].join('\n\n');

    await sgMail.send({
        to: { email, name: toName || undefined },
        from: { email: fromEmail, name: fromName },
        subject,
        text,
        html,
    });

    return { ok: true };
});

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
