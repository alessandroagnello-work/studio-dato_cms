import { performRequest } from '@/lib/datocms';
import ScrollButtons from '@/app/widgets/scrollButtons';
import ArticleCard, { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/articleCard';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!, $skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip: $skip, orderBy: position_ASC) {
      ...ArticleCardFields
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

      <div className="flex justify-center gap-6 flex-wrap mb-10">
        {data?.allArticlesModels?.map((art) => (
          <ArticleCard key={art.id} article={art} lang={lang} />
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