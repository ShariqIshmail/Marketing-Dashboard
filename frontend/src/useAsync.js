import { useEffect, useState } from 'react';
import { errorMessage } from './lib.js';

// Runs fn whenever deps change; ignores responses that arrive after a newer request.
export default function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    let current = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => current && setState({ data, error: null, loading: false }))
      .catch((err) => current && setState((s) => ({ ...s, error: errorMessage(err), loading: false })));
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
