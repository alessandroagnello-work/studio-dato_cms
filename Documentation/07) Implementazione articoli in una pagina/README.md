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
3. **Tipo**: Selezionare **Collection** (Modello multi-istanza) e salvare.

### 1.2 Campi dello Schema
Aggiungere i seguenti campi cliccando su **Add new field** e spuntando la casella **Enable localization on this field?** per ciascuno di essi:
* **Title** (`title`): Scegliere **Text** $\rightarrow$ **Single-line string**.
* **Description** (`description`): Scegliere **Text** $\rightarrow$ **Multiple-paragraph text** (per permettere testi lunghi con gli "a capo").
* **Slug** (`slug`): Scegliere **SEO** $\rightarrow$ **Slug** (univoco e generato automaticamente dal titolo).

### 1.3 Creazione dei Record
Inserire 6 articoli di prova compilati in doppia lingua (IT/EN) nella sezione **Content** e ordinarli trascinandoli nella lista:

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

Per mantenere l'interfaccia pulita, creiamo un componente grafico isolato per l'anteprima del singolo articolo.

### 2.1 Creazione del file `src/app/widgets/Article/ArticleCard.jsx`

**Import delle librerie**
Importiamo il tag `Link` per gestire la navigazione lato client verso la pagina di dettaglio.
```javascript
import Link from 'next/link';
```

**Definizione del GraphQL Fragment**
In GraphQL, un Fragment permette di definire una lista riutilizzabile di campi. Esplicitiamo che stiamo richiedendo i campi del tipo `ArticlesModelRecord` (il tipo generato da DatoCMS per il nostro modello `articles_model`).
```javascript
export const ARTICLE_CARD_FRAGMENT = `
  fragment ArticleCardFields on ArticlesModelRecord {
    id
    title
    slug
    description
  }
`;
```

**Il Componente Visivo**
Il componente riceve come *props* sia l'oggetto `article` (contenente i dati restituiti dal CMS) sia la lingua corrente (`lang`) per comporre dinamicamente la rotta del link (`/${lang}/articoli/...`). Utilizziamo utility classes come `line-clamp-2` per troncare i testi troppo lunghi.
```javascript
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
      <Link className="text-blue-400 text-sm font-semibold hover:underline" href={`/${lang}/articoli/${article.slug}`}>
        Leggi articolo →
      </Link>
    </div>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/widgets/Article/ArticleCard.jsx`
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
      <Link className="text-blue-400 text-sm font-semibold hover:underline" href={`/${lang}/articoli/${article.slug}`}>
        Leggi articolo →
      </Link>
    </div>
  );
}
```

---

## 3. Implementazione della Lista Articoli (Paginata)

Adesso creiamo la pagina che mostrerà la griglia degli articoli, interrogando il CMS a blocchi (paginazione).

### 3.1 Creazione del file `src/app/[lang]/articoli/page.js`

**Import delle librerie e Frammento**
Importiamo la funzione di fetch, il tag `Link` e il nostro componente `ArticleCard` insieme al suo Frammento GraphQL (`ARTICLE_CARD_FRAGMENT`).
```javascript
import { performRequest } from '@/lib/datocms';
import Link from 'next/link';
import ArticleCard, { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';
```

**Definizione della Costante e della Query GraphQL**
Definiamo `PAGE_SIZE` (quanti articoli vedere per pagina). La query usa i parametri GraphQL `first` e `skip` per limitare i risultati. Inoltre, chiamiamo il campo di sistema `_allArticlesModelsMeta { count }` per conoscere il numero totale di articoli presenti nel database. Includiamo infine il frammento `...ArticleCardFields`.
```javascript
const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!, $skip: IntType!) {
    # Conteggio totale assoluto degli articoli per la matematica della paginazione
    _allArticlesModelsMeta {
      count
    }
    
    # Blocco paginato degli articoli
    allArticlesModels(locale: $locale, first: $first, skip: $skip, orderBy: position_ASC) {
      ...ArticleCardFields
    }
  }
`;
```

**Il Server Component e Calcolo della Paginazione**
Estraiamo la lingua dai `params` e la pagina corrente dai `searchParams` (es. `?page=2`). Per sicurezza, trasformiamo il parametro stringa in un intero (`parseInt`) e impediamo matematicamente valori inferiori a 1 (`Math.max`). Poi calcoliamo gli elementi da saltare (`skip`).
```javascript
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
```

