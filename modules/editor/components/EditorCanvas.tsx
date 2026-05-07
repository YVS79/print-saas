'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

type InnerProps = ComponentProps<typeof import('./EditorCanvasInner').default>;

const EditorCanvasInner = dynamic<InnerProps>(
  () => import('./EditorCanvasInner').then((m) => m.default),
  { ssr: false }
);

export default function EditorCanvas(props: InnerProps) {
  return <EditorCanvasInner {...props} />;
}
