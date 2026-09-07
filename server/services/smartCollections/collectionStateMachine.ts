export type ServerCollectionState = 
  | 'DRAFT'
  | 'VALIDATING'
  | 'GENERATING'
  | 'READY'
  | 'PUBLISHED'
  | 'STALE'
  | 'REGENERATING'
  | 'FAILED'
  | 'DISABLED'
  | 'ARCHIVED';

export const SERVER_ALLOWED_TRANSITIONS: Record<ServerCollectionState, ServerCollectionState[]> = {
  DRAFT: ['VALIDATING', 'DISABLED', 'ARCHIVED'],
  VALIDATING: ['GENERATING', 'FAILED', 'DISABLED'],
  GENERATING: ['READY', 'FAILED', 'DISABLED'],
  READY: ['PUBLISHED', 'DISABLED', 'VALIDATING', 'ARCHIVED'],
  PUBLISHED: ['STALE', 'DISABLED', 'ARCHIVED', 'VALIDATING'],
  STALE: ['REGENERATING', 'DISABLED', 'ARCHIVED'],
  REGENERATING: ['READY', 'FAILED', 'DISABLED'],
  FAILED: ['VALIDATING', 'DISABLED', 'ARCHIVED'],
  DISABLED: ['VALIDATING', 'DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT']
};

export class CollectionStateMachine {
  static canTransition(from: ServerCollectionState, to: ServerCollectionState): boolean {
    const allowed = SERVER_ALLOWED_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  static validateTransition(from: ServerCollectionState, to: ServerCollectionState): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid state transition from '${from}' to '${to}'. Allowed: [${(SERVER_ALLOWED_TRANSITIONS[from] || []).join(', ')}]`);
    }
  }
}
