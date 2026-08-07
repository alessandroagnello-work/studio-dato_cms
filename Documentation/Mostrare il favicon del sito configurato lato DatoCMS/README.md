## Mostrare il favicon del sito configurato lato DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Favicon:** https://www.datocms.com/docs/content-delivery-api/seo-and-favicon
---

### Come prendere il Favicon da DatoCMS

1. **Eliminazione Icona Statica Locale:** Rimuovere il file `src/app/favicon.ico` generato di default da Next.js. Se presente, Next.js sovrascrive ed esclude i metadati dinamici forniti dall'API.

2. **Caricamento Favicon su DatoCMS:**
   * Dalla dashboard di DatoCMS, accedere a **Content** -> **SEO preferences**.
   * Caricare l'immagine dell'icona nella sezione **Website favicon** (`Upload new`).
   * Cliccare **Save preferences**.

---

#### Aggiungere in `src/app/layout.js` i seguenti:

  #### Import:

  ```javascript

  import { toNextMetadata } from "react-datocms/seo";
  import { performRequest } from "@/lib/datocms";

  ```
  #### Nuova constante LAYOUT_QUERY per la generazione di contenuti:

  ```javascript

  // Query GraphQL
  const LAYOUT_QUERY = `
    query {
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

  # Nota: se ne esiste già 1 di constante di questo tipo, aggiungere dentro la sua query solo:

  ```javascript

    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }

   ```

### Spiegazione delle aggiunte nel Codice (`src/app/layout.js`)

* **Query GraphQL (`LAYOUT_QUERY`)**:
  * `_site`: Oggetto di sistema nativo di DatoCMS per recuperare i parametri globali del progetto.
  * `faviconMetaTags`: Estrae l'array di tag HTML, attributi e valori generati dall'immagine caricata nel pannello SEO.

* **Integrazione Metadati (`generateMetadata`)**:

  * `export async function generateMetadata()`: Funzione nativa di Next.js App Router per definire dinamicamente i tag dell'head della pagina lato server.
  * `toNextMetadata(data?._site?.faviconMetaTags || [])`: Helper del pacchetto `react-datocms/seo` che converte l'array di tag fornito da DatoCMS nell'oggetto metadati compatibile con Next.js.