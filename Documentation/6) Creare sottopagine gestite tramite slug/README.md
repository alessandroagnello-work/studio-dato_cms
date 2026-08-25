# Guida Tecnica: Gestione Pagine Dinamiche ([slug]) e Multilingua (Next.js 16 + DatoCMS)

Documentazione per la configurazione delle rotte dinamiche `[slug]`, l'integrazione del menù di navigazione con prefisso lingua automatico e la gestione della Homepage tramite il modello `articolo` su DatoCMS e Next.js 16 App Router.

---

## 1. Configurazione Schema DatoCMS

### Aggiunta del campo Slug al modello `articolo`
1. Accedere a **Schema** -> **Articolo** (Model ID: `articolo`).
2. Cliccare su **Add new field** -> **SEO** -> **Slug**.
3. Scheda **Settings**:
   * **Field label:** `Slug`
   * **Field ID (API Key):** `slug` (in minuscolo)
   * **Enable localization on this field?:** Attivato
4. Scheda **Validations**:
   * **Required:** Attivato
   * **Unique field:** Attivato
5. Cliccare su **Save field**.

---

## 2. Struttura Contenuti (Content)

Configurazione dei record nella sezione **Content** -> **Articolo**:

| Pagina | Titolo (IT / EN) | Slug (IT) | Slug (EN) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | Home / Home | `home` | `home` | Published |
| **Articolo** | Il mio primo articolo / My first article | `articolo` | `article` | Published |
| **Contatti** | Contatti / Contacts | `contatti` | `contacts` | Published |

> **Nota sul Menu Item:** Nel modello `menu_item`, i valori del campo `url` devono sempre iniziare con lo slash (es. `/`, `/articolo`, `/contatti`). L'URL su DatoCMS rappresenta la rotta agnostica senza prefisso lingua; la lingua viene iniettata dinamicamente da Next.js. 

---

## 3. Architettura Cartelle Next.js

```text
src/app/
└── [lang]/
    ├── layout.js         <-- Layout di segmento con Navigazione i18n
    ├── not-found.js      <-- Pagina 404 personalizzata
    ├── page.js           <-- Homepage per rotta (/it, /en)
    └── [slug]/
        └── page.js       <-- Template dinamico per tutte le sottopagine
```

---

## 4. Spiegazione Approfondita e Codici Sorgente

### 4.1 Homepage (`src/app/[lang]/page.js`)

**Cosa fa questo script:**
1. **Risoluzione Parametri**: Estrae il parametro `lang` dagli URL di radice della lingua (es. `/it` o `/en`).
2. **Fetch Mirato per la Home**: Esegue la query `HOME_QUERY` filtrando il modello `articolo` con `slug: { eq: "home" }` per il `locale` specificato.
3. **Rendering dei Contenuti**: Renderizza il titolo e converte il campo `description` di tipo Structured Text nei rispettivi tag HTML tramite il componente `<StructuredText />`.

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

### 4.2 Pagina Dinamica (`src/app/[lang]/[slug]/page.js`)

**Cosa fa questo script:**
1. **Estrazione Rotta Dinamica**: Riceve sia la lingua (`lang`) che lo `slug` dalla rotta dell'URL (es. `/it/contatti` o `/en/contacts`).
2. **Query per Slug**: Cerca su DatoCMS l'articolo corrispondente allo `slug` e alla lingua specificati.
3. **Gestione 404**: Se DatoCMS non restituisce alcun contenuto per la combinazione `slug` + `lang`, invoca la funzione `notFound()` di Next.js rendendo la pagina di errore 404.
4. **Rendering Dinamico**: Renderizza i contenuti specifici della pagina richiesta in modo completamente agnostico.

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

---

### 4.3 Layout e Menù con Prefisso Lingua (`src/app/[lang]/layout.js`)

**Cosa fa questo script:**
1. **Fetch Voci di Menù**: Recupera l'elenco `allMenuItems` localizzato per la lingua della pagina corrente.
2. **Normalizzazione e Prefissaggio URL**:
   * Pulisce l'URL assicurandosi che inizi con lo slash (`cleanUrl`).
   * Se l'URL di DatoCMS è `/`, genera il link verso la radice localizzata (es. `/${lang}` $\rightarrow$ `/it`).
   * Per qualsiasi altra voce, compone la rotta concatenando la lingua e la parte relativa (es. `/${lang}${cleanUrl}` $\rightarrow$ `/it/chi-siamo`).

```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import '@/app/globals.css';

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!) {
    allMenuItems(locale: $locale, orderBy: position_ASC) {
      id
      label
      url
    }
  }
`;

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  let menuItems = [];

  try {
    const data = await performRequest(LAYOUT_QUERY, {
      variables: { locale: lang },
    });
    menuItems = data?.allMenuItems || [];
  } catch (error) {
    console.error('Errore recupero menu:', error);
  }

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900">
          <nav className="flex gap-4 max-w-5xl mx-auto">
            {menuItems.map((item) => {
              const cleanUrl = item.url.startsWith('/') ? item.url : `/${item.url}`;
              const targetHref = cleanUrl === '/' ? `/${lang}` : `/${lang}${cleanUrl}`;

              return (
                <Link className="hover:underline text-sm font-medium text-gray-200" href="{targetHref}" key="{item.id}">
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
```