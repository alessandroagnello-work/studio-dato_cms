'use strict';
const naviSource = require('../data/navi_source.json');
const { client, withRetry, findRecordByField, fetchModularBlocks, upsertEntity, printSummaryAndExit } = require('./datoClient');

async function runImportShips() {
  console.log(`Inizio sincronizzazione di ${naviSource.length} navi...`);

  const { shipModel, portModel, maintenanceBlock } = await withRetry(async () => {
    const ship = await client.itemTypes.find('ship');
    const port = await client.itemTypes.find('port');
    const block = await client.itemTypes.find('maintenance_entry');
    return { shipModel: ship, portModel: port, maintenanceBlock: block };
  });

  const stats = { created: 0, updated: 0, unchanged: 0, inactive: 0 };
  const errors = [];

  for (const naveData of naviSource) {
    if (!naveData.attivo) {
      console.log(`Skipping: ${naveData.nome} (Inattiva)`);
      stats.inactive++;
      continue;
    }

    try {
      const existingShip = await findRecordByField(shipModel.id, 'nome', naveData.nome);
      const targetPort = await findRecordByField(portModel.id, 'nome', naveData.porto_nome);

      if (!targetPort) throw new Error(`Porto '${naveData.porto_nome}' non trovato.`);

      let registroManutenzioniPayload = [];
      if (Array.isArray(naveData.manutenzioni) && naveData.manutenzioni.length > 0) {
        registroManutenzioniPayload = naveData.manutenzioni.map((m) => ({
          type: 'item',
          attributes: { data_intervento: m.data_intervento, descrizione: m.descrizione },
          relationships: { item_type: { data: { type: 'item_type', id: maintenanceBlock.id } } },
        }));
      }

      let existingManutenzioni = [];
      if (existingShip) {
        existingManutenzioni = await fetchModularBlocks(existingShip.registro_manutenzioni, ['data_intervento', 'descrizione']);
      }

      await upsertEntity({
        recordName: naveData.nome,
        modelId: shipModel.id,
        existingRecord: existingShip,
        payload: {
          nome: naveData.nome, codice_imo: naveData.codice_imo, capienza_passeggeri: naveData.capienza_passeggeri,
          in_servizio: naveData.in_servizio, porto: targetPort.id,
          ...(registroManutenzioniPayload.length > 0 && { registro_manutenzioni: registroManutenzioniPayload }),
        },
        currentNormalizedData: existingShip ? {
          codice_imo: existingShip.codice_imo, capienza_passeggeri: existingShip.capienza_passeggeri,
          in_servizio: existingShip.in_servizio, porto: existingShip.porto, manutenzioni: existingManutenzioni,
        } : null,
        newNormalizedData: {
          codice_imo: naveData.codice_imo, capienza_passeggeri: naveData.capienza_passeggeri,
          in_servizio: naveData.in_servizio, porto: targetPort.id, manutenzioni: naveData.manutenzioni || [],
        },
        stats,
      });
    } catch (error) {
      console.error(`Errore su ${naveData.nome}:`, error.message);
      errors.push({ record: naveData.nome, message: error.message });
    }
  }

  printSummaryAndExit('navi', naviSource.length, stats, errors);
}

runImportShips().catch(console.error);