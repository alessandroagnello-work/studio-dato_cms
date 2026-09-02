Ecco il **Modulo 5** completo, strutturato esattamente con la sequenza **spiegazione del pezzo $\rightarrow$ codice del pezzo $\rightarrow$ elenco dettagliato della funzionalità del pezzo**, e concluso dal **codice completo finale** per ciascun file.

È racchiuso in un unico blocco di codice sorgente così che tu possa copiarlo con un solo click:

```markdown
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
* **Next.js Middleware Documentation:** [https://nextjs.org/docs/app/building-your-application/routing/middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 1. Configurazione DatoCMS

### 1.1 Attivazione Locales nel Progetto
1. Accedere alla Dashboard di DatoCMS.
2. Navigare in **Configuration** $\rightarrow$ **Locales & Timezone**.
3. Aggiungere `Italian (it)` come lingua principale (Default locale) e `English (en)` come lingua secondaria.

### 1.2 Localizzazione del Modello `Menu Item`
1. Accedere a **Schema** $\rightarrow$ **Menu Item** (`menu_item`).
2. Selezionare il campo **Label** (`label`), cliccare **Edit field** e spuntare la casella **Enable localization on this field?**.
3. Selezionare il campo **URL** (`url`), cliccare **Edit field** e spuntare **Enable localization on this field?**.
4. Salvare le modifiche al modello.

### 1.3 Inserimento delle Traduzioni nei Record (Content)
Nella sezione **Content** $\rightarrow$ **Menu Item**, compilare i campi per ciascuna lingua switchando tramite il selettore in alto a destra:

| Record | Lingua | Label | URL |
| :--- | :--- | :--- | :--- |
| **Record 1 (Home)** | `IT` | `Home` | `/` |
| | `EN` | `Home` | `/` |
| **Record 2 (Chi siamo)** | `IT` | `Chi siamo` | `/chi-siamo` |
| | `EN` | `About us` | `/about-us` |

> **Nota sugli URL:** Nel CMS indichiamo le rotte relative pure (es. `/` o `/chi-siamo`). Il prefisso della lingua (es. `/it` o `/en`) verrà concatenato automaticamente in Next.js.

---

## 2. Spiegazione dei Nuovi Concetti (Dati, Caching e Middleware)

Prima di scrivere il codice, analizziamo i quattro nuovi concetti introdotti:

* **Il Tipo `SiteLocale!` in GraphQL:** DatoCMS genera automaticamente l'enum `SiteLocale` contenente tutte le lingue attive nel pannello. Passando la variabile `$locale` nella query, il CMS restituirà automaticamente solo i valori tradotti per la lingua richiesta dall'utente.
* **Gestione Asincrona dei `params` (Next.js 16):** Nell'App Router di Next.js 16, la prop `params` (che contiene i parametri dell'URL, inclusa la lingua) è una *Promise*. Dobbiamo risolverla tramite `await params` per poter estrarre la lingua corrente (`const { lang } = await params;`).
* **Deduplicazione delle Richieste con React `cache()`:** Poiché sia la funzione dei metadati (`generateMetadata`) sia il layout visivo hanno bisogno degli stessi dati globali (Favicon e Menù), avvolgiamo la nostra chiamata API dentro `cache()` di React. In questo modo Next.js eseguirà un'unica chiamata HTTP a DatoCMS, condividendo i dati tra le due funzioni per massimizzare le prestazioni.
* **Reindirizzamento Automatico via Middleware:** Quando un utente atterra sulla radice del sito (`/`), un file `middleware.js` intercetta la richiesta HTTP e reindirizza automaticamente l'utente verso la versione localizzata (es. `/it`), garantendo che il parametro `[lang]` sia sempre presente nell'URL.

---

## 3. Modifica dell'Architettura e del Codice Sorgente

Per abilitare il multilingua in Next.js, dobbiamo informare il framework che l'intera applicazione dipende da un parametro dinamico di lingua, strutturare il selettore lingua come componente riutilizzabile e gestire i reindirizzamenti automatici.

### 3.1 Creazione della Struttura Cartelle e Widget
Dentro la cartella `src/app/`, creiamo la directory dinamica `[lang]` e isoliamo i widget UI nella cartella `widgets`:

```text
src/app/
├── middleware.js
├── widgets/
│   └── Language/
│       └── languageSwitcher.js
└── [lang]/
    ├── layout.js
    └── page.js
```

---

### 3.2 Creazione del Middleware per il Reindirizzamento i18n (`src/middleware.js`)

Per evitare che la radice `/` restituisca un errore 404, creiamo un middleware che intercetta le richieste e reindirizza gli utenti alla lingua di default.

**Pezzo 1: Definizione della logica di controllo dell'URL**  
Definiamo le lingue supportate e la lingua di default. Verifichiamo se l'URL richiesto possiede già un prefisso di lingua valido; in caso contrario, reindirizziamo l'utente aggiungendo la lingua predefinita.
```javascript
import { NextResponse } from 'next/server';

