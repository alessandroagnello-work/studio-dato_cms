# Guida all'Integrazione DatoCMS: Articoli e Paginazione (Next.js 16)

Documentazione dei passaggi per la creazione dello schema articoli su DatoCMS e la loro gestione nativa in Next.js (App Router), prima del refactoring a componenti riutilizzabili.

---

## 1. DatoCMS: Schema e Content Articoli

### Creazione del Modello
* **Model Name**: `Articles`
* **Model ID (API Key)**: `articles_model`
* **Tipo**: Collection (Modello multi-istanza)

### Campi dello Schema
* **Title** (`title`): Stringa a riga singola (Localizzato IT/EN).
* **Description** (`description`): Testo a più paragrafi (Localizzato IT/EN).
* **Slug** (`slug`): Campo Slug univoco basato sul titolo (Localizzato IT/EN, senza prefissi `/`).

### Creazione dei Record
* Creati **6 articoli** totali (*Il primo post!* ... *Il sesto post!*).
* Compilati i campi in doppia lingua (Italiano ed Inglese).
* Ordinamento manuale impostato tramite la proprietà `position` (drag-and-drop su DatoCMS).

---

## 2. Spiegazione: Gestione del Totale Articoli e Paginazione nel Codice

Per calcolare dinamicamente le pagine necessarie, richiediamo a DatoCMS il conteggio totale dei record tramite il campo meta `_allArticlesModelsMeta { count }` e applichiamo i parametri di paginazione `first` (quanti elementi recuperare nella pagina e mostrarli, ad esempio solo 3) e `skip` (quanti elementi saltare dall'inizio della lista per passare al successivo, ad esempio 1 (1,2,3,...) o 2 (2,4,6,...)):

```javascript
// 1. Definiamo la quantità di articoli per pagina
const PAGE_SIZE = 3;

// 2. Nella query GraphQL richiediamo il conteggio totale e il blocco paginato
const ARTICLES_QUERY = `
  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip:$skip, orderBy: position_ASC) {
      id
      title
      slug
      description
    }
  }
`;

// 3. Calcoliamo il salto (skip) e il numero totale di pagine
const currentPage = Math.max(1, parseInt(page || '1', 10));
const skip = (currentPage - 1) * PAGE_SIZE;

const totalArticles = data?._allArticlesModelsMeta?.count || 0;
const totalPages = Math.ceil(totalArticles / PAGE_SIZE);
```

---

## 3. Mostriamo qui 2 esempi di codice per mostrare i post precedentemente creati:

### Script 1: Lista Articoli con Paginazione (`src/app/[lang]/articoli/page.js`)

```javascript
import { performRequest } from '@/lib/datocms';
import Link from 'next/link';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip:$skip, orderBy: position_ASC) {
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
            className="flex flex-col justify-between p-6 rounded-xl bg-gray-900 border border-gray-800 shadow-lg"
          >
            <div>
              <h2 className="text-xl font-bold mb-2 text-white">{art.title}</h2>
              {art.description && (
                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                  {art.description}
                </p>
              )}
            </div>
            <Link className="text-blue-400 font-semibold text-sm hover:underline" href="{`/${lang}/articoli/${art.slug}`}">
              Leggi articolo →
            </Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          {currentPage > 1 ? (
            <Link - 1}`} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200" href="{`/${lang}/articoli?page=${currentPage">
              ← Precedente
            </Link>
          ) : (
            <div />
          )}

          <span className="text-sm font-medium text-gray-400">
            Pagina <strong className="text-white">{currentPage}</strong> di{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>

          {currentPage < totalPages ? (
            <Link + 1}`} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200" href="{`/${lang}/articoli?page=${currentPage">
              Successivo →
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    </main>
  );
}
```

---

### Script 2: Dettaglio Singolo Articolo (`src/app/[lang]/articoli/[slug]/page.js`)

```javascript
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const ARTICLE_QUERY = `
  query ArticleQuery($locale: SiteLocale!,$slug: String!) {
    article: articlesModel(filter: { slug: { eq: $slug } }, locale:$locale) {
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

      <div className="flex items-center justify-center gap-4 border-t border-gray-800 pt-8 mt-8">
        {prevArticle && (
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href="{`/${lang}/articoli/${prevArticle.slug}`}">
            ← Precedente
          </Link>
        )}

        <Link className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition" href="{`/${lang}/articoli`}">
          Lista Articoli
        </Link>

        {nextArticle && (
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href="{`/${lang}/articoli/${nextArticle.slug}`}">
            Successivo →
          </Link>
        )}
      </div>
    </main>
  );
}
```