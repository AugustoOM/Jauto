export type DocumentLifecycleDecision = 'save' | 'discard' | 'cancel';

export type ConfirmFn = (message: string) => boolean;

export function requestDocumentLifecycleDecision(confirm: ConfirmFn): DocumentLifecycleDecision {
  if (confirm('Save changes before continuing?')) return 'save';
  if (confirm('Discard unsaved changes?')) return 'discard';
  return 'cancel';
}

export async function runProtectedDocumentAction(options: {
  isDirty: boolean;
  save: () => Promise<boolean>;
  action: () => void | Promise<void>;
  confirm?: ConfirmFn;
}): Promise<boolean> {
  if (!options.isDirty) {
    await options.action();
    return true;
  }

  const confirm = options.confirm ?? ((message: string) => window.confirm(message));
  const decision = requestDocumentLifecycleDecision(confirm);
  if (decision === 'cancel') return false;
  if (decision === 'save' && !(await options.save())) return false;
  await options.action();
  return true;
}

export function createBeforeUnloadHandler(isDirty: () => boolean) {
  return (event: BeforeUnloadEvent) => {
    if (!isDirty()) return;
    event.preventDefault();
    event.returnValue = '';
  };
}
