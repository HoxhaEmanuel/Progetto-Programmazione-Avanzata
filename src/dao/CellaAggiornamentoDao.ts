import { Transaction, Op, Optional } from 'sequelize';
import { CellaAggiornamento } from '../models';
import { CellaAggiornamentoAttributes } from '../models/CellaAggiornamento';

/**
 * Data Access Object per la gestione delle celle di aggiornamento
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class CellaAggiornamentoDao {
  
  /**
   * Trova una cella per ID
   */
  async findById(id: number, transaction?: Transaction): Promise<CellaAggiornamento | null> {
    return await CellaAggiornamento.findByPk(id, { transaction });
  }

  /**
   * Crea una nuova cella di aggiornamento
   */
  async create(cellData: Optional<CellaAggiornamentoAttributes, 'id'>, transaction?: Transaction): Promise<CellaAggiornamento> {
    return await CellaAggiornamento.create(cellData, { transaction });
  }

  /**
   * Crea multiple celle di aggiornamento in bulk
   */
  async bulkCreate(cellsData: Optional<CellaAggiornamentoAttributes, 'id'>[], transaction?: Transaction): Promise<CellaAggiornamento[]> {
    return await CellaAggiornamento.bulkCreate(cellsData, { transaction });
  }

  /**
   * Trova tutte le celle per una richiesta di aggiornamento
   */
  async findByRequestId(requestId: number, transaction?: Transaction): Promise<CellaAggiornamento[]> {
    return await CellaAggiornamento.findAll({
      where: { richiesta_id: requestId },
      transaction
    });
  }

  /**
   * Aggiorna una cella
   */
  async update(cellId: number, updateData: Partial<CellaAggiornamentoAttributes>, transaction?: Transaction): Promise<[number]> {
    return await CellaAggiornamento.update(
      updateData,
      { 
        where: { id: cellId },
        transaction 
      }
    );
  }





  /**
   * Conta le celle per una richiesta
   */
  async countByRequestId(requestId: number, transaction?: Transaction): Promise<number> {
    return await CellaAggiornamento.count({
      where: { richiesta_id: requestId },
      transaction
    });
  }

  /**
   * Verifica se una cella esiste per coordinate specifiche in una richiesta
   */
  async existsByCoordinatesAndRequest(requestId: number, x: number, y: number, transaction?: Transaction): Promise<boolean> {
    const count = await CellaAggiornamento.count({
      where: {
        richiesta_id: requestId,
        x,
        y
      },
      transaction
    });
    return count > 0;
  }

  /**
   * Trova una cella per coordinate specifiche in una richiesta
   */
  async findByCoordinatesAndRequest(requestId: number, x: number, y: number, transaction?: Transaction): Promise<CellaAggiornamento | null> {
    return await CellaAggiornamento.findOne({
      where: {
        richiesta_id: requestId,
        x,
        y
      },
      transaction
    });
  }

  /**
   * Ottiene tutte le coordinate uniche per una richiesta
   */
  async getUniqueCoordinatesByRequest(requestId: number, transaction?: Transaction): Promise<Array<{x: number, y: number}>> {
    const cells = await this.findByRequestId(requestId, transaction);
    const uniqueCoords = new Map<string, {x: number, y: number}>();
    
    cells.forEach(cell => {
      const key = `${cell.x},${cell.y}`;
      if (!uniqueCoords.has(key)) {
        uniqueCoords.set(key, { x: cell.x, y: cell.y });
      }
    });
    
    return Array.from(uniqueCoords.values());
  }



  /**
   * Aggiorna multiple celle (bulk operation)
   */
  async bulkUpdate(
    updates: Array<{ id: number; updateData: Partial<CellaAggiornamentoAttributes> }>,
    transaction?: Transaction
  ): Promise<void> {
    if (updates.length === 0) return;
    
    // Esegui aggiornamenti in parallelo
    await Promise.all(
      updates.map(({ id, updateData }) => 
        this.update(id, updateData, transaction)
      )
    );
  }

  /**
   * Trova celle per multiple richieste (bulk operation)
   */
  async findByMultipleRequestIds(requestIds: number[], transaction?: Transaction): Promise<CellaAggiornamento[]> {
    if (requestIds.length === 0) return [];
    
    return await CellaAggiornamento.findAll({
      where: {
        richiesta_id: {
          [Op.in]: requestIds
        }
      },
      transaction
    });
  }
}

export default new CellaAggiornamentoDao();