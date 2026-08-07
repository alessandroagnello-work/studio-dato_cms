import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Pagina non trovata</h2>
      <p className="text-gray-500 mb-6">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link 
        href="/it" 
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Torna alla Home
      </Link>
    </main>
  );
}