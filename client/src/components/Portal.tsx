import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: React.ReactNode;
}

export default function Portal({ children }: Props) {
  const mount = React.useMemo(() => document.body, []);
  return createPortal(<>{children}</>, mount);
}
