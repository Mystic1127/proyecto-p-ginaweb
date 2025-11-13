import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">PetSalud Frontend</h1>
        <p className="text-gray-600">Demo de autenticación con el backend.</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90"
        >
          Ir a Login
        </Link>
      </div>
    </main>
  );
}
