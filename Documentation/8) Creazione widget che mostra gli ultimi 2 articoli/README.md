# Guida all'Integrazione Widget Ultimi Articoli (Next.js 16 + DatoCMS)

In questo readme, capiamo come creare un widget per mostrare 

---

## 1. DatoCMS: Schema e Creazione dei 6 Articoli

### 1.1 Configurazione dello Schema
Nel pannello **Schema** di DatoCMS è stato creato il modello multi-istanza (Collection):
* **Model Name**: `Articles`
* **Model ID (API Key)**: `articles_model`

**Campi dello schema:**
* **Title** (`title`): Campo stringa a riga singola (Localizzato).
* **Description** (`description`): Campo testo a più righe (Localizzato).
* **Slug** (`slug`): Campo di tipo Slug univoco generato automaticamente dal titolo (Localizzato).

---

### 1.2 Procedura per Creare i 6 Articoli da DatoCMS

Per popolare il CMS con i 6 record iniziali, eseguire i seguenti passaggi dall'interfaccia di DatoCMS:

1. **Accedere alla sezione Content**: Dal menu di navigazione in alto o di sinistra, cliccare su **Content**.
2. **Selezionare il modello**: Cliccare sulla voce **Articles** nella colonna dei modelli.
3. **Creare un nuovo record**: Cliccare sul pulsante **New Record** (in alto a destra).
4. **Compilare i dati**:
   * **Title**: Inserire il titolo (es. *Il primo post!*).
   * **Description**: Inserire una breve descrizione di prova.
   * **Slug**: Cliccare su *Generate from Title* o digitare lo slug univoco (es. `il-primo-post`).
5. **Gestione Lingue (se multilingua)**: Se il progetto supporta più lingue (es. IT/EN), passare alla seconda lingua tramite il selettore e compilare i rispettivi campi.
6. **Pubblicare**: Cliccare sul pulsante verde **Save and Publish** in alto a destra per rendere visibile il contenuto via API.
7. **Ripetere**: Eseguire la stessa procedura per tutti e **6 gli articoli** (da *Il primo post!* fino a *Il sesto post!*).

---

## 2. Spiegazione Logica e Query GraphQL

### 2.1 La Query GraphQL (`ARTICLE_QUERY`)
Nella pagina di dettaglio occorre recuperare:
1. I dati del post aperto (tramite lo `slug` corrente).
2. La lista completa per i pulsanti *Precedente/Successivo* (ordinata per `position_ASC`).
3. Gli ultimi articoli recenti (ordinati per `_createdAt_DESC`).

```graphql
query ArticleQuery($locale: SiteLocale!, $slug: String!) {
  # 1. Articolo attualmente in lettura
  article: articlesModel(filter: { slug: { eq: $slug } }, locale: $locale) {
    title
    description
  }

  # 2. Lista completa per navigazione sequenziale
  allArticles: allArticlesModels(locale: $locale, orderBy: position_ASC) {
    title
    slug
  }

  # 3. Articoli recenti per il widget (chiediamo 3 elementi per sicurezza)
  rawLatestArticles: allArticlesModels(
    locale: $locale
    first: 3
    orderBy: _createdAt_DESC
  ) {
    id
    title
    slug
    description
  }
}
```

---

### 2.2 Perché richiediamo `first: 3` per mostrarne 2? (Gestione del Buffer)

Se l'obiettivo è mostrare **2 articoli recenti** in calce alla pagina:
* **Il problema**: Se l'utente sta consultando il post più recente in assoluto (es. l'articolo #6) e chiedessimo solo `first: 2`, filtrando via il post corrente rimarrebbe soltanto **1 unico articolo** a schermo.
* **La soluzione**: Impostando `first: 3`, chiediamo a DatoCMS i primi 3 post più recenti. Dopo aver applicato il filtro `.filter(art => art.slug !== slug)` per rimuovere il post aperto, ci garantiamo di avere sempre **2 articoli** da mostrare tramite `.slice(0, 2)`.

---

## 3. Implementazione del Codice

### 3.1 Pagina Dettaglio: `src/app/[lang]/articoli/[slug]/page.js`

In questo file viene gestita la lettura dei parametri, la chiamata a DatoCMS via GraphQL, il filtraggio JS e la composizione finale della pagina.

```javascript
import { performRequest } from '@/lib/datocms';
import { notFound } from 'next/navigation';
import ScrollButtons from '@/app/widgets/scrollButtons';
import LatestArticles from '@/app/widgets/latestArticles';

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
    rawLatestArticles: allArticlesModels(
      locale: $locale
      first: 3
      orderBy: _createdAt_DESC
    ) {
      id
      title
      slug
      description
    }
  }
`;

export default async function ArticlePage({ params }) {
  // Passaggio 1: Risoluzione dinamica dei parametri URL in Next.js 16
  const resolvedParams = await params;
  const lang = resolvedParams?.lang;
  const slug = resolvedParams?.slug;

  // Controllo di sicurezza: se lo slug manca, interrompiamo subito senza chiamare GraphQL
  if (!slug) {
    notFound();
  }

  // Passaggio 2: Esecuzione della query GraphQL a DatoCMS
  const data = await performRequest(ARTICLE_QUERY, {
    variables: { locale: lang, slug },
  });

  const article = data?.article;
  const allArticles = data?.allArticles || [];

  if (!article) {
    notFound();
  }

  // Passaggio 3: Calcolo dell'articolo Precedente e Successivo per la navigazione
  const currentIndex = allArticles.findIndex((art) => art.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // Passaggio 4: Filtraggio post aperto ed estrazione dei primi 2 recenti rimasti
  const latestArticles = (data?.rawLatestArticles || [])
    .filter((art) => art.slug !== slug)
    .slice(0, 2);

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto text-white text-center">
      {/* Contenuto principale */}
      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{article.title}</h1>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-lg text-left">
          {article.description}
        </div>
      </article>

      {/* Navigazione Sequenziale Precedente / Successivo */}
      <ScrollButtons : ? `/${lang}/articoli/${nextArticle.slug}` `/${lang}/articoli/${prevArticle.slug}` centerHref="{`/${lang}/articoli`}" centerText="Lista Articoli" nextHref="{nextArticle" null} prevHref="{prevArticle"/>

      {/* Widget degli articoli consigliati (fino a 2) */}
      <LatestArticles articles="{latestArticles}" lang="{lang}"/>
    </main>
  );
}
```

---

### 3.2 Componente Widget: `src/app/widgets/latestArticles.js`

Il componente gestisce la resa visiva delle schede. Utilizza **Flexbox** (`flex justify-center gap-6 flex-wrap`) per garantire la simmetria visiva:
* Se riceve **2 articoli**, li affianca perfettamente al centro.
* Se riceve **1 solo articolo**, lo posiziona al centro senza sbilanciare la griglia.

```javascript
import Link from 'next/link';

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
          <div
            key={art.id}
            className="p-5 rounded-xl bg-gray-900 border border-gray-800 flex flex-col justify-between hover:border-blue-500/50 transition duration-200 shadow-lg w-full max-w-xs"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {art.title}
              </h3>
              {art.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {art.description}
                </p>
              )}
            </div>
            <Link className="text-blue-400 text-sm font-semibold hover:underline" href="{`/${lang}/articoli/${art.slug}`}">
              Leggi articolo →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
```