import Link from 'next/link';

export default function ScrollButtons({ prevHref, nextHref, centerText, centerHref }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-8">
      {prevHref ? (
        <Link
          href={prevHref}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 text-sm font-medium text-gray-200 transition"
        >
          ← Precedente
        </Link>
      ) : (
        <div />
      )}

      {centerHref ? (
        <Link
          href={centerHref}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition"
        >
          {centerText}
        </Link>
      ) : (
        <span className="text-sm font-medium text-gray-400">
          {centerText}
        </span>
      )}

      {nextHref ? (
        <Link
          href={nextHref}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 text-sm font-medium text-gray-200 transition"
        >
          Successivo →
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}