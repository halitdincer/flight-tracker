interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="fixed inset-0 bg-slate-100">{children}</main>
  );
}
