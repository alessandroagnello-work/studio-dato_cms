import Link from 'next/link';

// Corretto: in DatoCMS il tipo del modello termina con Record
export const ARTICLE_CARD_FRAGMENT = `
  fragment ArticleCardFields on ArticlesModelRecord {
    id
    title
    slug
    description
  }
`;

export default function ArticleCard({ article, lang }) {
  if (!article) return null;

  return (
    <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 flex flex-col justify-between hover:border-blue-500/50 transition duration-200 shadow-lg w-full max-w-xs">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
            {article.description}
          </p>
        )}
      </div>
      <Link
        href={`/${lang}/articoli/${article.slug}`}
        className="text-blue-400 text-sm font-semibold hover:underline"
      >
        Leggi articolo →
      </Link>
    </div>
  );
}