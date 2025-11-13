export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}