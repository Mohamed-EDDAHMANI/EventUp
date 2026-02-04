import AdminGuard from './admin-guard';
import AdminNav from './admin-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-brand-dark text-white">
        <AdminNav />
        <main className="px-6 py-8">{children}</main>
      </div>
    </AdminGuard>
  );
}
