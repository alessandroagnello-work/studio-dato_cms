# Gestire il sito in multilingua, con selettore lingua

## Riferimenti Ufficiali

* **DatoCMS GraphQL Localization:** https://www.datocms.com/docs/content-delivery-api/localization
* **Next.js App Router Internationalization (i18n):** https://nextjs.org/docs/app/building-your-application/routing/internationalization
* **Next.js Dynamic Routes (`[slug]`):** https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes

---

## 0. Segui prima i passaggi nella folder "Realizzare un menu di navigazione e mostrarlo sul sito NextJS"

## 1. Configurazione DatoCMS

### Creazione Schema e Attivazione Multilingua
1. **Configurazione Lingue Progetto:**
   * **Configuration** → **Locales & Timezone** → Aggiungere `Italian (it)` come lingua principale e `English (en)` come lingua secondaria.
2. **Creazione Modello `Menu Item`:**
   * **Schema** → **Create new model** → Nome: `Menu Item` (ID: `menu_item`).
   * **Presentation** → **Ordering / Sort order** → Impostare **Manual (drag and drop)**.
3. **Campi e Localizzazione:**
   * Campo **Label** (Single-line string, Field ID: `label`): Attivare **Enable localization on this field?**.
   * Campo **URL** (Single-line string, Field ID: `url`): Attivare **Enable localization on this field?**.

### Inserimento Traduzioni (Content)
* **Record 1 (Home):**
  * `IT`: Label = `Home` | URL = `/it`
  * `EN`: Label = `Home` | URL = `/en`
* **Record 2 (Chi siamo / About us):**
  * `IT`: Label = `Chi siamo` | URL = `/it/chi-siamo`
  * `EN`: Label = `About us` | URL = `/en/about-us`

---

## 2. Gestione lingua pagina nel progetto NextJS

### Modifica (`src/app/layout.js`)

1. **Aggiunta del nuovo importer cache per evitare riusi delle chiamate**

```javascript

import { cache } from 'react';

```

2. **Nella query, inseriamo i parametri $locale: **

```javascript

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!) {
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

**$iteLocale! ->  Vede tutti i valori attivati nel tuo pannello (es. "it" e "en")**
**$locale -> memorizza il valore inviato dal tuo codice (es. "it" o "en").**

3. **Creiamo una nuova function di incapsulamento, che avrà con se tutti i data dei layout:**

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

```

4. **Aggiustiamo generateMetadata e RootLayout richiamando al loro interno getLayoutData, aggiunendo inoltre che entrambi necessitano della chiamata dei parametri { params }**:

```javascript

export async function generateMetadata({ params }) {

  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
  
}

```

```javascript

export default async function RootLayout({ children, params }) {

  const { lang } = await params;            //questa ci servirà nell'html per recuperare la lang stabilita
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    //content html
  )
  
}

```

5. **Dentro al return aggiungo l'html, passando nel tag html il lang={lang} :**

```javascript

return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <nav className="flex gap-4">
            {menuItems.map((item) => (
              <Link className="hover:underline" href={item.url} key={item.id}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex gap-2 text-sm font-semibold">
            <Link href="/it" className={`px-2 py-1 rounded ${lang === "it" ? "bg-white text-black" : "text-gray-400"}`}>
              IT
            </Link>
            <Link href="/en" className={`px-2 py-1 rounded ${lang === "en" ? "bg-white text-black" : "text-gray-400"}`}>
              EN
            </Link>
          </div>
        </header>

        {children}
      </body>
    </html>
  );

```