import { useState } from 'react';

interface UseFormDraftOpts<Source, Form, Committed> {
  source: Source;
  sourceKey: string;
  toForm: (src: Source) => Form;
  fromForm: (form: Form) => Committed | null;
  onCommit: (parsed: Committed) => void;
}

interface UseFormDraftResult<Form> {
  form: Form;
  setField: <K extends keyof Form>(key: K, value: Form[K]) => void;
  commit: () => void;
  commitWith: (patch: Partial<Form>) => void;
}

// Draft/commit/resync hook for the settings cards. Holds a local Form draft,
// resyncs it when `sourceKey` changes (the "adjust state during render" idiom,
// https://react.dev/learn/you-might-not-need-an-effect), and commits parsed
// values to the store via `onCommit`. `commitWith` applies a patch and commits
// in the same tick so selects/toggles don't lose an edit to a stale closure.
export function useFormDraft<Source, Form, Committed>(
  opts: UseFormDraftOpts<Source, Form, Committed>,
): UseFormDraftResult<Form> {
  const { source, sourceKey, toForm, fromForm, onCommit } = opts;
  const [form, setForm] = useState<Form>(() => toForm(source));
  const [lastKey, setLastKey] = useState(sourceKey);

  if (lastKey !== sourceKey) {
    setLastKey(sourceKey);
    setForm(toForm(source));
  }

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const tryCommit = (next: Form) => {
    const parsed = fromForm(next);
    if (parsed !== null) onCommit(parsed);
  };

  const commit = () => tryCommit(form);

  const commitWith = (patch: Partial<Form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    tryCommit(next);
  };

  return { form, setField, commit, commitWith };
}
