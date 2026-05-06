export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-zinc-50 font-sans overflow-hidden">
      {children}
    </div>
  );
}
