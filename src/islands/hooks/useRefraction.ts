import { useEffect, useState } from 'react';

/**
 * True where `backdrop-filter: url(#svg-filter)` bends the backdrop, which today is Chromium only.
 * shortcut: user-agent check, because CSS cannot detect this; revisit when Safari or Firefox ship it.
 */
export const useRefraction = (): boolean => {
  const [refracts, setRefracts] = useState(false);
  useEffect(() => {
    setRefracts(/Chrom(e|ium)\//.test(navigator.userAgent));
  }, []);
  return refracts;
};
