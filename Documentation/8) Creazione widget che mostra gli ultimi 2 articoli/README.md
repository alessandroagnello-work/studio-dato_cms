# Guida Tecnica (Modulo 8): Widget Ultimi Articoli Pubblicati e Logica di Filtro

## Introduzione

### Cos'è la logica di Self-Exclusion e il Buffer Query?
Quando vogliamo raccomandare degli "Ultimi articoli pubblicati" in calce alla pagina di un singolo articolo già aperto, rischiamo un errore visivo: se l'articolo in lettura è proprio l'ultimo post creato, il widget finirebbe per raccomandare la pagina stessa su cui l'utente si trova già.

Per evitare questo problema, applichiamo due concetti chiave:
1. **Buffer Query (Over-fetching controllato)**: Se l'obiettivo è mostrare **2 articoli** consigliati, chiediamo a DatoCMS di restituirne **3** (`first: 3`). L'elemento in più funge da "scorta".
2. **Self-Exclusion (Auto-esclusione tramite filtro JS)**: Prima di passare i dati al widget, filtriamo l'array rimuovendo l'articolo avente lo stesso `slug` del post aperto, prendendo poi solo i primi 2 rimasti tramite `.slice(0, 2)`.

---

## Riferimenti Ufficiali

* **DatoCMS Content Delivery API Pagination:** [https://www.datocms.com/docs/content-delivery-api/pagination](https://www.datocms.com/docs/content-delivery-api/pagination)
* **GraphQL Documentation (Aliases):** [https://graphql.org/learn/queries/#aliases](https://graphql.org/learn/queries/#aliases)

---

## 1. DatoCMS: Schema e Gestione Contenuti

### 1.1 Configurazione dello Schema
In DatoCMS usiamo il modello Collection creato nei moduli precedenti:
* **Model Name**: `Articles`
* **Model ID (API Key)**: `articles_model`

### 1.2 Procedura di inserimento dei 6 Record
1. Dalla dashboard di DatoCMS, accedere alla sezione **Content**.
2. Selezionare il modello **Articles** dalla barra laterale.
3. Cliccare su **New Record** per aggiungere ciascun post.
4. Compilare **Title**, **Description** e **Slug** (es. `il-primo-post`).
5. Nel selettore della lingua (IT/EN), compilare le relative traduzioni.
6. Cliccare **Save and Publish** per rendere il contenuto disponibile via API.
7. Ripetere fino al completamento di tutti e 6 i record di prova.

---

## 2. Spiegazione Granulare del Codice e della Query GraphQL

### 2.1 Aliasing e Ordinamento per Data (`_createdAt_DESC`)
In `ARTICLE_QUERY` aggiungiamo un blocco speciale usando la sintassi degli alias di GraphQL:

`rawLatestArticles: allArticlesModels(locale: $locale, first: 3, orderBy: _createdAt_DESC) { ...ArticleCardFields }`

* **`rawLatestArticles:`**: È un **alias**. Ci permette di fare due richieste allo stesso modello (`allArticlesModels`) all'interno della stessa query senza creare conflitti nei nomi delle variabili restituite da DatoCMS.
* **`orderBy: _createdAt_DESC`**: A differenza dell'ordinamento manuale (`position_ASC`), questo parametro ordina i post in base alla data di creazione originale, partendo dal più recente.
* **`...ArticleCardFields`**: Riutilizza il Fragment GraphQL esportato da `ArticleCard.jsx`, garantendo che il widget richieda gli stessi identici dati grafici della pagina lista.

### 2.2 Gestione del Buffer e del Filtro
1. **`first: 3`**: Chiediamo 3 articoli invece di 2. Se l'articolo aperto è l'ultimo creato, rimuovendolo ne rimarranno comunque 2 da mostrare.
2. **`.filter((art) => art.slug !== slug)`**: Confronta lo slug di ciascun articolo restituito dalla query con lo slug dell'URL della pagina corrente, scartando il duplicato.
3. **`.slice(0, 2)`**: Taglia l'array risultante limitando l'output ai primi 2 articoli validi.

---

## 3. Implementazione del Codice Sorgente

### 3.1 Creazione del file `src/app/widgets/Article/LatestArticles.jsx`
Creiamo questo nuovo file all'interno della cartella dei widget dedicati agli articoli per gestire il layout visivo dei post correlati.

**Import del componente ArticleCard**
Importiamo la card precedentemente isolata per garantire che la grafica del singolo articolo rimanga coerente in tutto il sito.
```javascript
import ArticleCard from '@/app/widgets/Article/ArticleCard';
```

**Guardia di Controllo (Early Return)**
Controlliamo che l'array `articles` (passato come prop) contenga effettivamente dei dati. Se l'array è vuoto o inesistente, restituiamo `null` evitando di renderizzare sezioni o titoli vuoti nel DOM.
```javascript
export default function LatestArticles({ articles, lang }) {
  // Se non ci sono articoli disponibili, il widget non viene renderizzato
  if (!articles || articles.length === 0) return null;
```

**Rendering della Griglia**
Stampiamo il titolo della sezione e iteriamo sull'array `articles` per generare le card, passandogli la lingua attuale.
```javascript
  return (
    <section className="mt-16 border-t border-gray-800 pt-12 text-left">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        Ultimi Articoli Pubblicati
      </h2>
      <div className="flex justify-center gap-6 flex-wrap">
        {articles.map((art) => (
          <ArticleCard article={art} key={art.id} lang={lang} />
        ))}
      </div>
    </section>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/widgets/Article/LatestArticles.jsx`
```javascript
import ArticleCard from '@/app/widgets/Article/ArticleCard';

export default function LatestArticles({ articles, lang }) {
  // Se non ci sono articoli disponibili, il widget non viene renderizzato
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-800 pt-12 text-left">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        Ultimi Articoli Pubblicati
      </h2>
      <div className="flex justify-center gap-6 flex-wrap">
        {articles.map((art) => (
          <ArticleCard article={art} key={art.id} lang={lang} />
        ))}
      </div>
    </section>
  );
}
```

---

### 3.2 Modifica del file `src/app/[lang]/articoli/[slug]/page.js`
Andiamo ad aggiornare il file della pagina di dettaglio del singolo articolo integrando la logica appena discussa.

**Import delle dipendenze e del Frammento**
Aggiungiamo l'importazione del nuovo widget `<LatestArticles/>` e del frammento `ARTICLE_CARD_FRAGMENT` che ci servirà nella query.
```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import LatestArticles from '@/app/widgets/Article/LatestArticles';
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';
```

**Query GraphQL con Aliasing e Buffer Query**
Iniettiamo il frammento all'inizio della costante e aggiungiamo il blocco `rawLatestArticles` chiedendo esplicitamente i 3 post più recenti tramite `_createdAt_DESC`.
```javascript
// Query GraphQL aggiornata con Fragment, Aliasing e Ordinamento per Data
const ARTICLE_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    # 1. Dettagli dell'articolo in lettura
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
      title
      description
    }
    
    # 2. Lista completa per la navigazione sequenziale (Precedente/Successivo)
    allArticles: allArticlesModels(locale: $locale, orderBy: position_ASC) {
      title
      slug
    }
    
    # 3. Buffer Query: Recupera i 3 articoli più recenti per gestire l'auto-esclusione
    rawLatestArticles: allArticlesModels(
      locale: $locale
      first: 3
      orderBy: _createdAt_DESC
    ) {
      ...ArticleCardFields
    }
  }
`;
```

**Il Server Component e la Gestione Errori**
Recuperiamo i parametri (eseguendo l'await su `params` in Next.js 16) e lanciamo la query. Come di consueto, se l'articolo principale non esiste attiviamo l'errore 404.
```javascript
export default async function ArticlePage({ params }) {
  // Risoluzione dei parametri in Next.js 16
  const { lang, slug } = await params;

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
```

**Logica di Navigazione e Auto-Esclusione (Self-Exclusion)**
Calcoliamo i post precedente e successivo (invariato). Dopodiché, filtriamo i risultati estratti dal blocco `rawLatestArticles`: rimuoviamo l'articolo attualmente in lettura confrontando gli slug e tagliamo l'array risultante per mantenere esattamente 2 raccomandazioni.
```javascript
  // Navigazione Sequenziale Precedente / Successivo
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // Logica di Auto-Esclusione e Limite
  const latestArticles = (data?.rawLatestArticles || [])
    .filter((art) => art.slug !== slug)
    .slice(0, 2);
```

**Rendering del layout e del widget**
Aggiorniamo il JSX per mostrare il corpo dell'articolo, la navigazione precedente/successivo, e posizioniamo infine il nostro componente `<LatestArticles/>` passandogli la variabile appena filtrata.
```javascript
  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto principale dell'articolo */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione Sequenziale Precedente / Successivo */}
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

      {/* Widget degli ultimi articoli consigliati */}
      <LatestArticles articles={latestArticles} lang={lang} />
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/[lang]/articoli/[slug]/page.js`
```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import LatestArticles from '@/app/widgets/Article/LatestArticles';
import { ARTICLE_CARD_FRAGMENT } from '@/app/widgets/Article/ArticleCard';

// Query GraphQL aggiornata con Fragment, Aliasing e Ordinamento per Data
const ARTICLE_QUERY = `
  ${ARTICLE_CARD_FRAGMENT}

  query ArticleQuery($locale: SiteLocale!, $slug: String!) {
    # 1. Dettagli dell'articolo in lettura
    article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
      title
      description
    }
    
    # 2. Lista completa per la navigazione sequenziale (Precedente/Successivo)
    allArticles: allArticlesModels(locale: $locale, orderBy: position_ASC) {
      title
      slug
    }
    
    # 3. Buffer Query: Recupera i 3 articoli più recenti per gestire l'auto-esclusione
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
  // Risoluzione dei parametri in Next.js 16
  const { lang, slug } = await params;

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

  // Navigazione Sequenziale Precedente / Successivo
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // Logica di Auto-Esclusione e Limite
  const latestArticles = (data?.rawLatestArticles || [])
    .filter((art) => art.slug !== slug)
    .slice(0, 2);

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto principale dell'articolo */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione Sequenziale Precedente / Successivo */}
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

      {/* Widget degli ultimi articoli consigliati */}
      <LatestArticles articles={latestArticles} lang={lang} />
    </main>
  );
}
```