# Guida all'Integrazione DatoCMS: Articoli, Paginazione e Componente ArticleCard (Next.js 16)

Documentazione dei passaggi per la creazione dello schema articoli su DatoCMS, la gestione della paginazione nativa e la modularizzazione con il componente riutilizzabile `ArticleCard`.

---

## 1. DatoCMS: Schema e Content Articoli

### 1.1 Creazione del Modello
* **Model Name**: `Articles`
* **Model ID (API Key)**: `articles_model`
* **Tipo**: Collection (Modello multi-istanza)

### 1.2 Campi dello Schema
* **Title** (`title`): Stringa a riga singola (Localizzato IT/EN).
* **Description** (`description`): Testo a più paragrafi (Localizzato IT/EN).
* **Slug** (`slug`): Campo Slug univoco basato sul titolo (Localizzato IT/EN, senza prefissi `/`).

### 1.3 Creazione dei Record

I 6 articoli di prova inseriti nel CMS, compilati in doppia lingua e ordinati manualmente tramite drag-and-drop (`position_ASC`):

| Position | Title (IT) | Slug (IT) | Description (IT) | Title (EN) | Slug (EN) | Description (EN) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Il primo post! | `il-primo-post` | Questo è il contenuto del primo articolo di prova. | The first post! | `the-first-post` | This is the content of the first test article. |
| **2** | Il secondo post! | `il-secondo-post` | Guida all'integrazione di Next.js e DatoCMS. | The second post! | `the-second-post` | Guide to integrating Next.js and DatoCMS. |
| **3** | Il terzo post! | `il-terzo-post` | Come gestire la paginazione con le API GraphQL. | The third post! | `the-third-post` | How to handle pagination with GraphQL APIs. |
| **4** | Il quarto post! | `il-quarto-post` | Creazione di componenti riutilizzabili in React. | The fourth post! | `the-fourth-post` | Creating reusable components in React. |
| **5** | Il quinto post! | `il-quinto-post` | Ottimizzazione del layout con Tailwind CSS. | The fifth post! | `the-fifth-post` | Layout optimization using Tailwind CSS. |
| **6** | Il sesto post! | `il-sesto-post` | Gestione delle rotte dinamiche con l'App Router. | The sixth post! | `the-sixth-post` | Managing dynamic routes with App Router. |

---

## 2. Componente Riutilizzabile: `ArticleCard` (`src/app/widgets/Article/ArticleCard.jsx`)

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
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';

// 1. Definiamo la quantità di articoli per pagina
const PAGE_SIZE = 3;

// 2. Query GraphQL con Fragment e paginazione
const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    _allArticlesModelsMeta {
      count