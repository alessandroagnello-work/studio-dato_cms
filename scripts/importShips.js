'use strict';
require('dotenv').config({ path: '.env.local' });
const { buildClient } = require('@datocms/cma-client-node');
const naviSource = require('../data/navi_source.json');

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

async function runImportShips() {
  console.log(`Inizio sincronizzazione di ${naviSource.length} navi...`);

  const { shipModel, portModel, maintenanceBlock } = await withRetry(async () => {
    const ship = await client.itemTypes.find('ship');
    const port = await client.itemTypes.find('port');
    const block = await client.itemTypes.find('maintenance_entry');
    return { shipModel: ship, portModel: port, maintenanceBlock: block };
  });

  let countCreated = 0;
  let countUpdated = 0;
  let countUnchanged = 0;
  let countInactive = 0;
  const errors = [];

  for (const naveData of naviSource) {
    if (!naveData.attivo) {
      console.log(`Skipping: ${naveData.nome} (Inattiva)`);
      countInactive++;
      continue;
    }

    try {
      const existingShips = await withRetry(() =>
        client.items.list({
          filter: {
            type: shipModel.id,
            fields: { nome: { eq: naveData.nome } },
          },
        })
      );
      const existingShip = existingShips[0];

      const targetPorts = await withRetry(() =>
        client.items.list({
          filter: {
            type: portModel.id,
            fields: { nome: { eq: naveData.porto_nome } },
          },
        })
      );
      const targetPort = targetPorts[0];

      if (!targetPort) {
        throw new Error(`Porto associato '${naveData.porto_nome}' non trovato.`);
      }

      let registroManutenzioniPayload = [];
      if (Array.isArray(naveData.manutenzioni) && naveData.manutenzioni.length > 0) {
        registroManutenzioniPayload = naveData.manutenzioni.map((m) => ({
          type: 'item',
          attributes: {
            data_intervento: m.data_intervento,
            descrizione: m.descrizione,
          },
          relationships: {
            item_type: {
              data: { type: 'item_type', id: maintenanceBlock.id },
            },
          },
        }));
      }

      const shipPayload = {
        nome: naveData.nome,
        codice_imo: naveData.codice_imo,
        capienza_passeggeri: naveData.capienza_passeggeri,
        in_servizio: naveData.in_servizio,
        porto: targetPort.id,
        ...(registroManutenzioniPayload.length > 0 && {
          registro_manutenzioni: registroManutenzioniPayload,
        }),
      };

      if (existingShip) {
        let existingManutenzioni = [];
        const existingBlockIds = existingShip.registro_manutenzioni || [];

        if (existingBlockIds.length > 0) {
          const fetchedBlocks = await Promise.all(
            existingBlockIds.map((blockId) => withRetry(() => client.items.find(blockId)))
          );
          existingManutenzioni = fetchedBlocks.map((b) => ({
            data_intervento: b.data_intervento,
            descrizione: b.descrizione,
          }));
        }

        const hasChanges =
          existingShip.codice_imo !== naveData.codice_imo ||
          existingShip.capienza_passeggeri !== naveData.capienza_passeggeri ||
          existingShip.in_servizio !== naveData.in_servizio ||
          existingShip.porto !== targetPort.id ||
          JSON.stringify(existingManutenzioni) !== JSON.stringify(naveData.manutenzioni || []);

        if (hasChanges) {
          console.log(`Trovate modifiche per: ${naveData.nome}. Aggiornamento in corso...`);
          await withRetry(() => client.items.update(existingShip.id, shipPayload));
          await withRetry(() => client.items.publish(existingShip.id));
          console.log(`Aggiornato con successo: ${naveData.nome}`);
          countUpdated++;
        } else {
          console.log(`Dati identici per: ${naveData.nome}. Nessuna operazione eseguita.`);
          countUnchanged++;
        }
      } else {
        const ship = await withRetry(() =>
          client.items.create({
            item_type: { type: 'item_type', id: shipModel.id },
            ...shipPayload,
          })
        );
        await withRetry(() => client.items.publish(ship.id));
        console.log(`Importato e pubblicato ex-novo: ${naveData.nome}`);
        countCreated++;
      }
    } catch (error) {
      console.error(`Errore durante l'elaborazione di ${naveData.nome}:`, error.message);
      errors.push({ record: naveData.nome, message: error.message });
    }
  }

  console.log('\nRiepilogo importazione navi:');
  console.log(`- Create ex-novo: ${countCreated}`);
  console.log(`- Aggiornate: ${countUpdated}`);
  console.log(`- Identiche (Inalterate): ${countUnchanged}`);
  console.log(`- Ignorate (Inattive): ${countInactive}`);
  console.log(`- Fallite: ${errors.length}`);

  if (errors.length > 0) {
    console.error('\nSincronizzazione completata con errori.');
    process.exit(1);
  } else if (countUnchanged === naviSource.length - countInactive) {
    console.log('\nTutti i record erano già perfettamente sincronizzati. Nessuna modifica apportata a DatoCMS.');
    process.exit(0);
  } else {
    console.log('\nSincronizzazione navi completata con successo.');
    process.exit(0);
  }
}

runImportShips().catch(console.error);