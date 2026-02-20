interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="h-[100dvh] w-screen bg-slate-100">{children}</main>
  );
}
