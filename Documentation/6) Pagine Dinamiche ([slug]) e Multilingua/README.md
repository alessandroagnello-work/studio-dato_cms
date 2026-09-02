```markdown
# Guida Tecnica (Modulo 6): Pagine Dinamiche ([slug]) e Multilingua

## Introduzione

### Cos'è uno Slug e a cosa servono le Rotte Dinamiche?
Lo **slug** è la parte finale di un URL che identifica in modo univoco una pagina specifica all'interno di un sito web (es. in `www.sito.it/it/chi-siamo`, lo slug è `chi-siamo`). 
In Next.js, utilizzando le parentesi quadre nel nome delle cartelle (es. `[slug]`), creiamo una **Rotta Dinamica**. Invece di creare manualmente un file per ogni pagina del sito, creiamo un unico template (il file `page.js` dentro `[slug]`) che si adatterà automaticamente al contenuto richiesto, interrogando DatoCMS per capire quale articolo mostrare in base all'URL visitato dall'utente.

---

## Riferimenti Ufficiali

* **DatoCMS Filtering Records:** [https://www.datocms.com/docs/content-delivery-api/filtering-records](https://www.datocms.com/docs/content-delivery-api/filtering-records)
* **Next.js Dynamic Routes:** [https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

---

## 1. Configurazione Schema DatoCMS

Andiamo ad estendere un modello preesistente (o a crearne uno nuovo generico, es. `Articolo`) aggiungendo il campo necessario per la generazione degli URL.

### 1.1 Aggiunta del campo Slug al modello `articolo`
1. Accedere alla dashboard di DatoCMS, navigare su **Schema** e selezionare il modello **Articolo** (Model ID: `articolo`).
2. Cliccare su **Add new field** $\rightarrow$ scegliere il gruppo **SEO** $\rightarrow$ selezionare **Slug**.
3. Nella scheda **Settings**:
   * **Field label:** `Slug`
   * **Field ID (API Key):** `slug` (in minuscolo)
   * Spuntare la casella **Enable localization on this field?**.
4. Nella scheda **Validations**:
   * Spuntare **Required**.
   * Spuntare **Unique field** (garantisce che non esistano due URL identici).
5. Cliccare su **Save field**.

---

## 2. Struttura Contenuti (Content)

Configuriamo i record nella sezione **Content** $\rightarrow$ **Articolo** compilando i campi per entrambe le lingue:

| Pagina | Titolo (IT / EN) | Slug (IT) | Slug (EN) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | Home / Home | `home` | `home` | Published |
| **Articolo** | Il mio primo articolo / My first article | `articolo` | `article` | Published |
| **Contatti** | Contatti / Contacts | `contatti` | `contacts` | Published |

> **Nota sul Modello Menu Item:** Nel modello `menu_item` creato nei moduli precedenti, i valori del campo `url` devono sempre iniziare con lo slash (es. `/`, `/articolo`, `/contatti`) e **non devono mai includere la lingua**. L'URL su DatoCMS rappresenta la rotta pura; il prefisso della lingua (es. `/it`) verrà iniettato dinamicamente dal layout globale creato nel Modulo 5.

---

## 3. Architettura Cartelle Next.js

Per supportare la gestione delle pagine dinamiche, la nostra cartella `src/app/` ha questa architettura:

```text
src/app/
└── [lang]/
    ├── layout.js         <-- Layout globale multilingua (completato nel Modulo 5)
    ├── page.js           <-- Homepage dinamica per la rotta base (/it, /en)
    └── [slug]/
        └── page.js       <-- Template dinamico per tutte le pagine interne (/it/contatti, /en/contacts)
```

---

## 4. Implementazione del Codice Sorgente

### 4.1 Modifica del file `src/app/[lang]/page.js`

Questo file gestisce la rotta radice della lingua (es. `localhost:3000/it`). Lo andiamo a modificare affinché recuperi dinamicamente l'articolo che fa da "Home".

**Pezzo 1: Import delle librerie**  
Importiamo l'helper per la fetch dei dati da DatoCMS e il componente per la resa del testo strutturato.
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
```
* **`performRequest`**: Utility personalizzata per eseguire richieste GraphQL verso DatoCMS.
* **`StructuredText`**: Componente nativo di `react-datocms` per renderizzare i blocchi di testo formattato del CMS.

**Pezzo 2: Definizione della Query GraphQL**  
Chiediamo a DatoCMS di restituire esclusivamente il record `articolo` in cui il campo `slug` è esattamente uguale (`eq`) a `"home"`, filtrando per la lingua corrente.
```javascript
const HOME_QUERY = `
  query HomeQuery($locale: SiteLocale!) {
    articolo(locale: $locale, filter: { slug: { eq: "home" } }) {
      title
      description {
        value
      }
    }
  }
