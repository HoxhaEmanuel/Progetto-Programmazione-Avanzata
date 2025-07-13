import { Transaction, Op, Optional, WhereOptions } from 'sequelize';
import { RichiestaAggiornamento, Modello, Utente, CellaAggiornamento } from '../models';
import { RichiestaAggiornamentoAttributes, UpdateFilters } from '../models/RichiestaAggiornamento';

/**
 * Data Access Object per la gestione delle richieste di aggiornamento
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class RichiestaAggiornamentoDao {
  
  /**
   * Trova una richiesta per ID
   */
  async findById(id: number, transaction?: Transaction): Promise<RichiestaAggiornamento | null> {
    return await RichiestaAggiornamento.findByPk(id, { transaction });
  }

  /**
   * Trova una richiesta per ID con relazioni incluse
   */
  async findByIdWithRelations(id: number, transaction?: Transaction): Promise<RichiestaAggiornamento | null> {
    return await RichiestaAggiornamento.findByPk(id, {
      include: [
        {
          model: Modello,
          as: 'modello'
        },
        {
          model: CellaAggiornamento,
          as: 'celle'
        }
      ],
      transaction
    });
  }

  /**
   * Crea una nuova richiesta di aggiornamento
   */
  async create(requestData: Optional<RichiestaAggiornamentoAttributes, 'id'>, transaction?: Transaction): Promise<RichiestaAggiornamento> {
    return await RichiestaAggiornamento.create(requestData, { transaction });
  }

  /**
   * Aggiorna una richiesta
   */
  async update(requestId: number, updateData: Partial<RichiestaAggiornamentoAttributes>, transaction?: Transaction): Promise<[number]> {
    return await RichiestaAggiornamento.update(
      updateData,
      { 
        where: { id: requestId },
        transaction 
      }
    );
  }

  /**
   * Aggiorna lo stato di una richiesta
   */
  async updateStatus(requestId: number, newStatus: 'pending' | 'approved' | 'rejected', transaction?: Transaction): Promise<[number]> {
    return await this.update(requestId, { stato: newStatus }, transaction);
  }



  /**
   * Conta le richieste pending per un modello
   */
  async countPendingByModelId(modelId: number): Promise<number> {
    return await RichiestaAggiornamento.count({
      where: {
        modello_id: modelId,
        stato: 'pending'
      }
    });
  }



  /**
   * Conta le richieste per stato
   */
  async countByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<number> {
    return await RichiestaAggiornamento.count({ where: { stato: status } });
  }

  /**
   * Conta tutte le richieste
   */
  async count(): Promise<number> {
    return await RichiestaAggiornamento.count();
  }



  /**
   * Verifica se una richiesta è in stato pending
   */
  async isPending(requestId: number, transaction?: Transaction): Promise<boolean> {
    const request = await this.findById(requestId, transaction);
    return request ? request.stato === 'pending' : false;
  }

  /**
   * Trova multiple richieste per ID con relazioni incluse (ottimizzazione bulk)
   */
  async findMultipleByIdsWithRelations(ids: number[], transaction?: Transaction): Promise<RichiestaAggiornamento[]> {
    if (ids.length === 0) return [];
    
    return await RichiestaAggiornamento.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      include: [
        {
          model: Modello,
          as: 'modello'
        },
        {
          model: CellaAggiornamento,
          as: 'celle'
        }
      ],
      transaction
    });
  }

  /**
   * Trova tutte le richieste pending per i modelli di un utente con paginazione
   */
  async findPendingByCreatorIdPaginated(
    creatorId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ rows: RichiestaAggiornamento[]; count: number }> {
    return await RichiestaAggiornamento.findAndCountAll({
      where: {
        stato: 'pending'
      },
      include: [
        {
          model: Modello,
          as: 'modello',
          where: { creatore_id: creatorId },
          attributes: ['id', 'nome']
        },
        {
          model: Utente,
          as: 'richiedente',
          attributes: ['id', 'email']
        },
        {
          model: CellaAggiornamento,
          as: 'celle',
          attributes: ['x', 'y', 'nuovo_valore']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Trova tutte le richieste per un modello con filtri opzionali e paginazione
   */
  async findByModelIdWithFiltersPaginated(
    modelId: number,
    filters: UpdateFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ rows: RichiestaAggiornamento[]; count: number }> {
    const whereClause: WhereOptions<RichiestaAggiornamentoAttributes> = { modello_id: modelId };
    
    if (filters.stato) {
      whereClause.stato = filters.stato;
    }

    if (filters.dataInizio || filters.dataFine) {
      const dateFilter: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
      if (filters.dataInizio) {
        dateFilter[Op.gte] = filters.dataInizio;
      }
      if (filters.dataFine) {
        dateFilter[Op.lte] = filters.dataFine;
      }
      (whereClause as WhereOptions<RichiestaAggiornamentoAttributes> & { createdAt?: { [Op.gte]?: Date; [Op.lte]?: Date } }).createdAt = dateFilter;
    }

    return await RichiestaAggiornamento.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Utente,
          as: 'richiedente',
          attributes: ['id', 'email']
        },
        {
          model: CellaAggiornamento,
          as: 'celle',
          attributes: ['x', 'y', 'nuovo_valore']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Ottiene le statistiche delle richieste (ottimizzato con singola query)
   */
  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const results = await RichiestaAggiornamento.findAll({
      attributes: [
        'stato',
        [RichiestaAggiornamento.sequelize!.fn('COUNT', '*'), 'count']
      ],
      group: ['stato'],
      raw: true
    }) as unknown as Array<{ stato: string; count: string }>;

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    results.forEach(result => {
      const count = parseInt(result.count);
      stats[result.stato as keyof typeof stats] = count;
      stats.total += count;
    });

    return stats;
  }

  /**
   * Aggiorna lo stato di multiple richieste (bulk operation)
   */
  async bulkUpdateStatus(
    updates: Array<{ requestId: number; status: 'approved' | 'rejected' }>,
    transaction?: Transaction
  ): Promise<void> {
    if (updates.length === 0) return;
    
    // Raggruppa per stato per ottimizzare le query
    const groupedUpdates = updates.reduce((acc, update) => {
      if (!acc[update.status]) {
        acc[update.status] = [];
      }
      acc[update.status].push(update.requestId);
      return acc;
    }, {} as Record<string, number[]>);

    // Esegui aggiornamenti bulk per ogni stato
    const updatePromises = Object.entries(groupedUpdates).map(([status, requestIds]) => 
      RichiestaAggiornamento.update(
        { stato: status as 'approved' | 'rejected' },
        {
          where: {
            id: {
              [Op.in]: requestIds
            }
          },
          transaction
        }
      )
    );

    await Promise.all(updatePromises);
  }
}

export default new RichiestaAggiornamentoDao();