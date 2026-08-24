import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import ScrollButtons from '@/app/widgets/scrollButtons';

const ARTICLE_QUERY = `
  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
      title
      description
    }
    allArticles: allArticlesModels(locale: $locale, orderBy: position_ASC) {
      title
      slug
    }
  }
`;

export default async function ArticlePage({ params }) {
  const { lang, slug } = await params;

  const data = await performRequest(ARTICLE_QUERY, {
    variables: { locale: lang, slug },
  });

  const article = data?.article;
  const allArticles = data?.allArticles || [];

  if (!article) {
    notFound();
  }

  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg">
          {article.description}
        </div>
      </article>

      <ScrollButtons
        prevHref={prevArticle ? `/${lang}/articoli/${prevArticle.slug}` : null}
        nextHref={nextArticle ? `/${lang}/articoli/${nextArticle.slug}` : null}
        centerText="Lista Articoli"
        centerHref={`/${lang}/articoli`}
      />
    </main>
  );
}