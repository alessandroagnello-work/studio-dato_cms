'use strict';
const portiSource = require('../data/porti_source.json');
const { client, withRetry, findRecordByField, uploadMedia, upsertEntity, printSummaryAndExit } = require('./datoClient');

async function runImportPorts() {
  console.log(`Inizio sincronizzazione di ${portiSource.length} porti...`);
  const portModel = await withRetry(() => client.itemTypes.find('port'));

  const stats = { created: 0, updated: 0, unchanged: 0, inactive: 0 };
  const errors = [];

  for (const portoData of portiSource) {
    const recordName = portoData.nome || 'Record senza nome';

    if (!portoData.attivo) {
      console.log(`Skipping: ${recordName} (Inattivo)`);
      stats.inactive++;
      continue;
    }

    try {
      const existingPort = await findRecordByField(portModel.id, 'nome', portoData.nome);
      const fotoSource = portoData.foto_src || portoData.foto_url;
      
      if (fotoSource) console.log(`Caricamento media per ${recordName}...`);
      const fotoCopertinaPayload = await uploadMedia(fotoSource);

      await upsertEntity({
        recordName,
        modelId: portModel.id,
        existingRecord: existingPort,
        payload: { nome: portoData.nome, citta: portoData.citta, ...(fotoCopertinaPayload && { foto_copertina: fotoCopertinaPayload }) },
        currentNormalizedData: existingPort ? { citta: existingPort.citta } : null,
        newNormalizedData: { citta: portoData.citta },
        stats,
      });
    } catch (error) {
      console.error(`Errore su ${recordName}:`, error.message);
      errors.push({ record: recordName, message: error.message });
    }
  }

  printSummaryAndExit('porti', portiSource.length, stats, errors);
}

runImportPorts().catch(console.error);