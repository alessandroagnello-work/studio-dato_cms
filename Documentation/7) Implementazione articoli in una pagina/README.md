# Guida all'Integrazione DatoCMS: Articoli, Paginazione e Componente ArticleCard (Next.js 16)

Documentazione dei passaggi per la creazione dello schema articoli su DatoCMS, la gestione della paginazione nativa e la modularizzazione con il componente riutilizzabile `ArticleCard`.

---

## 1. DatoCMS: Schema e Content Articoli

### CREIAMO UN NUOVO MODELLO CHE CONTERRA I DATI DEGLI ARTICOLI:
* **Model Name**: `Articles`
* **Model ID (API Key)**: `articles_model`
* **Tipo**: Collection (Modello multi-istanza)

### AGGIUNGIAMO QUALI CAMPI HA QUESTO MODELLO:
* **Title** (`title`): Stringa a riga singola (Localizzato IT/EN).
* **Description** (`description`): Testo a più paragrafi (Localizzato IT/EN).
* **Slug** (`slug`): Campo Slug univoco basato sul titolo (Localizzato IT/EN, senza prefissi `/`).

### 1.3 Creazione dei Record

Creiamo ora 6 esempi di articoli da mostrare su react, compilati in doppia lingua e ordinati manualmente tramite drag-and-drop (`position_ASC`):

| Position | Title (IT) | Slug (IT) | Description (IT) | Title (EN) | Slug (EN) | Description (EN) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Il primo post! | `il-primo-post` | Questo è il contenuto del primo articolo di prova. | The first post! | `the-first-post` | This is the content of the first test article. |
| **2** | Il secondo post! | `il-secondo-post` | Guida all'integrazione di Next.js e DatoCMS. | The second post! | `the-second-post` | Guide to integrating Next.js and DatoCMS. |
| **3** | Il terzo post! | `il-terzo-post` | Come gestire la paginazione con le API GraphQL. | The third post! | `the-third-post` | How to handle pagination with GraphQL APIs. |
| **4** | Il quarto post! | `il-quarto-post` | Creazione di componenti riutilizzabili in React. | The fourth post! | `the-fourth-post` | Creating reusable components in React. |
| **5** | Il quinto post! | `il-quinto-post` | Ottimizzazione del layout con Tailwind CSS. | The fifth post! | `the-fifth-post` | Layout optimization using Tailwind CSS. |
| **6** | Il sesto post! | `il-sesto-post` | Gestione delle rotte dinamiche con l'App Router. | The sixth post! | `the-sixth-post` | Managing dynamic routes with App Router. |

---

## 2. Componente Riutilizzabile: `ArticleCard` (`src/app/widgets/Article/articleCard.js`)

Per isolare la singola scheda dell'articolo ed evitare duplicazioni di codice (principio DRY), creiamo un componente dedicato. Definiamo al suo interno un **GraphQL Fragment** (`ARTICLE_CARD_FRAGMENT`) associato al tipo `ArticlesModelRecord` generato da DatoCMS, in modo che il componente espliciti autonomamente i campi di cui ha bisogno.

```javascript
import Link from 'next/link';

// GraphQL Fragment per riutilizzare la struttura dei campi su ArticlesModelRecord
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
      <Link className="text-blue-400 text-sm font-semibold hover:underline" href="{`/${lang}/articoli/${article.slug}`}">
        Leggi articolo →
      </Link>
    </div>
  );
}
```

---

## 3. Gestione del Totale Articoli e Paginazione nel Codice

Per calcolare dinamicamente le pagine necessarie, richiediamo a DatoCMS il conteggio totale dei record tramite il campo meta `_allArticlesModelsMeta { count }` e applichiamo i parametri di paginazione `first` (limite per pagina) e `skip` (offset).

```javascript
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/articleCard';

// 1. Definiamo la quantità di articoli per pagina
const PAGE_SIZE = 3;

// 2. Query GraphQL con Fragment e paginazione
const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip:$skip, orderBy: position_ASC) {
      ...ArticleCardFields
    }
  }
`;

