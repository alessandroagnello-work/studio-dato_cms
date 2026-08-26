'use server';

import { buildClient } from '@datocms/cma-client-node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Mappa di routing: per i test punta all'email registrata su Resend
const RECIPIENT_MAP = {
  commerciale: 'alessandro.agnello@infocube.it',
  preventivo: 'alessandro.agnello@infocube.it',
  supporto: 'alessandro.agnello@infocube.it',
  altro: 'alessandro.agnello@infocube.it',
};

export async function submitContactForm(prevState, formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone') || '';
  const topic = formData.get('topic');
  const message = formData.get('message');

  if (!firstName || !lastName || !email || !topic || !message) {
    return { success: false, error: true };
  }

  try {
    // 1. Archiviazione su DatoCMS (via CMA Client)
    const client = buildClient({ 
      apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
      environment: process.env.NEXT_DATOCMS_ENVIRONMENT || 'main'
    });
    
    await client.items.create({
      item_type: { type: 'item_type', id: 'GlQTmNF0QRSOMRiR4TUd6w' },
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      topic: topic,
      message: message,
    });

    // 2. Instradamento Dinamico Email
    const targetRecipient = RECIPIENT_MAP[topic] || 'alessandro.agnello@infocube.it';

    // 3. Invio email formattata all'azienda (Usa onboarding@resend.dev per i test)
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
      subject: `[Nuovo Contatto - ${topic.toUpperCase()}] da ${firstName} ${lastName}`,
      html: `
        <h2>Nuovo messaggio dal sito web</h2>
        <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone || 'Non specificato'}</p>
        <p><strong>Argomento:</strong> ${topic}</p>
        <hr />
        <h3>Messaggio:</h3>
        <p style="white-space: pre-line;">${message}</p>
      `,
    });

    // 4. Invio email automatica di conferma (Per i test invia all'email di test accreditata)
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
      subject: `Conferma ricezione messaggio`,
      html: `
        <h3>Ciao ${firstName},</h3>
        <p>Grazie per averci contattato. Abbiamo preso in carico il tuo messaggio relativo a <strong>${topic}</strong>.</p>
        <p>Un nostro operatore ti risponderà al più presto.</p>
      `,
    });

    return { success: true, error: false };
  } catch (error) {
    console.error('Errore durante il processamento del form:', error);
    return { success: false, error: true };
  }
}