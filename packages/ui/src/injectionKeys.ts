import type { InjectionKey } from 'vue';

export type SaveDocumentFn = () => Promise<void>;

/** Host app provides this so the editor toolbar can save .jff (e.g. desktop). */
export const saveDocumentKey: InjectionKey<SaveDocumentFn> = Symbol('jautoSaveDocument');
