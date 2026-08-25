import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import ScrollButtons from '@/app/widgets/scrollButtons';
import LatestArticles from '@/app/widgets/Article/latestArticles';
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/articleCard';

const ARTICLE_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
      title
      description
    }
    allArticles: allArticlesModels(locale: $locale, orderBy: position_ASC) {
      title
      slug
    }
    rawLatestArticles: allArticlesModels(
      locale: $locale
      first: 3
      orderBy: _createdAt_DESC
    ) {
      ...ArticleCardFields
    }
  }
`;

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang;
  const slug = resolvedParams?.slug;

  if (!slug) {
    notFound();
  }

  const data = await performRequest(ARTICLE_QUERY, {
    variables: { locale: lang, slug },
  });

  const article = data?.article;
  const allArticles = data?.allArticles || [];

  if (!article) {
    notFound();
  }

  // 1. Navigazione Precedente / Successivo
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // 2. Prende fino a 2 articoli recenti escludendo quello attualmente aperto
  const latestArticles = (data?.rawLatestArticles || [])
    .filter((art) => art.slug !== slug)
    .slice(0, 2);

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto Articolo */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione Tra Articoli */}
      <ScrollButtons
        prevHref={prevArticle ? `/${lang}/articoli/${prevArticle.slug}` : null}
        nextHref={nextArticle ? `/${lang}/articoli/${nextArticle.slug}` : null}
        centerText="Lista Articoli"
        centerHref={`/${lang}/articoli`}
      />

      {/* Widget Ultimi Articoli Pubblicati */}
      <LatestArticles articles={latestArticles} lang={lang} />
    </main>
  );
}