'use strict';
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { buildClient } = require('@datocms/cma-client-node');

const client = buildClient({
  apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
  environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
});

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

async function findRecordByField(modelId, fieldName, fieldValue) {
  const records = await withRetry(() =>
    client.items.list({ filter: { type: modelId, fields: { [fieldName]: { eq: fieldValue } } } })
  );
  return records[0] || null;
}

async function uploadMedia(fotoSource) {
  if (!fotoSource) return null;
  const isRemoteUrl = fotoSource.startsWith('http://') || fotoSource.startsWith('https://');
  let upload = isRemoteUrl
    ? await withRetry(() => client.uploads.createFromUrl({ url: fotoSource, skipCreationIfAlreadyExists: true }))
    : await withRetry(() => client.uploads.createFromLocalFile({ localPath: path.resolve(__dirname, '..', fotoSource), skipCreationIfAlreadyExists: true }));
  return { upload_id: upload.id };
}

async function fetchModularBlocks(blockIds, keys = []) {
  if (!Array.isArray(blockIds) || blockIds.length === 0) return [];
  const fetched = await Promise.all(blockIds.map((id) => withRetry(() => client.items.find(id))));
  return fetched.map((block) => keys.reduce((obj, key) => ({ ...obj, [key]: block[key] }), {}));
}

function hasRecordChanged(existingData, newData) {
  return JSON.stringify(existingData) !== JSON.stringify(newData);
}

async function upsertEntity({ recordName, modelId, existingRecord, payload, currentNormalizedData, newNormalizedData, stats }) {
  if (existingRecord) {
    if (hasRecordChanged(currentNormalizedData, newNormalizedData)) {
      console.log(`Trovate modifiche per: ${recordName}. Aggiornamento in corso...`);
      await withRetry(() => client.items.update(existingRecord.id, payload));
      await withRetry(() => client.items.publish(existingRecord.id));
      console.log(`Aggiornato con successo: ${recordName}`);
      stats.updated++;
    } else {
      console.log(`Dati identici per: ${recordName}. Nessuna operazione eseguita.`);
      stats.unchanged++;
    }
  } else {
    const newRecord = await withRetry(() => client.items.create({ item_type: { type: 'item_type', id: modelId }, ...payload }));
    await withRetry(() => client.items.publish(newRecord.id));
    console.log(`Importato e pubblicato ex-novo: ${recordName}`);
    stats.created++;
  }
}

function printSummaryAndExit(entityName, totalSourceCount, stats, errors) {
  console.log(`\nRiepilogo importazione ${entityName}:`);
  console.log(`- Creati: ${stats.created} | Aggiornati: ${stats.updated} | Inalterati: ${stats.unchanged} | Inattivi: ${stats.inactive} | Falliti: ${errors.length}`);

  if (errors.length > 0) {
    console.error(`\nSincronizzazione ${entityName} completata con errori.`);
    process.exit(1);
  } else if (stats.unchanged === totalSourceCount - stats.inactive) {
    console.log(`\nTutti i record erano già perfettamente sincronizzati.`);
    process.exit(0);
  } else {
    console.log(`\nSincronizzazione ${entityName} completata con successo.`);
    process.exit(0);
  }
}

// Esportiamo tutte le utility in un colpo solo
module.exports = { 
  client, 
  withRetry, 
  findRecordByField, 
  uploadMedia, 
  fetchModularBlocks, 
  upsertEntity, 
  printSummaryAndExit 
};