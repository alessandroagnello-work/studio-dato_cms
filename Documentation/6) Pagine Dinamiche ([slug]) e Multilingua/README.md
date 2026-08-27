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

> **Nota sul Modello Menu Item:** Nel modello `menu_item` creato nei moduli precedenti, i valori del campo `url` devono sempre iniziare con lo slash (es. `/`, `/articolo`, `/contatti`) e **non devono mai includere la lingua**. L'URL su DatoCMS rappresenta la rotta pura; il prefisso della lingua (es. `/it`) verrà iniettato dinamicamente da Next.js.

---

## 3. Architettura Cartelle Next.js

Per supportare questa logica, la nostra cartella `src/app/` dovrà avere questa architettura:

```text
src/app/
└── [lang]/
    ├── layout.js         <-- Layout con Menu tradotto e prefissi dinamici
    ├── page.js           <-- Homepage statica per la rotta base (/it, /en)
    └── [slug]/
        └── page.js       <-- Template dinamico per tutte le altre pagine (/it/contatti, /en/contacts)
```

---

## 4. Implementazione del Codice Sorgente

### 4.1 Modifica del file `src/app/[lang]/page.js`

Questo file gestisce la rotta radice della lingua (es. `localhost:3000/it`). Lo andiamo a modificare affinché recuperi dinamicamente l'articolo che fa da "Home".

**Import delle librerie**
Importiamo la funzione di fetch da DatoCMS e il componente per visualizzare i testi strutturati.
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
```

**Definizione della Query GraphQL**
Chiediamo a DatoCMS di restituire esclusivamente il record `articolo` in cui il campo `slug` è esattamente uguale (`eq`) a `"home"`.
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

**Il Server Component e la Chiamata Dati**
Estraiamo la lingua (`lang`) in modo asincrono dai `params` e la passiamo alla query GraphQL per recuperare i contenuti corretti.
```javascript
export default async function HomePage({ params }) {
  const { lang } = await params;

  const data = await performRequest(HOME_QUERY, {
    variables: { locale: lang },
  });
```

**Rendering e Gestione dei Fallback**
Mostriamo i dati nella pagina, accertandoci di passare correttamente il valore `data.articolo.description` come variabile JavaScript (senza virgolette) al componente `StructuredText`.
```javascript
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {data?.articolo?.title || 'Home'}
      </h1>
      {data?.articolo?.description && (
        <StructuredText data={data.articolo.description} />
      )}
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/[lang]/page.js`
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
        <StructuredText data={data.articolo.description} />
      )}
    </main>
  );
}
```

---

### 4.2 Creazione del file `src/app/[lang]/[slug]/page.js`

Creiamo la nuova sottocartella `[slug]` all'interno di `[lang]` e inseriamo un nuovo file `page.js`. Questo sarà il template per tutte le pagine interne del sito.

**Import delle librerie e di notFound**
Oltre alle solite dipendenze, importiamo `notFound` da `next/navigation`. Ci servirà per generare un errore 404 qualora lo slug non esista nel database.
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';
```

**Definizione della Query GraphQL Dinamica**
A differenza della Home, qui il filtro `eq` non è fisso, ma riceve una seconda variabile `$slug` che definiremo dinamicamente in base all'URL.
```javascript
const PAGE_BY_SLUG_QUERY = `
  query PageBySlugQuery($locale: SiteLocale!, $slug: String!) {
    articolo(locale: $locale, filter: { slug: { eq: $slug } }) {
      title
      description {
        value
      }
    }
  }
`;
```

**Il Server Component e la Gestione Errori (404)**
Estraiamo sia `lang` sia `slug` dai parametri. Eseguiamo la query passando entrambe le variabili. Se DatoCMS non restituisce alcun dato (ovvero lo slug non esiste), attiviamo la funzione `notFound()` per mostrare la pagina di errore di default.
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

**Rendering**
Restituiamo la pagina compilata con i dati specifici dell'articolo richiesto.
```javascript
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{data.articolo.title}</h1>
      {data.articolo.description && (
        <StructuredText data={data.articolo.description} />
      )}
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/[lang]/[slug]/page.js`
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';

const PAGE_BY_SLUG_QUERY = `
  query PageBySlugQuery($locale: SiteLocale!, $slug: String!) {
    articolo(locale: $locale, filter: { slug: { eq: $slug } }) {
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
        <StructuredText data={data.articolo.description} />
      )}
    </main>
  );
}
```

---

### 4.3 Modifica del file `src/app/[lang]/layout.js`

In questo file andiamo ad aggiornare il blocco del Menù di Navigazione. Dobbiamo calcolare dinamicamente i link affinché tengano conto della lingua attualmente visitata.

**Import e Query (Invariato dal modulo precedente)**
Le funzioni di importazione, la query e la configurazione della cache per i metadati rimangono invariate.
```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
import { cache } from 'react';
import Link from 'next/link';
import '@/app/globals.css';

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!) {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    allMenuItems(locale: $locale, orderBy: position_ASC) {
      id
      label
      url
    }
  }
