export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
      {children}
    </div>
  );
}
