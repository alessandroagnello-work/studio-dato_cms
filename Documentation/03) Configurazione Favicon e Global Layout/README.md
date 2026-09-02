# Guida Tecnica (Modulo 3): Configurazione Favicon e Global Layout

## Introduzione

### Perché gestire la Favicon da DatoCMS?
Nei progetti Next.js standard, la Favicon (l'iconcina che compare nella scheda del browser) viene gestita inserendo un file statico `favicon.ico` direttamente nel codice sorgente. 
Collegando l'applicazione a un Headless CMS come DatoCMS, andiamo invece a centralizzare la gestione dei metadati globali. Sfruttando le **SEO preferences** di DatoCMS e l'oggetto di sistema `_site`, permettiamo ai redattori di aggiornare l'icona del sito (e in futuro i metadati SEO generici) direttamente dalla dashboard, riflettendo le modifiche sul sito istantaneamente senza dover toccare il codice o ricaricare file sui server.

---

## Riferimenti Ufficiali

* **DatoCMS CLI Favicon:** [https://www.datocms.com/docs/content-delivery-api/seo-and-favicon](https://www.datocms.com/docs/content-delivery-api/seo-and-favicon)

---

## 1. Configurazione della Favicon lato DatoCMS e Next.js

### 1.1 Caricamento Favicon su DatoCMS (Dashboard)
Per prima cosa, definiamo l'icona all'interno del CMS:
1. Dalla dashboard di DatoCMS, accedere al menu principale in alto e cliccare su **Content**.
2. Sulla barra laterale di sinistra, selezionare **SEO preferences**.
3. Scorrere fino alla sezione **Website favicon** e cliccare su `Upload new` per caricare l'immagine desiderata (è consigliato un file PNG quadrato, es. 512x512).
4. Cliccare su **Save preferences** in basso a destra.

### 1.2 Rimozione dell'Icona Statica Locale
Nel nostro progetto locale su VS Code, Next.js ha generato di default un file `favicon.ico` nella cartella `src/app/`. 
**Questo file va eliminato**. Se lo lasciamo al suo posto, Next.js darà la priorità al file statico locale, ignorando i metadati dinamici che andremo a richiedere tramite API a DatoCMS.

---

## 2. Inserimento della Favicon nel Layout Principale

In Next.js (App Router), il file `layout.js` è il contenitore principale di tutta l'applicazione (quello che genera i tag `<html>` e `<body>`). È il posto perfetto per richiamare i dati globali del sito.

### 2.1 Modifica del file `src/app/layout.js`
Questo file è stato generato automaticamente in fase di setup. Andiamo a svuotarlo e a riscriverlo per recuperare i tag SEO globali da DatoCMS.

**Import delle librerie**
Iniziamo importando la nostra funzione helper `performRequest` per eseguire chiamate GraphQL verso DatoCMS, e la funzione `toNextMetadata` fornita dalla libreria `react-datocms/seo` per convertire i dati grezzi nel formato supportato da Next.js.
```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
```

**Definizione della Query GraphQL**
Definiamo la stringa di query GraphQL `LAYOUT_QUERY`. Interroghiamo l'oggetto speciale `_site` (nativo di DatoCMS, non va creato manualmente) per recuperare le impostazioni globali del progetto. Il campo `faviconMetaTags` restituisce un array contenente tutti i tag HTML (compresi gli attributi) necessari per la generazione della Favicon nei vari formati supportati dai browser moderni.
```javascript
const LAYOUT_QUERY = `
  query LayoutQuery {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
  }
`;
```

**Generazione Dinamica dei Metadati**
Utilizziamo `generateMetadata()`, una funzione speciale nativa di Next.js. Viene eseguita lato server prima del rendering della pagina e serve a popolare il blocco `<head>` del documento HTML. Al suo interno eseguiamo la chiamata per ottenere l'array di tag da DatoCMS e lo passiamo a `toNextMetadata()` per la conversione.
```javascript
export async function generateMetadata() {
  const data = await performRequest(LAYOUT_QUERY);
  
  // Converte i tag di DatoCMS nel formato accettato da Next.js
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}
```

**Layout Principale di Base**
Infine, esportiamo il componente `RootLayout` che fa da contenitore principale per l'intera applicazione.
```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
      </body>
    </html>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/layout.js`
```javascript
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';

// Query GraphQL per i metadati globali del sito
const LAYOUT_QUERY = `
  query LayoutQuery {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
  }
`;

// Funzione nativa di Next.js per generare i metadati (inclusa la Favicon)
export async function generateMetadata() {
  const data = await performRequest(LAYOUT_QUERY);
  
  // Converte i tag di DatoCMS nel formato accettato da Next.js
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

// Layout principale di base
export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
      </body>
    </html>
  );
}
```