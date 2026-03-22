'use client';

import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    increment,
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;

let emailInited = false;
function ensureEmailJsInit() {
    if (!emailInited) {
        if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
            throw new Error(
                'EmailJS env vars missing. Set NEXT_PUBLIC_EMAILJS_PUBLIC_KEY, NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID.'
            );
        }
        emailjs.init(EMAILJS_PUBLIC_KEY);
        emailInited = true;
    }
}

function toBase64Url(bytes: Uint8Array) {
    const bin = String.fromCharCode(...bytes);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function randomToken(bytes = 24) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return toBase64Url(buf);
}
async function sha256Base64Url(s: string) {
    const enc = new TextEncoder().encode(s);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return toBase64Url(new Uint8Array(digest));
}
function getBaseUrl() {
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    const fromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, '');
    if (fromEnv) return fromEnv;
    throw new Error('Base URL not found. Use window.location.origin or set NEXT_PUBLIC_APP_BASE_URL.');
}

export type InviteEmailParams = {
    adminId: string;
    propertyId: string;
    unitId: string;
    tenantEmail: string;
    tenantName?: string | null;
    propertyLabel?: string | null;
    unitNumber?: string | null;
    managerName?: string | null;
    managerEmail?: string | null;
    expiresInDays?: number; // default 14
};

export async function createInviteAndSendEmail(p: InviteEmailParams) {
    ensureEmailJsInit();

    // deterministic ID to prevent duplicates for the same (property, unit, email)
    const normalizedEmail = p.tenantEmail.trim().toLowerCase();
    const emailHash = await sha256Base64Url(normalizedEmail);
    const inviteId = `${p.propertyId}_${p.unitId}_${emailHash}`;

    // single-use code (store hash only)
    const rawCode = randomToken(24);
    const codeHash = await sha256Base64Url(rawCode);

    const ttlDays = Math.max(1, p.expiresInDays ?? 14);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const ref = doc(db, 'tenantInvites', inviteId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            adminId: p.adminId,
            propertyId: p.propertyId,
            unitId: p.unitId,
            tenantEmail: normalizedEmail,
            tenantName: (p.tenantName || '') || null,
            status: 'sent',
            invitedAt: serverTimestamp(),
            lastSentAt: serverTimestamp(),
            resendCount: 0,
            codeHash,
            expiresAt, // Firestore will store as Timestamp
            sentBy: { name: p.managerName || null, email: p.managerEmail || null },
        });
    } else {
        await updateDoc(ref, {
            status: 'sent',
            lastSentAt: serverTimestamp(),
            resendCount: increment(1),
            codeHash,
            expiresAt,
            sentBy: { name: p.managerName || null, email: p.managerEmail || null },
        });
    }

    const base = getBaseUrl();
    const acceptUrl = `${base}/tenant/accept?invite=${encodeURIComponent(inviteId)}&code=${encodeURIComponent(rawCode)}`;

    await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
            to_email: normalizedEmail,
            user_email: normalizedEmail,
            tenant_name: p.tenantName || 'there',
            property_label: p.propertyLabel || '',
            unit_number: p.unitNumber || '',
            accept_url: acceptUrl,
            manager_name: p.managerName || '',
            manager_email: p.managerEmail || '',
            reply_to: p.managerEmail || '',
        },
        EMAILJS_PUBLIC_KEY
    );

    return { inviteId, acceptUrl };
}
