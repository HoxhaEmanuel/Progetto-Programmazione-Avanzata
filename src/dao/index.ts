/**
 * Esportazioni centralizzate per tutti i DAO
 * Facilita l'importazione dei DAO nei controller
 */

export { UtenteDao, default as utenteDao } from './UtenteDao';
export { ModelloDao, default as modelloDao } from './ModelloDao';
export { RichiestaAggiornamentoDao, default as richiestaAggiornamentoDao } from './RichiestaAggiornamentoDao';
export { CellaAggiornamentoDao, default as cellaAggiornamentoDao } from './CellaAggiornamentoDao';

// Importa le istanze per l'oggetto daos
import utenteDao from './UtenteDao';
import modelloDao from './ModelloDao';
import richiestaAggiornamentoDao from './RichiestaAggiornamentoDao';
import cellaAggiornamentoDao from './CellaAggiornamentoDao';

// Esportazione di tutte le istanze DAO per facilità d'uso
export const daos = {
  utente: utenteDao,
  modello: modelloDao,
  richiestaAggiornamento: richiestaAggiornamentoDao,
  cellaAggiornamento: cellaAggiornamentoDao
};

export default daos;