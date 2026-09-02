'use strict';
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { buildClient } = require('@datocms/cma-client-node');
const portiSource = require('../data/porti_source.json');

const client = buildClient({
  apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
  environment: 'task-modulo-10',
});

// Helper per tollerare ed evitare errori di timeout di rete (ETIMEDOUT)
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Timeout di rete. Ritento la connessione (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function runImportPorts() {
  console.log(`Inizio sincronizzazione di ${portiSource.length} porti...`);

  const portModel = await withRetry(() => client.itemTypes.find('port'));

  let countCreated = 0;
  let countUpdated = 0;
  let countUnchanged = 0;
  let countInactive = 0;
  const errors = [];

  for (const portoData of portiSource) {
    if (!portoData.attivo) {
      console.log(`Skipping: ${portoData.nome} (Inattivo)`);
      countInactive++;
      continue; 
    }

    try {
      const existingPorts = await withRetry(() =>
        client.items.list({
          filter: {
            type: portModel.id,
            fields: { nome: { eq: portoData.nome } },
          },
        })
      );
      const existingPort = existingPorts[0];

      let fotoCopertinaPayload = null;
      if (portoData.foto_src) {
        console.log(`Caricamento media per ${portoData.nome}...`);
        const isRemoteUrl = portoData.foto_src.startsWith('http://') || portoData.foto_src.startsWith('https://');

        let upload;
        if (isRemoteUrl) {
          upload = await withRetry(() =>
            client.uploads.createFromUrl({
              url: portoData.foto_src,
              skipCreationIfAlreadyExists: true,
            })
          );
        } else {
          const localFilePath = path.resolve(__dirname, '..', portoData.foto_src);
          upload = await withRetry(() =>
            client.uploads.createFromLocalFile({
              localPath: localFilePath,
              skipCreationIfAlreadyExists: true,
            })
          );
        }
        fotoCopertinaPayload = { upload_id: upload.id };
      }

      if (existingPort) {
        const hasChanges = existingPort.citta !== portoData.citta;

        if (hasChanges) {
          console.log(`Trovate modifiche per: ${portoData.nome}. Aggiornamento in corso...`);
          await withRetry(() =>
            client.items.update(existingPort.id, {
              citta: portoData.citta,
              ...(fotoCopertinaPayload && { foto_copertina: fotoCopertinaPayload }),
            })
          );
          await withRetry(() => client.items.publish(existingPort.id));
          console.log(`Aggiornato con successo: ${portoData.nome}`);
          countUpdated++;
        } else {
          console.log(`Dati identici per: ${portoData.nome}. Nessuna operazione eseguita.`);
          countUnchanged++;
        }
      } else {
        const porto = await withRetry(() =>
          client.items.create({
            item_type: { type: 'item_type', id: portModel.id },
            nome: portoData.nome, 
            citta: portoData.citta,
            foto_copertina: fotoCopertinaPayload,
          })
        );
        await withRetry(() => client.items.publish(porto.id));
        console.log(`Importato e pubblicato ex-novo: ${portoData.nome}`);
        countCreated++;
      }

    } catch (error) {
      console.error(`Errore durante l'elaborazione di ${portoData.nome}:`, error.message);
      errors.push({ record: portoData.nome, message: error.message });
    }
  }

  console.log('\nRiepilogo importazione porti:');
  console.log(`- Creati ex-novo: ${countCreated}`);
  console.log(`- Aggiornati: ${countUpdated}`);
  console.log(`- Identici (Inalterati): ${countUnchanged}`);
  console.log(`- Ignorati (Inattivi): ${countInactive}`);
  console.log(`- Falliti: ${errors.length}`);

  if (errors.length > 0) {
    console.error('\nSincronizzazione completata con errori.');
    process.exit(1);
  } else if (countUnchanged === portiSource.length - countInactive) {
    console.log('\nTutti i record erano già perfettamente sincronizzati. Nessuna modifica apportata a DatoCMS.');
    process.exit(0);
  } else {
    console.log('\nSincronizzazione porti completata con successo.');
    process.exit(0);
  }
}

runImportPorts().catch(console.error);