**Rendering della Griglia e dei Controlli di Navigazione**
Renderizziamo l'array mappando ogni articolo all'interno del componente `<ArticleCard/>`. Subito sotto, calcoliamo logicamente se mostrare i pulsanti "Precedente" e "Successivo" verificando la pagina corrente rispetto al totale calcolato delle pagine (`totalPages`).
```javascript
  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto text-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-tight">
        Lista Articoli
      </h1>

      {/* Rendering della griglia con il componente ArticleCard */}
      <div className="flex justify-center gap-6 flex-wrap mb-10">
        {data?.allArticlesModels?.map((art) => (
          <ArticleCard article={art} key={art.id} lang={lang} />
        ))}
      </div>

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          {currentPage > 1 ? (
            <Link className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href={`/${lang}/articoli?page=${currentPage - 1}`}>
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
            <Link className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href={`/${lang}/articoli?page=${currentPage + 1}`}>
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

#### Ecco un codice d'esempio completo di `src/app/[lang]/articoli/page.js`
```javascript
import { performRequest } from '@/lib/datocms';
import Link from 'next/link';
import ArticleCard, { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';

const PAGE_SIZE = 3;

const ARTICLES_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticlesQuery($locale: SiteLocale!, $first: IntType!, $skip: IntType!) {
    # Conteggio totale assoluto degli articoli per la matematica della paginazione
    _allArticlesModelsMeta {
      count
    }
    
    # Blocco paginato degli articoli
    allArticlesModels(locale: $locale, first: $first, skip: $skip, orderBy: position_ASC) {
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
          <ArticleCard article={art} key={art.id} lang={lang} />
        ))}
      </div>

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-800 pt-6">
          {currentPage > 1 ? (
            <Link className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href={`/${lang}/articoli?page=${currentPage - 1}`}>
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
            <Link className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-200 hover:bg-gray-800 transition" href={`/${lang}/articoli?page=${currentPage + 1}`}>
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

Creiamo la pagina di dettaglio, gestendo la rotta dinamica e i bottoni per passare all'articolo precedente/successivo.

### 4.1 Creazione del file `src/app/[lang]/articoli/[slug]/page.js`

**Import delle librerie e di notFound**
Importiamo la funzione `notFound` da `next/navigation` per innescare un errore 404 qualora l'articolo non esistesse.
```javascript
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import Link from 'next/link';
```

**Definizione della Doppia Query GraphQL**
In una singola chiamata richiediamo due pacchetti di dati: i dettagli pesanti dell'articolo in questione e una lista "leggera" di tutti gli articoli (ordinati) per poter calcolare logicamente quale post venga prima e quale dopo.
```javascript
const ARTICLE_QUERY = `
  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    # 1. Recupera i dettagli per renderizzare la pagina
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
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
```

**Il Server Component e la Gestione Errori (404)**
Otteniamo i dati e, tramite una guardia di controllo, verifichiamo se l'oggetto `article` esiste. In caso negativo, fermiamo l'esecuzione ed evochiamo `notFound()`, che manderà al browser uno Status Code 404 e caricherà la pagina di errore di sistema.
```javascript
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
```

**Calcolo dell'Articolo Precedente e Successivo**
Scorriamo l'array completo per individuare in quale posizione (indice) si trova il nostro articolo. Sfruttando la matematica, ricaviamo lo slug dell'articolo posizionato prima (`currentIndex - 1`) e di quello posizionato dopo (`currentIndex + 1`).
```javascript
  // Identifica la posizione dell'articolo corrente
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;
```

**Rendering del Singolo Articolo**
Stampiamo i contenuti a schermo e costruiamo la barra di navigazione inferiore inserendo i tag `<Link>` dinamicamente in base alla disponibilità di un post precedente o successivo.
```javascript
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
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href={`/${lang}/articoli/${prevArticle.slug}`}>
            ← Precedente
          </Link>
        )}

        <Link className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition" href={`/${lang}/articoli`}>
          Lista Articoli
        </Link>

        {nextArticle && (
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href={`/${lang}/articoli/${nextArticle.slug}`}>
            Successivo →
          </Link>
        )}
      </div>
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/[lang]/articoli/[slug]/page.js`
```javascript
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const ARTICLE_QUERY = `
  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    # 1. Recupera i dettagli per renderizzare la pagina
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
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
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href={`/${lang}/articoli/${prevArticle.slug}`}>
            ← Precedente
          </Link>
        )}

        <Link className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition" href={`/${lang}/articoli`}>
          Lista Articoli
        </Link>

        {nextArticle && (
          <Link className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 text-sm transition" href={`/${lang}/articoli/${nextArticle.slug}`}>
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

Creiamo l'interfaccia dedicata per gestire lo status HTTP 404.

### 5.1 Creazione del file `src/app/[lang]/not-found.js`

**Import delle librerie**
Importiamo `Link` per permettere all'utente di tornare alla home qualora si fosse smarrito.
```javascript
import Link from 'next/link';
```

**Il Componente di Errore 404**
Esportiamo la funzione `NotFound`. Collocando questo file all'interno della cartella `[lang]`, la pagina di errore verrà renderizzata automaticamente **dentro il layout principale** (`layout.js`). Questo garantisce che l'utente veda comunque l'header, il menù di navigazione e i footer del sito pur ricevendo tecnicamente una vera risposta 404.
```javascript
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

#### Ecco un codice d'esempio completo di `src/app/[lang]/not-found.js`
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