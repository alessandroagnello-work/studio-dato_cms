# Guida Tecnica (Modulo 5): Gestione Multilingua (i18n) e Selettore Lingua

## Introduzione

### Cos'è l'i18n?
**i18n** è un numeronimo standard nel mondo dello sviluppo software che sta per **Internationalization** (*Internazionalizzazione*): tra la **i** iniziale e la **n** finale ci sono esattamente 18 lettere. 
Nel contesto del nostro progetto Next.js e DatoCMS, l'i18n indica l'insieme di tecniche per rendere l'applicazione multilingua, permettendo agli utenti di cambiare idioma tramite un selettore e avere URL dedicati per ogni lingua (es. `/it` o `/en`).

---

## Riferimenti Ufficiali

* **DatoCMS Content Delivery API Localization:** [https://www.datocms.com/docs/content-delivery-api/localization](https://www.datocms.com/docs/content-delivery-api/localization)
* **DatoCMS General Concepts Localization:** [https://www.datocms.com/docs/general-concepts/localization](https://www.datocms.com/docs/general-concepts/localization)
* **Next.js Internationalization Routing:** [https://nextjs.org/docs/app/building-your-application/routing/internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

## 1. Configurazione DatoCMS

### 1.1 Attivazione Locales nel Progetto
1. Accedere alla Dashboard di DatoCMS.
2. Navigare in **Configuration** → **Locales & Timezone**.
3. Aggiungere `Italian (it)` come lingua principale (Default locale) e `English (en)` come lingua secondaria.

### 1.2 Localizzazione del Modello `Menu Item`
1. Accedere a **Schema** → **Menu Item** (`menu_item`).
2. Selezionare il campo **Label** (`label`), cliccare **Edit field** e spuntare la casella **Enable localization on this field?**.
3. Selezionare il campo **URL** (`url`), cliccare **Edit field** e spuntare **Enable localization on this field?**.
4. Salvare le modifiche al modello.

### 1.3 Inserimento delle Traduzioni nei Record (Content)
Nella sezione **Content** → **Menu Item**, compilare i campi per ciascuna lingua switchando tramite il selettore in alto a destra:

| Record | Lingua | Label | URL |
| :--- | :--- | :--- | :--- |
| **Record 1 (Home)** | `IT` | `Home` | `/it` |
| | `EN` | `Home` | `/en` |
| **Record 2 (Chi siamo)** | `IT` | `Chi siamo` | `/it/chi-siamo` |
| | `EN` | `About us` | `/en/about-us` |

---

## 2. Spiegazione dei Nuovi Concetti (Dati e Caching)

Prima di scrivere il codice, analizziamo i tre nuovi concetti introdotti:

* **Il Tipo `SiteLocale!` in GraphQL:** DatoCMS genera automaticamente l'enum `SiteLocale` contenente tutte le lingue attive nel pannello. Passando la variabile `$locale` nella query, il CMS restituirà automaticamente solo i valori tradotti per la lingua richiesta dall'utente.
* **Gestione Asincrona dei `params` (Next.js 16):** Nell'App Router di Next.js 16, la prop `params` (che contiene i parametri dell'URL, inclusa la lingua) è una *Promise*. Dobbiamo risolverla tramite `await params` per poter estrarre la lingua corrente (`const { lang } = await params;`).
* **Deduplicazione delle Richieste con React `cache()`:** Poiché sia la funzione dei metadati (`generateMetadata`) sia il layout visivo hanno bisogno degli stessi dati globali (Favicon e Menù), avvolgiamo la nostra chiamata API dentro `cache()` di React. In questo modo Next.js eseguirà un'unica chiamata HTTP a DatoCMS, condividendo i dati tra le due funzioni per massimizzare le prestazioni.

---

## 3. Modifica dell'Architettura e del Codice Sorgente

Per abilitare il multilingua in Next.js, dobbiamo informare il framework che l'intera applicazione dipende da un parametro dinamico di lingua.

### 3.1 Creazione della cartella `[lang]`
Dentro la cartella `src/app/`, creiamo una nuova sottocartella chiamata letteralmente `[lang]` (comprese le parentesi quadre). 
Spostiamo al suo interno i file `layout.js` e `page.js` che avevamo creato nei moduli precedenti.
La nuova struttura dovrà essere:
```text
src/app/
└── [lang]/
    ├── layout.js
    └── page.js
```

### 3.2 Modifica del file `src/app/[lang]/layout.js`
Apriamo il file `layout.js` (ora spostato dentro `[lang]`) e aggiorniamolo per supportare il nuovo parametro dinamico, la cache e il selettore della lingua.

**Cosa andiamo a modificare:**
1. **Import:** Aggiungiamo `cache` da `react`.
2. **Query:** Modifichiamo `LAYOUT_QUERY` per accettare il parametro `$locale` e passarlo alla richiesta `allMenuItems`.
3. **Helper:** Creiamo la funzione `getLayoutData` avvolta in `cache()`.
4. **Layout Async:** Risolviamo `await params` per ottenere `lang` e passarlo al tag `<html>`.
5. **JSX:** Aggiungiamo il blocco HTML con i due link per cambiare lingua (IT / EN), gestendo la classe attiva in modo dinamico.

**Codice Sorgente Completo Aggiornato:**

```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
import { cache } from 'react';
import Link from 'next/link';
import '@/app/globals.css';

// 1. QUERY: Aggiunto parametro $locale per recuperare contenuti tradotti
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

// 2. HELPER CACHE: Deduplica la fetch tra generateMetadata e il Layout
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

// 3. METADATI: Richiama la funzione cacheata
export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

// 4. LAYOUT: Estrae la lingua dai params e renderizza l'HTML
export default async function LocalizedLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
          
          {/* Menù di Navigazione Tradotto */}
          <nav className="flex gap-4 max-w-5xl">
            {menuItems.map((item) => (
              <Link className="hover:underline text-sm font-medium text-gray-200" href="{item.url}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Selettore Lingua (Language Switcher) */}
          <div className="flex gap-2 text-sm font-semibold">
            <Link ${lang="==" 'bg-blue-600 'bg-gray-800 'it' : ? className="{`px-3" hover:text-white'}`} href="/it" py-1 rounded text-gray-400 text-white' transition>
              IT
            </Link>
            <Link ${lang="==" 'bg-blue-600 'bg-gray-800 'en' : ? className="{`px-3" hover:text-white'}`} href="/en" py-1 rounded text-gray-400 text-white' transition>
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