`;

const getLayoutData = cache(async (params) => {
  const { lang } = await params;
  try {
    return await performRequest(LAYOUT_QUERY, {
      variables: { locale: lang },
    });
  } catch (error) {
    console.error('Errore nel recupero dati layout:', error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}
```

**Layout Async e Calcolo Dinamico dei Link**
Quando mappiamo le voci di menù, dobbiamo assicurarci di aggiungere il prefisso della lingua al percorso. Se l'URL da DatoCMS è `/`, generiamo `/${lang}`. Per tutti gli altri URL (es. `/contatti`), concateniamo stringhe per generare `/${lang}/contatti`.
```javascript
export default async function LocalizedLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          
          <nav className="flex gap-4 max-w-5xl">
            {menuItems.map((item) => {
              const localizedHref = item.url === '/' ? `/${lang}` : `/${lang}${item.url}`;
              return (
                <Link className="hover:underline text-sm font-medium text-gray-200" href={localizedHref} key={item.id}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
```

**Rendering del Selettore Lingua**
Costruiamo la porzione destra dell'header, stilizzando le classi del selettore lingua (IT / EN) per indicare visivamente in quale lingua ci troviamo in quel momento.
```javascript
          <div className="flex gap-2 text-sm font-semibold">
            <Link className={`px-3 py-1 rounded transition ${lang === 'it' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`} href="/it">
              IT
            </Link>
            <Link className={`px-3 py-1 rounded transition ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`} href="/en">
              EN
            </Link>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/[lang]/layout.js`
```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
import { cache } from 'react';
import Link from 'next/link';
import '@/app/globals.css';

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!) {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    allMenuItems(locale: $locale, orderBy: position_ASC) {
      id
      label
      url
    }
  }
`;

const getLayoutData = cache(async (params) => {
  const { lang } = await params;
  try {
    return await performRequest(LAYOUT_QUERY, {
      variables: { locale: lang },
    });
  } catch (error) {
    console.error('Errore nel recupero dati layout:', error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

export default async function LocalizedLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          
          {/* Menù di Navigazione Tradotto con prefisso dinamico lingua */}
          <nav className="flex gap-4 max-w-5xl">
            {menuItems.map((item) => {
              const localizedHref = item.url === '/' ? `/${lang}` : `/${lang}${item.url}`;
              return (
                <Link className="hover:underline text-sm font-medium text-gray-200" href={localizedHref} key={item.id}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Selettore Lingua (Language Switcher) */}
          <div className="flex gap-2 text-sm font-semibold">
            <Link className={`px-3 py-1 rounded transition ${lang === 'it' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`} href="/it">
              IT
            </Link>
            <Link className={`px-3 py-1 rounded transition ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`} href="/en">
              EN
            </Link>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
```