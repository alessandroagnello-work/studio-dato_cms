import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';

const PAGE_BY_SLUG_QUERY = `
  query PageBySlugQuery($locale: SiteLocale!, $slug: String!) {
    article(locale: $locale, filter: { slug: { eq: $slug } }) {
      title
      description {
        value
      }
    }
  }
`;

export default async function DynamicPage({ params }) {
  const { lang, slug } = await params;

  const data = await performRequest(PAGE_BY_SLUG_QUERY, {
    variables: { locale: lang, slug: slug },
  });

  if (!data?.article) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">{data.article.title}</h1>
      {data.article.description && (
        <StructuredText data={data.article.description} />
      )}
    </main>
  );
}