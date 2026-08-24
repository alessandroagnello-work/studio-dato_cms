import { performRequest } from '@/lib/datocms';
import ScrollButtons from '@/app/widgets/scrollButtons';
import Link from 'next/link';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  query ArticlesQuery($locale: SiteLocale!, $first: IntType!, $skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip: $skip, orderBy: position_ASC) {
      id
      title
      slug
      description
    }
  }
`;

export default async function ArticoliPage({ params, searchParams }) {
  const { lang } = await params;
  const { page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const data = await performRequest(ARTICLES_QUERY, {
    variables: { locale: lang, first: PAGE_SIZE, skip },
  });

  const totalArticles = data?._allArticlesModelsMeta?.count || 0;
  const totalPages = Math.ceil(totalArticles / PAGE_SIZE);

  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto text-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">
        Lista Articoli
      </h1>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        {data?.allArticlesModels?.map((art) => (
          <div
            key={art.id}
            className="flex flex-col justify-between p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition duration-200 shadow-lg"
          >
            <div>
              <h2 className="text-xl font-bold mb-2 text-white">{art.title}</h2>
              {art.description && (
                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                  {art.description}
                </p>
              )}
            </div>
            <Link
              href={`/${lang}/articoli/${art.slug}`}
              className="text-blue-400 font-semibold text-sm hover:underline"
            >
              Leggi articolo →
            </Link>
          </div>
        ))}
      </div>

      <ScrollButtons
        prevHref={currentPage > 1 ? `/${lang}/articoli?page=${currentPage - 1}` : null}
        nextHref={currentPage < totalPages ? `/${lang}/articoli?page=${currentPage + 1}` : null}
        centerText={`Pagina ${currentPage} di ${totalPages}`}
      />
    </main>
  );
}