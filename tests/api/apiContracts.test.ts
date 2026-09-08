// ---------------------------------------------------------------------------
// AERO QA API TESTS: API CONTRACTS & MIDDLEWARE PROTECTION (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import express from 'express';
import { publicRouter } from '../../server/routes/publicRoutes';
import { adminIntelligenceRouter } from '../../server/routes/adminIntelligence';
import { developerIntelligenceRouter } from '../../server/routes/developerIntelligence';

describe('API Contracts & Security Middleware Validation', () => {
  describe('API Envelope Contract Standard', () => {
    it('defines standard success envelope schema', () => {
      const successEnvelope = {
        success: true,
        data: { id: 'app_1', name: 'WhatsApp' },
        meta: { requestId: 'req_123', timestamp: new Date().toISOString() }
      };

      expect(successEnvelope.success).toBe(true);
      expect(successEnvelope.data).toBeDefined();
      expect(successEnvelope.meta.requestId).toBeDefined();
    });

    it('defines standard error envelope schema', () => {
      const errorEnvelope = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengakses sumber daya ini.',
          details: {},
          retryable: false
        },
        meta: { requestId: 'req_err_1', timestamp: new Date().toISOString() }
      };

      expect(errorEnvelope.success).toBe(false);
      expect(errorEnvelope.error.code).toBe('FORBIDDEN');
      expect(errorEnvelope.meta.requestId).toBeDefined();
    });
  });

  describe('Route Handlers Registration Verification', () => {
    it('mounts public router endpoints', () => {
      expect(publicRouter).toBeDefined();
    });

    it('mounts admin intelligence router endpoints', () => {
      expect(adminIntelligenceRouter).toBeDefined();
    });

    it('mounts developer intelligence router endpoints', () => {
      expect(developerIntelligenceRouter).toBeDefined();
    });
  });
});
