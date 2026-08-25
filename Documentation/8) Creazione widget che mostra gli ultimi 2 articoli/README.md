---

## 3. Implementazione del Codice Sorgente

### 3.1 🆕 Nuovo Componente: `src/app/widgets/Article/LatestArticles.jsx`

> **Nota per lo sviluppatore**: Crea questo nuovo file nella cartella dei widget dedicati agli articoli. Il componente ha l'unico scopo di ricevere un array di articoli e renderizzarli ciclicamente riutilizzando la scheda `ArticleCard`.

```javascript
import ArticleCard from '@/app/widgets/Article/ArticleCard';

export default function LatestArticles({ articles, lang }) {
  // Se l'array è vuoto o non definito, il widget si nasconde automaticamente
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-800 pt-12 text-left">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        Ultimi Articoli Pubblicati
      </h2>
      <div className="flex justify-center gap-6 flex-wrap">
        {articles.map((art) => (
          <ArticleCard article="{art}" key="{art.id}" lang="{lang}"/>
        ))}
      </div>
    </section>
  );
}
```

---

### 3.2 ✏️ Modifica File Esistente: `src/app/[lang]/articoli/[slug]/page.js`

> **Nota per lo sviluppatore**: **Non creare un nuovo file.** Prendi la pagina di dettaglio del singolo articolo creata nel modulo precedente e integrala con le seguenti modifiche:
> 1. **Import**: Aggiungi l'import di `LatestArticles` e di `ARTICLE_CARD_FRAGMENT` da `ArticleCard.jsx`.
> 2. **Query GraphQL**: Aggiungi la stringa `${ARTICLE_CARD_FRAGMENT}` in cima e il campo `rawLatestArticles` dentro la query `ARTICLE_QUERY`.
> 3. **Logica JS**: Aggiungi il filtro `.filter(art => art.slug !== slug).slice(0, 2)` per pulire l'array degli articoli consigliati.
> 4. **JSX**: Inserisci il componente `<LatestArticles />` in fondo al file.

```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';

// 1. NUOVI IMPORT: Importiamo il widget e il fragment del componente ArticleCard
import LatestArticles from '@/app/widgets/Article/LatestArticles';
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';

// 2. QUERY AGGIORNATA: Iniettiamo il fragment ed estraiamo rawLatestArticles
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
    # Richiediamo i 3 articoli più recenti per gestire il buffer
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

  // Navigazione Sequenziale Precedente / Successivo (Codice preesistente)
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // 3. NUOVA LOGICA: Rimuoviamo l'articolo corrente dagli ultimi pubblicati ed estraiamo i primi 2
  const latestArticles = (data?.rawLatestArticles || [])
    .filter((art) => art.slug !== slug)
    .slice(0, 2);

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto principale dell'articolo (Preesistente) */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione Precedente / Successivo (Preesistente) */}
      <div className="flex items-center justify-center gap-4 border-t border-gray-800 pt-8 mt-8">
        {prevArticle && (
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href="{`/${lang}/articoli/${prevArticle.slug}`}">
            ← Precedente
          </Link>
        )}