// 3. Calcoliamo lo skip e il numero totale di pagine
const currentPage = Math.max(1, parseInt(page || '1', 10));
const skip = (currentPage - 1) * PAGE_SIZE;

const totalArticles = data?._allArticlesModelsMeta?.count || 0;
const totalPages = Math.ceil(totalArticles / PAGE_SIZE);
```

---

## 4. Spiegazione Approfondita degli Script e Codici Sorgente

### 4.1 Script 1: Lista Articoli con Paginazione (`src/app/[lang]/articoli/page.js`)

**Cosa fa questo script:**
1. **Estrazione parametri URL**: Legge la lingua (`lang`) e il numero di pagina corrente (`searchParams.page`). Se non presente, di default imposta la pagina a `1`.
2. **Calcolo Paginazione Offset**: Determina quanti articoli saltare (`skip = (currentPage - 1) * PAGE_SIZE`). Ad esempio, alla Pagina 2 con `PAGE_SIZE = 3`, salterà i primi 3 articoli.
3. **Fetch GraphQL Unificato**: Invia a DatoCMS una singola richiesta contenente sia i dati del blocco sia il conteggio totale dei record (`count`).
4. **Rendering con `ArticleCard`**: Cicla gli articoli ottenuti con il metodo `.map()` e delega la resa grafica a `ArticleCard`.
5. **Navigazione Paginata**: Calcola il numero totale di pagine (`Math.ceil(totalArticles / PAGE_SIZE)`). Se `totalPages > 1`, mostra i pulsanti "← Precedente" e "Successivo →" aggiornando la query string dell'URL (`?page=N`).

```javascript
import { performRequest } from '@/lib/datocms';
import Link from 'next/link';
import ArticleCard, { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/articleCard';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    _allArticlesModelsMeta {
      count
    }
    allArticlesModels(locale: $locale, first: $first, skip:$skip, orderBy: position_ASC) {
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

      {/* Lista Articoli Recuperati mediante Componente ArticleCard */}
      <div className="flex justify-center gap-6 flex-wrap mb-10">
        {data?.allArticlesModels?.map((art) => (
          <ArticleCard article="{art}" key="{art.id}" lang="{lang}"/>
        ))}
      </div>

      {/* Pulsanti Avanti/Indietro per Navigare tra le Pagine */}
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

### 4.2 Script 2: Dettaglio Singolo Articolo (`src/app/[lang]/articoli/[slug]/page.js`)

**Cosa fa questo script:**
1. **Gestione Rotta Dinamica**: Riceve lo `slug` dall'URL (es. `/it/articoli/il-primo-post`).
2. **Query Combinata**:
   * Richiede il contenuto dettagliato dell'articolo aperto (`article`).
   * Richiede l'indice completo di tutti gli articoli (`allArticles`) ordinato per posizione (`position_ASC`).
3. **Gestione Errori (404)**: Se il parametro `slug` non esiste o DatoCMS non trova alcun articolo corrispondente, invoca la funzione `notFound()` di Next.js per mostrare la pagina di errore 404.
4. **Calcolo Navigazione Sequenziale**: Individua l'indice dell'articolo corrente dentro l'array `allArticles` (`findIndex`). Calcola dinamicamente lo slug dell'articolo precedente (`currentIndex - 1`) e di quello successivo (`currentIndex + 1`).
5. **Rendering UI**:
   * Mostra il titolo e la descrizione dell'articolo principale.
   * Renderizza la barra di navigazione inferiore per scorrere tra i post correlati in sequenza temporale/posizionale o tornare all'elenco principale (`/articoli`).

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

  // Calcolo Indice e Link Precedente/Successivo
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto principale dell'articolo */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Barra di Navigazione Tra Articoli e Ritorno alla Lista */}
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