const defaultLocale = 'it';
const locales = ['it', 'en'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}
```
* **`defaultLocale`**: `'it'` - Lingua di fallback utilizzata quando l'URL non specifica alcuna lingua.
* **`locales`**: `['it', 'en']` - Array contenente la lista delle lingue supportate dal progetto.
* **`pathnameHasLocale`**: Controllo booleano che verifica se il percorso corrente dell'URL comincia già con una delle lingue autorizzate.
* **`NextResponse.redirect`**: Reindirizza la chiamata verso il nuovo URL comprensivo del prefisso della lingua (es. da `/` a `/it`).

**Pezzo 2: Configurazione del Matcher di esclusione**  
Impostiamo il filtro `matcher` per istruire Next.js su quali rotte applicare il middleware, escludendo file statici, risorse grafiche ed endpoint API.
```javascript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```
* **`matcher`**: Espressione regolare che applica la logica del middleware a tutte le pagine dell'applicazione, ignorando le risorse interne di Next.js e le chiamate alle API.

**Codice Completo di `src/middleware.js`**
```javascript
import { NextResponse } from 'next/server';

const defaultLocale = 'it';
const locales = ['it', 'en'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verifica se l'URL contiene gia' una lingua supportata
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Reindirizza alla lingua di default (es. /it)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 3.3 Creazione del Widget Selettore Lingua (`src/app/widgets/Language/languageSwitcher.js`)

Per consentire la commutazione fluida della lingua in qualsiasi pagina del sito senza perdere la rotta corrente, creiamo un Client Component dedicato.

**Pezzo 1: Configurazione Client-Side e Hook di Navigazione**  
Dichiariamo `'use client'` ed utilizziamo `usePathname` per leggere l'URL attualmente aperto dal browser dell'utente.
```javascript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
```
* **`'use client'`**: Istruisce Next.js a compilare questo componente lato client per permettere l'uso degli hook interattivi del browser.
* **`usePathname`**: Hook nativo di Next.js che restituisce il percorso relativo della pagina corrente (es. `/it/chi-siamo`).
* **`Link`**: Componente di Next.js per la navigazione Single Page Application client-side.

**Pezzo 2: Logica di Sostituzione Dinamica del Prefisso Lingua**  
Definiamo la funzione `getPathForLang` che sostituisce il prefisso della lingua attiva (`currentLang`) con quello della lingua di destinazione (`targetLang`).
```javascript
export default function LanguageSwitcher({ currentLang }) {
  const pathname = usePathname();

  const getPathForLang = (targetLang) => {
    if (!pathname) return `/${targetLang}`;
    return pathname.replace(`/${currentLang}`, `/${targetLang}`);
  };
```
* **`currentLang`**: Prop passata dal layout server che indica la lingua attualmente attiva nell'URL (es. `"it"`).
* **`pathname.replace(...)`**: Sostituisce la prima occorrenza del prefisso lingua corrente nell'URL con la nuova lingua target (es. trasforma `/it/chi-siamo` in `/en/chi-siamo`), preservando lo slug della pagina.

**Pezzo 3: Rendering Visivo dei Pulsanti**  
Renderizziamo i link per la selezione dell'idioma applicando uno stile visivo differente alla lingua attiva rispetto a quelle inattive.
```javascript
  return (
    <div className="flex gap-2 text-sm font-semibold">
      <Link ${currentLang="==" 'bg-white 'it' 'text-gray-400'}`} : ? className="{`px-2" href="{getPathForLang('it')}" py-1 rounded text-black'>
        IT
      </Link>
      <Link ${currentLang="==" 'bg-white 'en' 'text-gray-400'}`} : ? className="{`px-2" href="{getPathForLang('en')}" py-1 rounded text-black'>
        EN
      </Link>
    </div>
  );
}
```
* **`href={getPathForLang('it')}`**: Genera dinamicamente la destinazione del link per la lingua selezionata.
* **Ternario sulle classi CSS**: Controlla se `currentLang` corrisponde alla lingua del bottone per evidenziarlo con sfondo bianco (`bg-white text-black`) oppure opacizzarlo (`text-gray-400`).

**Codice Completo di `src/app/widgets/Language/languageSwitcher.js`**
```javascript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LanguageSwitcher({ currentLang }) {
  const pathname = usePathname();

  const getPathForLang = (targetLang) => {
    if (!pathname) return `/${targetLang}`;
    return pathname.replace(`/${currentLang}`, `/${targetLang}`);
  };

  return (
    <div className="flex gap-2 text-sm font-semibold">
      <Link ${currentLang="==" 'bg-white 'it' 'text-gray-400'}`} : ? className="{`px-2" href="{getPathForLang('it')}" py-1 rounded text-black'>
        IT
      </Link>
      <Link ${currentLang="==" 'bg-white 'en' 'text-gray-400'}`} : ? className="{`px-2" href="{getPathForLang('en')}" py-1 rounded text-black'>
        EN
      </Link>
    </div>
  );
}
```

---

### 3.4 Modifica del file Layout Globale (`src/app/[lang]/layout.js`)

Aggiorniamo il layout integrando i font `Geist`, la risoluzione asincrona di `params` per Next.js 16, la chiamata GraphQL localizzata con `cache()` e l'inclusione del widget `LanguageSwitcher`.

**Pezzo 1: Importazione dei Moduli, Font e Componenti**  
Importiamo i font nativi `Geist`, gli helper di DatoCMS, `cache` di React e il widget `LanguageSwitcher`.
```javascript
import { Geist, Geist_Mono } from "next/font/google";
import { toNextMetadata } from "react-datocms/seo";
import { performRequest } from "@/lib/datocms";
import Link from "next/link";
import "../globals.css";
import { cache } from 'react';
import LanguageSwitcher from "@/app/widgets/Language/languageSwitcher";
```
* **`Geist, Geist_Mono`**: Caricamento ottimizzato dei font Google di sistema senza impatto sui tempi di caricamento.
* **`LanguageSwitcher`**: Import del widget Client Component creato al punto precedente.

**Pezzo 2: Query GraphQL Localizzata**  
Dichiariamo la variabile `$locale: SiteLocale!` per recuperare unicamente le voci di menù tradotte nella lingua corrente richiesta dall'utente.
```javascript
const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!){
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    allMenuItems(locale: $locale) {
      id
      label
      url
    }
  }
`;
```
* **`$locale: SiteLocale!`**: Variabile GraphQL tipizzata su DatoCMS per filtrare la lingua.
* **`allMenuItems(locale: $locale)`**: Restituisce unicamente i testi e gli URL tradotti per l'idioma specificato.

**Pezzo 3: Helper per la Cache e Configurazione dei Font**  
Inizializziamo le variabili CSS dei font e avvolgiamo la chiamata dati in `cache()` risolvendo i `params` in modo asincrono per Next.js 16.
```javascript
const getLayoutData = cache(async (params) => {
  const { lang } = await params;
  try {
    return await performRequest(LAYOUT_QUERY, {
      variables: { locale: lang },
    });
  } catch (error) {
    console.error("Errore nel recupero dati layout:", error);
    return null;
  }
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```
* **`cache()`**: Previene la duplicazione della richiesta HTTP verso DatoCMS tra la funzione metadati e il Server Component.
* **`await params`**: Risoluzione obbligatoria della Promise dei parametri URL introdotta in Next.js 16.

**Pezzo 4: Generazione Metadati SEO e Componente Layout**  
Gestiamo i metadati e la struttura HTML radice concatenando il prefisso lingua (`/${lang}${item.url}`) nei link del menù e inserendo il widget `LanguageSwitcher`.
```javascript
export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className={`${geistSans.variable}${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <nav className="flex gap-4">
            {menuItems.map((item) => (
              <Link className="hover:underline" href="{`/${lang}${item.url}`}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Widget Selettore Lingua Dinamico */}
          <LanguageSwitcher currentLang="{lang}"/>
        </header>

        {children}
      </body>
    </html>
  );
}
```
* **`href={`/${lang}${item.url}`}`**: Concatenazione dinamica del prefisso di lingua corrente con la rotta relativa proveniente dal CMS.
* **`<LanguageSwitcher currentLang={lang} />`**: Renderizza il widget client passandogli la lingua attuale estratta dai parametri dell'URL.

**Codice Completo di `src/app/[lang]/layout.js`**
```javascript
import { Geist, Geist_Mono } from "next/font/google";
import { toNextMetadata } from "react-datocms/seo";
import { performRequest } from "@/lib/datocms";
import Link from "next/link";
import "../globals.css";
import { cache } from 'react';
import LanguageSwitcher from "@/app/widgets/Language/languageSwitcher";

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!){
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    allMenuItems(locale: $locale) {
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
    console.error("Errore nel recupero dati layout:", error);
    return null;
  }
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className={`${geistSans.variable}${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <nav className="flex gap-4">
            {menuItems.map((item) => (
              <Link className="hover:underline" href="{`/${lang}${item.url}`}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Widget Selettore Lingua Dinamico */}
          <LanguageSwitcher currentLang="{lang}"/>
        </header>

        {children}
      </body>
    </html>
  );
}
```

```