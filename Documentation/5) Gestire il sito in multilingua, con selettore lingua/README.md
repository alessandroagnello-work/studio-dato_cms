# Guida Tecnica: Gestione Multilingua (i18n) e Selettore Lingua (Next.js 16 + DatoCMS)

Documentazione per implementare l'internazionalizzazione nativa in Next.js 16 (App Router) tramite la rotta dinamica `[lang]`, sincronizzando le traduzioni dei campi localizzati di DatoCMS e la cache delle chiamate GraphQL.

---

## 1. Configurazione DatoCMS

### 1.1 Attivazione Locales nel Progetto
1. Accedere alla Dashboard di DatoCMS.
2. Navigare in **Configuration** → **Locales & Timezone**.
3. Aggiungere `Italian (it)` come lingua principale (Default locale) e `English (en)` come lingua secondaria.

### 1.2 Localizzazione del Modello `Menu Item`
1. Accedere a **Schema** → **Menu Item** (`menu_item`).
2. Selezionare il campo **Label** (`label`), cliccare **Edit field** e spuntare **Enable localization on this field?**.
3. Selezionare il campo **URL** (`url`), cliccare **Edit field** e spuntare **Enable localization on this field?**.
4. Salvare le modifiche al modello.

### 1.3 Inserimento delle Traduzioni nei Record (Content)
Nella sezione **Content** → **Menu Item**, compilare i campi per ciascuna lingua:

| Record | Lingua | Label | URL |
| :--- | :--- | :--- | :--- |
| **Record 1 (Home)** | `IT` | `Home` | `/it` |
| | `EN` | `Home` | `/en` |
| **Record 2 (Chi siamo)** | `IT` | `Chi siamo` | `/it/chi-siamo` |
| | `EN` | `About us` | `/en/about-us` |

---

## 2. Spiegazione dei Concetti Dati e Caching

### 2.1 Il Tipo `SiteLocale!` in GraphQL
DatoCMS genera automaticamente l'enum `SiteLocale` contenente tutte le lingue attive nel pannello (es. `it`, `en`). Passando la variabile `$locale: SiteLocale!` nelle query, il CMS restituirà automaticamente i valori localizzati del record per la lingua richiesta.

### 2.2 Deduplicazione delle Richieste con React `cache()`
Poiché sia `generateMetadata` che il componente `LocalizedLayout` richiedono i dati del layout (`_site` e `allMenuItems`), avvolgiamo la funzione di fetch dentro `cache()` di React. In questo modo, Next.js esegue un'unica chiamata HTTP a DatoCMS per singola richiesta di pagina, condividendo i dati recuperati.

### 2.3 Gestione Asincrona dei `params` in Next.js 16
In Next.js 16, la prop `params` fornita a layout e pagine è una Promise. È necessario risolverla tramite `await params` per estrarre la lingua corrente (`const { lang } = await params;`).

---

## 3. Implementazione del Codice Sorgente (`src/app/[lang]/layout.js`)

Ecco il codice completo per gestire layout, favicon, voci di menù tradotte e selettore lingua:

```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
import { cache } from 'react';
import Link from 'next/link';
import '@/app/globals.css';

// Query GraphQL con parametro $locale per recuperare contenuti tradotti
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

// Helper con cache React per deduplicare la fetch tra generateMetadata e Layout
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

// Generazione dinamica dei metadati SEO e Favicon
export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

// Layout multilingua per il segmento [lang]
export default async function LocalizedLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          {/* Menù di Navigazione Tradotto */}
          <nav className="flex gap-4">
            {menuItems.map((item) => (
              <Link className="hover:underline text-sm font-medium text-gray-200" href="{item.url}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Selettore Lingua (Language Switcher) */}
          <div className="flex gap-2 text-sm font-semibold">
            <Link ${ 'bg-blue-600 'bg-gray-800 'it' : ? className="{`px-3" hover:text-white' href="/it" lang="==" py-1 rounded text-gray-400 text-white' transition }`}>
              IT
            </Link>
            <Link ${ 'bg-blue-600 'bg-gray-800 'en' : ? className="{`px-3" hover:text-white' href="/en" lang="==" py-1 rounded text-gray-400 text-white' transition }`}>
              EN
            </Link>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
```