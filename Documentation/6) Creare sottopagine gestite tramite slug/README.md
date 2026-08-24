## Gestione Pagine Dinamiche ([slug]) e Multilingua

Guida alla configurazione delle rotte dinamiche, del menu di navigazione e della Homepage tramite DatoCMS (modello `articolo`) e Next.js 16 App Router (`[lang]`).

---

## 1. Configurazione Schema DatoCMS

### Aggiunta del campo Slug al modello `articolo`
1. Naviga su **Schema** -> **Articolo** (Model ID: `articolo`).
2. Clicca su **Add new field** -> **SEO** -> **Slug**.
3. Scheda **Settings**:
   * **Field label:** `Slug`
   * **Field ID (API Key):** `slug` (deve essere scritto in minuscolo)
   * **Enable localization on this field?:** Attivato
4. Scheda **Validations**:
   * **Required:** Attivato
   * **Unique field:** Attivato
5. Clicca su **Save field**.

---

## 2. Struttura Contenuti (Content)

Configurazione dei record nella sezione **Content** -> **Articolo**:

| Pagina | Titolo (IT / EN) | Slug (IT) | Slug (EN) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | Home / Home | `home` | `home` | Published |
| **Articolo** | Il mio primo articolo / My first article | `articolo` | `article` | Published |
| **Contatti** | Contatti / Contacts | `contatti` | `contacts` | Published |

*Nota sul Menu Item:* Nel modello `menu_item`, i valori del campo `url` devono sempre iniziare con lo slash (es. `/`, `/articolo`, `/contatti`). Non inserire mai la lingua nell'URL di DatoCMS.

---

## 3. Architettura Cartelle Next.js

```text
src/app/
└── [lang]/
    ├── layout.js         <-- Navigazione e header i18n
    ├── not-found.js      <-- Pagina 404 personalizzata
    ├── page.js           <-- Homepage (/it, /en)
    └── [slug]/
        └── page.js       <-- Template dinamico, dove qui verranno mostrate tutte le pagine al di fuori della homepage
```

---

## 4. Codice Sorgente

### Homepage (`src/app/[lang]/page.js`)

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

const HOME_QUERY = `
  query HomeQuery($locale: SiteLocale!) {

    //QUI INSERIAMO LO SLUG DELLA HOME (localhost:3000/it o localhost:3000/en)
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
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">{data?.articolo?.title || 'Home'}</h1>
      {data?.articolo?.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```

### Pagina Dinamica (`src/app/[lang]/[slug]/page.js`)

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
import { notFound } from 'next/navigation';

const PAGE_BY_SLUG_QUERY = `

//QUI DICHIARIAMO QUALE PAGINA PRENDERE IN BASE ALLO SLUG PRESENTE NEL CONTENT (localhost:3000/it/{slug} o localhost:3000/en/{slug})
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
    variables: { locale: lang, slug: slug },
  });

  if (!data?.articolo) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">{data.articolo.title}</h1>
      {data.articolo.description && (
        <StructuredText data="{data.articolo.description}"/>
      )}
    </main>
  );
}
```

### Layout e Menu (`src/app/[lang]/layout.js`)

```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!) {
    allMenuItems(locale: $locale) {
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
    console.error("Errore recupero menu:", error);
  }

  return (
    <html lang={lang}>
      <body>
        <header className="p-4 border-b">
          <nav className="flex gap-4">
            {menuItems.map((item) => {
              const cleanUrl = item.url.startsWith('/') ? item.url : `/${item.url}`;
              const targetHref = cleanUrl === '/' ? `/${lang}` : `/${lang}${cleanUrl}`;

              return (
                <Link className="hover:underline" href="{targetHref}" key="{item.id}">
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

---