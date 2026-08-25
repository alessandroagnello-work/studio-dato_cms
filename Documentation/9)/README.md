# Guida Tecnica (Modulo 9): Form Contatti Dinamico, Archiviazione DatoCMS (CMA) e Routing Email

## Introduzione

### Architettura per la Gestione Form in Architettura Headless
DatoCMS gestisce di default il recupero dati in sola lettura tramite la Content Delivery API (CDA). Per permettere agli utenti di **inviare dati** (come i messaggi di un form contatti), non è sicuro usare il token di gestione direttamente dal browser del client.

L'architettura corretta prevede:
1. **Client Form Component (React)**: Raccoglie i dati, gestisce gli stati di caricamento/errore e valida i campi lato client.
2. **Next.js Server Action (Backend)**: Riceve i dati in modo sicuro sul server, valida l'input, determina il destinatario corretto in base all'argomento, salva il contatto su DatoCMS tramite la **Content Management API (CMA)** e invia le email tramite un provider transazionale.

---

## Riferimenti Ufficiali

* **DatoCMS Content Management API (CMA):** [https://www.datocms.com/docs/content-management-api](https://www.datocms.com/docs/content-management-api)
* **DatoCMS JS/TS CMA Client:** [https://github.com/datocms/cda-client](https://github.com/datocms/cda-client)
* **Next.js Server Actions & Mutations:** [https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
* **Resend Email Documentation:** [https://resend.com/docs/introduction](https://resend.com/docs/introduction)

---

## 1. Configurazione Schema DatoCMS (Modello `Contact Submission`)

### Perché creare un modello "Collection" per i contatti?
Creare un modello dedicato su DatoCMS chiamato `contact_submission` permette di trasformare il CMS in un piccolo CRM integrato. Ogni invio del form genererà un nuovo record immodificabile dagli utenti finali, consentendo al team commerciale/editoriale di consultare, filtrare ed esportare tutti i messaggi ricevuti direttamente dalla Dashboard di DatoCMS, senza dover accedere a database esterni.

### 1.1 Creazione del Modello
1. Nella Dashboard di DatoCMS, accedere a **Schema** → **Create new model**.
2. **Model Name**: `Contact Submission` (Model ID generato: `contact_submission`).
3. **Tipo**: Attivare levetta Single instance? (per la multi instanza).

### 1.2 Campi dello Schema

Tutti i campi elencati di seguito si creano partendo dall'icona **Text** (gialla, in alto a sinistra nella schermata *Choose a field type*). Trattandosi di dati grezzi inviati dal form utente, **lasciare disattivato** il toggle *Enable localization on this field?* su tutti i campi.

* **First Name** (`first_name`):
  * Cliccare su **Text** → Selezionare **Single-line string**.
  * Field label: `First Name` (Field ID generato: `first_name`).
  * Scheda *Validations*: Spuntare **Required** (Obbligatorio).
* **Last Name** (`last_name`):
  * Cliccare su **Text** → Selezionare **Single-line string**.
  * Field label: `Last Name` (Field ID generato: `last_name`).
  * Scheda *Validations*: Spuntare **Required** (Obbligatorio).
* **Email** (`email`):
  * Cliccare su **Text** → Selezionare **Single-line string**.
  * Field label: `Email` (Field ID generato: `email`).
  * Scheda *Validations*: Spuntare **Required** (Obbligatorio).
* **Phone** (`phone`):
  * Cliccare su **Text** → Selezionare **Single-line string**.
  * Field label: `Phone` (Field ID generato: `phone`).
  * Scheda *Validations*: **Lasciare deselezionato** Required (Opzionale).
* **Topic** (`topic`):
  * Cliccare su **Text** → Selezionare **Single-line string**.
  * Field label: `Topic` (Field ID generato: `topic`).
  * Scheda *Validations*: Spuntare **Required** (Obbligatorio).
* **Message** (`message`):
  * Cliccare su **Text** → Selezionare **Multiple-paragraph text**.
  * Field label: `Message` (Field ID generato: `message`).
  * Scheda *Validations*: Spuntare **Required** (Obbligatorio).

---

## 2. Setup Dipendenze, Architettura e Token di Scrittura

### Perché serve `@datocms/cma-client-node` invece del normale CDA?
* **Content Delivery API (CDA)**: La libreria `@datocms/cda-client` utilizzata finora serve esclusivamente per la **lettura (Read-Only)** dei contenuti pubblicati via GraphQL.
* **Content Management API (CMA)**: La libreria `@datocms/cma-client-node` è l'SDK amministrativo che consente operazioni di **scrittura (Create, Update, Delete)** sullo Schema e sui Record di DatoCMS via REST API.

### Perché usiamo Resend per l'invio Email?
Resend è un servizio di *transactional email* moderno per sviluppatori. Lo utilizziamo perché si integra nativamente con le Server Actions di Next.js, gestisce la consegna sicura tramite domini verificati e impedisce che le email aziendali o le conferme ai clienti finiscano nelle cartelle Spam.

### 2.1 Installazione dei Pacchetti
Eseguire da terminale nella radice del progetto:

```bash
npm install @datocms/cma-client-node resend
```

### 2.2 Generazione del Full-Access API Token su DatoCMS
1. Accedere a DatoCMS → **Project Settings** → **API Tokens**.
2. Cliccare su **New API Token**.
3. Assegnare il nome `Server Actions Token` e concedere permessi completi di lettura e scrittura (**Full access**).
4. Copiare il token generato.

### 2.3 Modifica del file `.env.local`
Aggiungere il token di gestione e la chiave del provider mail.

**Perché due token separati?**
Mantenere separati il token di lettura (`NEXT_DATOCMS_API_TOKEN`) e quello di scrittura (`DATOCMS_FULL_ACCESS_API_TOKEN`) rispetta il principio di sicurezza del *minimo privilegio*. Inoltre, la variabile con il token di scrittura NON ha il prefisso `NEXT_PUBLIC_`, garantendo che non venga mai esposta al browser dell'utente.

**Codice Aggiornato (`.env.local`):**

```env
# Token Read-Only per le query CDA (esistente)
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Token Full-Access per la scrittura CMA via Server Actions (Solamente Server-Side)
DATOCMS_FULL_ACCESS_API_TOKEN=tuo_full_access_api_token_qui

# Key per l'invio di email transazionali via Resend
RESEND_API_KEY=tuo_resend_api_key_qui
```

---

## 3. Implementazione del Codice Sorgente

### 3.1 Creazione della Server Action: `src/app/actions/contact.js`
Creare il file per la gestione server-side della validazione, del salvataggio su DatoCMS e dell'invio delle email.

**Perché usiamo una Server Action (`'use server'`)?**
* **Sicurezza**: Tutta la logica viene eseguita esclusivamente sul server backend. Le chiavi API segrete e la logica di instradamento delle mail di destinazione rimangono invisibili all'utente.
* **Prevenzione Vulnerabilità (Open Relay)**: Invece di far passare l'email di destinazione dal client (che potrebbe essere manipolata da un malintenzionato), l'utente invia solo l'argomento (`topic`). È la mappa `RECIPIENT_MAP` hardcodata sul server a determinare in modo sicuro a chi inviare il messaggio.

**Codice Sorgente Completo (`src/app/actions/contact.js`):**

```javascript
'use server';

import { buildClient } from '@datocms/cma-client-node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Mappa di routing sicura: associa ciascun argomento all'email del reparto aziendale
const RECIPIENT_MAP = {
  commerciale: 'sales@company.com',
  preventivo: 'sales@company.com', // Stesso destinatario per più argomenti
  supporto: 'support@company.com',
  tecnico: 'support@company.com',
  altro: 'info@company.com',
};

export async function submitContactForm(prevState, formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone') || '';
  const topic = formData.get('topic');
  const message = formData.get('message');

  // 1. Validazione Server-Side obbligatoria
  if (!firstName || !lastName || !email || !topic || !message) {
    return { success: false, error: 'Compilare tutti i campi obbligatori.' };
  }

  try {
    // 2. Archiviazione del messaggio su DatoCMS via CMA Client (Iniezione Token di Scrittura)
    const client = buildClient({ apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN });
    
    await client.items.create({
      item_type: { type: 'item_type', id: 'contact_submission' },
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      topic: topic,
      message: message,
    });

    // 3. Routing dinamico del destinatario in base all'argomento selezionato
    const targetRecipient = RECIPIENT_MAP[topic] || 'info@company.com';

    // 4. Invio email HTML formattata al reparto aziendale di competenza
    await resend.emails.send({
      from: 'Website Form <noreply@company.com>',
      to: targetRecipient,
      subject: `[Nuovo Contatto - ${topic.toUpperCase()}] da ${firstName}${lastName}`,
      html: `
        <h2>Nuovo messaggio dal sito web</h2>
        <p><strong>Nome:</strong> ${firstName}${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone || 'Non specificato'}</p>
        <p><strong>Argomento:</strong> ${topic}</p>
        <hr />
        <h3>Messaggio:</h3>
        <p style="white-space: pre-line;">${message}</p>
      `,
    });

    // 5. Invio email automatica di notifica/ricevuta al mittente
    await resend.emails.send({
      from: 'Company Support <noreply@company.com>',
      to: email,
      subject: `Abbiamo ricevuto il tuo messaggio (${firstName})`,
      html: `
        <h3>Ciao ${firstName},</h3>
        <p>Grazie per averci contattato. Abbiamo preso in carico la tua richiesta relativa a <strong>${topic}</strong>.</p>
        <p>Un nostro operatore ti risponderà al più presto.</p>
        <hr />
        <p><small>Questo è un messaggio automatico, si prega di non rispondere a questa mail.</small></p>
      `,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Errore durante il processamento del form:', error);
    return { 
      success: false, 
      error: 'Si è verificato un errore durante l\'invio. Riprova più tardi.' 
    };
  }
}
```

---

### 3.2 Creazione del Componente UI Client: `src/app/widgets/Contact/ContactForm.jsx`
Creare la cartella `src/app/widgets/Contact/` e il file `ContactForm.jsx` per l'interfaccia utente interattiva.

**Perché usiamo `useActionState` e `'use client'`?**
* **`'use client'`**: I form con stato interattivo richiedono la gestione di eventi nel browser.
* **`useActionState`**: È l'hook nativo di React per collegare una Server Action a un form. Gestisce automaticamente lo stato restituito dalla funzione (`state.success`, `state.error`) e fornisce la variabile boolean `isPending`.
* **UX & Anti-Spam (`disabled={isPending}`)**: Durante l'esecuzione della chiamata asincrona, il pulsante di invio viene disabilitato per evitare che l'utente clicchi più volte inviando messaggi duplicati.

**Codice Sorgente Completo (`src/app/widgets/Contact/ContactForm.jsx`):**

```javascript
'use client';

import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions/contact';

const initialState = {
  success: false,
  error: null,
};

export default function ContactForm({ lang }) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  return (
    <form action={formAction} className="max-w-xl mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
      {state.success && (
        <div className="p-4 bg-green-900/50 border border-green-500 text-green-200 rounded-lg text-sm">
          Messaggio inviato con successo! Abbiamo inviato una mail di conferma al tuo indirizzo.
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            name="firstName"
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Cognome *
          </label>
          <input
            type="text"
            name="lastName"
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Telefono (Opzionale)
          </label>
          <input
            type="tel"
            name="phone"
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Argomento *
        </label>
        <select
          name="topic"
          required
          defaultValue=""
          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="" disabled>Seleziona un argomento...</option>
          <option value="commerciale">Informazioni Commerciali</option>
          <option value="preventivo">Richiesta Preventivo</option>
          <option value="supporto">Supporto Clienti</option>
          <option value="tecnico">Assistenza Tecnica</option>
          <option value="altro">Altro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Messaggio *
        </label>
        <textarea
          name="message"
          rows={5}
          required
          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
      >
        {isPending ? 'Invio in corso...' : 'Invia Messaggio'}
      </button>
    </form>
  );
}
```

---

### 3.3 Creazione della Pagina Contatti: `src/app/[lang]/contatti/page.js`
Creare il file della pagina contatti inserendolo nella struttura di routing localizzato `[lang]`.

**Perché usiamo questa struttura?**
La pagina agisce da **Server Component** contenitore: risolve asincronamente i parametri della lingua (`await params`), fornisce l'intestazione statica indicizzata dai motori di ricerca e monta al suo interno il widget interattivo `ContactForm`.

**Codice Sorgente Completo (`src/app/[lang]/contatti/page.js`):**

```javascript
import ContactForm from '@/app/widgets/Contact/ContactForm';

export default async function ContactPage({ params }) {
  const { lang } = await params;

  return (
    <main className="py-16 px-4 max-w-4xl mx-auto text-gray-100">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">
          Contattaci
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Compila il modulo sottostante per inviarci un messaggio. Il nostro team ti risponderà al più presto.
        </p>
      </div>

      <ContactForm lang="{lang}"/>
    </main>
  );
}
```