import { setGlobalOptions } from 'firebase-functions/v2/options';
import { initializeApp } from 'firebase-admin/app';

setGlobalOptions({ region: 'us-central1' });
initializeApp();

// Intentionally no exported functions.
// Email is sent client-side via EmailJS.
