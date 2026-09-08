// ---------------------------------------------------------------------------
// AUTHENTICATION ROUTER (/api/auth/*) (STAGE 8.8 & 8.9)
// Auth.js Contract, Google OAuth Identity Resolution & Session Store
// ---------------------------------------------------------------------------

import { ExpressAuth } from '@auth/express';
import { authConfig } from '../../auth';

export const authRouter = ExpressAuth(authConfig);
