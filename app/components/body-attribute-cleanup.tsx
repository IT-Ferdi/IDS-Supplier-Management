'use client';

import { useEffect } from 'react';

export default function BodyAttributeCleanup() {
  useEffect(() => {
    const attrs = ['cz-shortcut-listen'];
    attrs.forEach((a) => {
      if (document?.body?.hasAttribute?.(a)) document.body.removeAttribute(a);
    });
  }, []);
  return null;
}