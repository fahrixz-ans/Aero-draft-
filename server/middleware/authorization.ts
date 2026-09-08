import { Request, Response, NextFunction } from 'express';
import { requirePermission } from '../auth';

export function authorize(permission: string) {
  return requirePermission(permission);
}