`;
```
* **`$locale: SiteLocale!`**: Variabile per la lingua attiva richiesta dall'utente.
* **`filter: { slug: { eq: "home" } }`**: Filtra l'articolo specifico avente slug `"home"`.

**Pezzo 3: Il Server Component e la Chiamata Dati**  
Estraiamo la lingua (`lang`) in modo asincrono dai `params` (in conformità con Next.js 16) e la passiamo alla query GraphQL.
```javascript
export default async function HomePage({ params }) {
  const { lang } = await params;

  const data = await performRequest(HOME_QUERY, {
    variables: { locale: lang },
  });
```
* **`await params`**: Risoluzione asincrona dei parametri dell'URL per estrarre la lingua corrente.
* **`variables: { locale: lang }`**: Associa il valore dell'URL alla query GraphQL.

**Pezzo 4: Rendering e Gestione dei Fallback**  
Mostriamo i dati nella pagina, passando il valore `data.articolo.description` al componente `StructuredText`.
```javascript
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {data?.articolo?.title || 'Home'}
      </h1>
      {data?.articolo?.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```
* **`{data?.articolo?.title || 'Home'}`**: Titolo della pagina con fallback in caso di dati mancanti.
* **`<StructuredText data={...} />`**: Renderizza l'albero AST del contenuto della descrizione.

**Codice Completo di `src/app/[lang]/page.js`**
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

const HOME_QUERY = `
  query HomeQuery($locale: SiteLocale!) {
    articolo(locale: $locale, filter: { slug: { eq: "home" } }) {
      title
      description {
        value
      }
    }
  }
`;

export default async function HomePage({ params }) {
  const { lang } = await params;

  const data = await performRequest(HOME_QUERY, {
    variables: { locale: lang },
  });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {data?.articolo?.title || 'Home'}
      </h1>
      {data?.articolo?.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```

---

### 4.2 Creazione del file `src/app/[lang]/[slug]/page.js`

Creiamo la nuova sottocartella `[slug]` all'interno di `[lang]` e inseriamo un nuovo file `page.js`. Questo sarà il template per tutte le pagine interne del sito.

**Pezzo 1: Import delle librerie e di notFound**  
Importiamo le dipendenze per DatoCMS e la funzione `notFound` per gestire il fallimento della rotta.
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';
```
* **`notFound`**: Funzione nativa di Next.js che interrompe il rendering e mostra la pagina di errore 404 del sistema.

**Pezzo 2: Definizione della Query GraphQL Dinamica**  
A differenza della Home, qui la query accetta due variabili: `$locale` per la lingua e `$slug` per identificare dinamicamente la pagina richiesta nell'URL.
```javascript
const PAGE_BY_SLUG_QUERY = `
  query PageBySlugQuery($locale: SiteLocale!,$slug: String!) {
    articolo(locale: $locale, filter: { slug: { eq:$slug } }) {
      title
      description {
        value
      }
    }
  }
`;
```
* **`$slug: String!`**: Variabile dinamica ricevuta dai parametri dell'URL.
* **`filter: { slug: { eq: $slug } }`**: Cerca nel database l'articolo con lo slug esatto corrispondente al percorso visitato.

**Pezzo 3: Il Server Component e la Gestione Errori (404)**  
Estraiamo sia `lang` sia `slug` dai parametri in modo asincrono. Se DatoCMS non restituisce alcun dato (articolo inesistente), attiviamo `notFound()`.
```javascript
export default async function DynamicPage({ params }) {
  const { lang, slug } = await params;

  const data = await performRequest(PAGE_BY_SLUG_QUERY, {
    variables: { locale: lang, slug },
  });

  // Se l'articolo non esiste, mostra errore 404
  if (!data?.articolo) {
    notFound();
  }
```
* **`const { lang, slug } = await params`**: Estrazione parallela di lingua e slug dell'URL (Next.js 16).
* **`if (!data?.articolo) notFound()`**: Guardia di controllo che previene errori di rendering e restituisce uno status HTTP 404.

**Pezzo 4: Rendering della Pagina**  
Restituiamo il layout visivo compilato con i dati specifici dell'articolo recuperato.
```javascript
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{data.articolo.title}</h1>
      {data.articolo.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```

**Codice Completo di `src/app/[lang]/[slug]/page.js`**
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';

const PAGE_BY_SLUG_QUERY = `
  query PageBySlugQuery($locale: SiteLocale!,$slug: String!) {
    articolo(locale: $locale, filter: { slug: { eq:$slug } }) {
      title
      description {
        value
      }
    }
  }
`;

export default async function DynamicPage({ params }) {
  const { lang, slug } = await params;

  const data = await performRequest(PAGE_BY_SLUG_QUERY, {
    variables: { locale: lang, slug },
  });

  // Se l'articolo non esiste, mostra errore 404
  if (!data?.articolo) {
    notFound();
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{data.articolo.title}</h1>
      {data.articolo.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```

```