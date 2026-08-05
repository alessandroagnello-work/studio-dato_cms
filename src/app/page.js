import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

const PAGE_CONTENT_QUERY = `
  query {
    article {
      title
      description {
        value
      }
    }
  }
`;

export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{data?.article?.title || 'Nessun titolo trovato'}</h1>
      {data?.article?.description && (
        <StructuredText data={data.article.description} />
      )}
    </main>
  );
}