# Guida Tecnica (Modulo 7): Articoli, Paginazione, Componente ArticleCard e Gestione Errore 404

## Introduzione

### Perché usare la Paginazione, i GraphQL Fragments e la Pagina 404?
Quando un sito ospita un numero elevato di articoli, non possiamo scaricarli tutti in un'unica richiesta HTTP senza rallentare il browser dell'utente. La **Paginazione** risolve il problema richiedendo a DatoCMS solo un blocco limitato di contenuti alla volta (es. 3 per pagina).

Per mantenere il codice modulare e riutilizzabile (principio DRY), isoliamo la grafica del singolo post nel componente `ArticleCard`. Tramite i **GraphQL Fragments**, definiamo i campi richiesti direttamente all'interno del componente, evitando di duplicare l'elenco dei campi nelle query GraphQL.

Infine, configuriamo un file dedicato `not-found.js`: quando un utente cerca un articolo non esistente o rimosso, Next.js risponderà con una vera pagina di errore 404 mantenendo il layout grafico del sito (Header, Footer e lingua).

---

## Riferimenti Ufficiali

* **DatoCMS Content Delivery API Pagination:** [https://www.datocms.com/docs/content-delivery-api/pagination](https://www.datocms.com/docs/content-delivery-api/pagination)
* **DatoCMS How to Fetch Records:** [https://www.datocms.com/docs/content-delivery-api/how-to-fetch-records](https://www.datocms.com/docs/content-delivery-api/how-to-fetch-records)
* **GraphQL Documentation (Fragments):** [https://graphql.org/learn/queries/#fragments](https://graphql.org/learn/queries/#fragments)
* **Next.js notFound Function:** [https://nextjs.org/docs/app/api-reference/functions/not-found](https://nextjs.org/docs/app/api-reference/functions/not-found)

---

## 1. DatoCMS: Schema e Content Articoli

### 1.1 Creazione del Modello
1. Nella Dashboard di DatoCMS, accedere a **Schema** e cliccare su **Create new model**.
2. **Model Name**: `Articles` (Model ID generato: `articles_model`).
3. **Tipo**: Selezionare **Collection** (Modello multi-istanza).

### 1.2 Campi dello Schema
Aggiungere i seguenti campi spuntando la casella **Enable localization on this field?** per ciascuno:
* **Title** (`title`): Stringa a riga singola (Single-line string).
* **Description** (`description`): Testo a più paragrafi (Multiple-paragraph text).
* **Slug** (`slug`): Campo di tipo Slug univoco generato automaticamente dal titolo.

### 1.3 Creazione dei Record
Inserire 6 articoli di prova compilati in doppia lingua (IT/EN) e ordinarli trascinandoli nella lista (`position_ASC`):

| Pos | Title (IT) | Slug (IT) | Title (EN) | Slug (EN) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Il primo post! | `il-primo-post` | The first post! | `the-first-post` |
| **2** | Il secondo post! | `il-secondo-post` | The second post! | `the-second-post` |
| **3** | Il terzo post! | `il-terzo-post` | The third post! | `the-third-post` |
| **4** | Il quarto post! | `il-quarto-post` | The fourth post! | `the-fourth-post` |
| **5** | Il quinto post! | `il-quinto-post` | The fifth post! | `the-fifth-post` |
| **6** | Il sesto post! | `il-sesto-post` | The sixth post! | `the-sixth-post` |

---

## 2. Componente Riutilizzabile: `ArticleCard`

### 2.1 Analisi del Codice e Concetti
* **`on ArticlesModelRecord`**: In GraphQL, un Fragment deve dichiarare a quale tipo di dato appartiene. DatoCMS genera il tipo `ArticlesModelRecord` combinando la API Key del modello (`articles_model`) con la parola `Record`.
* **Prop `lang`**: Il componente riceve sia l'oggetto `article` sia la lingua corrente (`lang`) per comporre dinamicamente la rotta del link (`/${lang}/articoli/...`).

### 2.2 Creazione del file `src/app/widgets/Article/ArticleCard.jsx`
Creare la cartella `src/app/widgets/Article/` e al suo interno il file `ArticleCard.jsx`:

```javascript
import Link from 'next/link';

// GraphQL Fragment: Esplicitiamo i campi esatti richiesti da questo componente visivo
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

## 3. Implementazione della Lista Articoli (Paginata)

### 3.1 Analisi del Codice (Cosa aggiungiamo e perché)
* **`first: $first` e `skip: $skip`**: Parametri di paginazione GraphQL. Se `first` è 3 e `skip` è 3, DatoCMS salta i primi 3 articoli e restituisce i successivi 3 (Pagina 2).
* **`_allArticlesModelsMeta { count }`**: Campo speciale di sistema di DatoCMS per ottenere il numero totale assoluto dei record e calcolare il numero di pagine complessive.
* **`...ArticleCardFields`**: Inserisce nella query il frammento esportato da `ArticleCard.jsx`.
* **`parseInt(page || '1', 10)` e `Math.max(1, ...)`**: Convertono la stringa nell'URL (`?page=2`) in numero intero e impediscono valori minori di 1 per evitare errori matematici nel calcolo dell'offset.

### 3.2 Creazione del file `src/app/[lang]/articoli/page.js`

```javascript
import { performRequest } from '@/lib/datocms';
import Link from 'next/link';
import ArticleCard, { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!,$skip: IntType!) {
    # Conteggio totale assoluto degli articoli per la matematica della paginazione
    _allArticlesModelsMeta {
      count
    }
    
    # Blocco paginato degli articoli
    allArticlesModels(locale: $locale, first: $first, skip:$skip, orderBy: position_ASC) {
      ...ArticleCardFields
    }
  }
`;

export default async function ArticoliPage({ params, searchParams }) {
  const { lang } = await params;
  const { page } = await searchParams;

  // Sicurezza: trasforma in numero e impedisce valori negativi o inferiori a 1
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  
  // Calcolo articoli da saltare (es: Pagina 2 -> (2 - 1) * 3 = 3 articoli saltati)
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

      {/* Rendering della griglia con il componente ArticleCard */}
      <div className="flex justify-center gap-6 flex-wrap mb-10">
        {data?.allArticlesModels?.map((art) => (
          <ArticleCard article="{art}" key="{art.id}" lang="{lang}"/>
        ))}
      </div>

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          {currentPage > 1 ? (
            <Link - 1}`} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href="{`/${lang}/articoli?page=${currentPage">
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
            <Link + 1}`} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href="{`/${lang}/articoli?page=${currentPage">
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

## 4. Implementazione del Singolo Articolo (Dettaglio)

### 4.1 Analisi del Codice (Cosa aggiungiamo e perché)
* **Doppia Query in `ARTICLE_QUERY`**:
  Chiediamo il dettaglio dell'articolo corrente (`article`) e contemporaneamente una lista completa e leggera (`allArticles`) per calcolare gli slug dell'articolo precedente e successivo tramite `.findIndex()`.
* **Uso di `notFound()`**:
  Importata da `next/navigation`. Se DatoCMS non trova l'articolo corrispondente allo slug inviato, eseguiamo `notFound()`. Questo attiva il rendering del file `not-found.js` e restituisce un codice di risposta HTTP 404 al client e ai motori di ricerca.

### 4.2 Creazione del file `src/app/[lang]/articoli/[slug]/page.js`

```javascript
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const ARTICLE_QUERY = `
  query ArticleQuery($locale: SiteLocale!,$slug: String!) {
    # 1. Recupera i dettagli per renderizzare la pagina
    article: articlesModel(filter: { slug: { eq: $slug } }, locale:$locale) {
      title
      description
    }
    
    # 2. Recupera l'elenco sequenziale leggero per i bottoni Prev/Next
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

  // Se l'articolo non esiste su DatoCMS, genera una risposta HTTP 404
  if (!article) {
    notFound();
  }

  // Identifica la posizione dell'articolo corrente
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
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione tra articoli correlati */}
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

---

## 5. Gestione degli Errori e Pagina 404 (`not-found.js`)

### 5.1 Analisi del Codice (Cosa aggiungiamo e perché)
* **Posizionamento in `src/app/[lang]/not-found.js`**: Collocando il file all'interno della cartella `[lang]`, la pagina di errore verrà renderizzata **dentro il layout principale** (`layout.js`). Ciò garantisce la presenza di Header, Navigazione, Selettore di Lingua e stili globali Tailwind.
* **Risposta HTTP 404 Effettiva**: A differenza di un normale componente visivo, l'uso di `not-found.js` in combinazione con la funzione `notFound()` assicura che il server invii lo status code **404 Not Found**. Questo impedisce ai motori di ricerca di indicizzare pagine prive di contenuto ("Soft 404").

### 5.2 Creazione del file `src/app/[lang]/not-found.js`

```javascript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-extrabold text-blue-500 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-white mb-4">
        Pagina non trovata / Page not found
      </h2>
      <p className="text-gray-400 max-w-md mb-8 text-sm">
        Il contenuto che stai cercando è stato rimosso, ha cambiato indirizzo o non è disponibile su DatoCMS.
      </p>
      
      <Link className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition shadow-lg" href="/">
        Torna alla Home
      </Link>
    </div>
  );
}
```