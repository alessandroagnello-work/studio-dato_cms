import { performRequest } from '@/lib/datocms';

const PAGE_CONTENT_QUERY = `
  query {
    article {
      title
    }
  }
`;

export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{data?.article?.title || 'Nessun dato trovato'}</h1>
    </main>
  );
}