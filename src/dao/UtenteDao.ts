import { Transaction, Op, Optional } from 'sequelize';
import { Utente } from '../models';
import { UtenteAttributes } from '../models/Utente';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

/**
 * Interfaccia per il risultato grezzo della query SUM
 */
interface TotalTokensResult {
  total_tokens: string | number | null;
}


/**
 * Data Access Object per la gestione degli utenti
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class UtenteDao {
  
  /**
   * Trova un utente per ID
   */
  async findById(id: number, transaction?: Transaction): Promise<Utente | null> {
    return await Utente.findByPk(id, { transaction });
  }

  /**
   * Trova un utente per email
   */
  async findByEmail(email: string, transaction?: Transaction): Promise<Utente | null> {
    return await Utente.findOne({ 
      where: { email },
      transaction 
    });
  }

  /**
   * Crea un nuovo utente
   */
  async create(userData: Optional<UtenteAttributes, 'id'>, transaction?: Transaction): Promise<Utente> {
    return await Utente.create(userData, { transaction });
  }

  /**
   * Aggiorna i token rimanenti di un utente
   */
  async updateTokens(userId: number, newTokenAmount: number, transaction?: Transaction): Promise<[number]> {
    return await Utente.update(
      { token_rimanenti: newTokenAmount },
      { 
        where: { id: userId },
        transaction 
      }
    );
  }

  /**
   * Aggiorna un utente
   */
  async update(userId: number, updateData: Partial<UtenteAttributes>, transaction?: Transaction): Promise<[number]> {
    return await Utente.update(
      updateData,
      { 
        where: { id: userId },
        transaction 
      }
    );
  }

  /**
   * Conta il numero totale di utenti
   */
  async count(): Promise<number> {
    return await Utente.count();
  }

  /**
   * Calcola il totale dei token nel sistema
   */
  async getTotalTokensInSystem(): Promise<number> {
    const result = await Utente.findAll({
      attributes: [
        [Utente.sequelize!.fn('SUM', Utente.sequelize!.col('token_rimanenti')), 'total_tokens']
      ],
      raw: true
    }) as unknown as TotalTokensResult[];

    const total = result[0]?.total_tokens;
    return total ? parseFloat(total.toString()) : 0;
  }

  /**
   * Ottiene tutti gli utenti con paginazione
   */
  async findAllWithPagination(limit: number, offset: number): Promise<{ count: number; rows: Utente[] }> {
    return await Utente.findAndCountAll({
      attributes: ['id', 'email', 'ruolo', 'token_rimanenti', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Verifica se un utente ha token sufficienti
   */
  async hasEnoughTokens(userId: number, requiredTokens: number, transaction?: Transaction): Promise<boolean> {
    const user = await this.findById(userId, transaction);
    return user ? user.token_rimanenti >= requiredTokens : false;
  }

  /**
   * Sottrae token da un utente
   */
  async deductTokens(userId: number, tokensToDeduct: number, transaction?: Transaction): Promise<void> {
    const user = await this.findById(userId, transaction);
    if (!user) {
      throw new Error('Utente non trovato');
    }
    
    const newBalance = user.token_rimanenti - tokensToDeduct;
    await this.updateTokens(userId, newBalance, transaction);
  }

  /**
   * Sottrae token e ritorna il saldo aggiornato in una singola operazione
   * Elimina la necessità di chiamate multiple findById dopo deduzioni
   * @param userId - ID dell'utente
   * @param amount - Quantità di token da sottrarre
   * @param transaction - Transazione opzionale
   * @returns Saldo token aggiornato
   */
  async deductTokensAndGetBalance(userId: number, amount: number, transaction?: Transaction): Promise<number> {
    const user = await this.findById(userId, transaction);
    if (!user) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'Utente non trovato');
    }

    if (user.token_rimanenti < amount) {
      throw ErrorFactory.createError(ErrorTypes.BadRequest, 
        `Token insufficienti. Richiesti: ${amount}, Disponibili: ${user.token_rimanenti}`);
    }

    const newBalance = user.token_rimanenti - amount;
    
    await Utente.update(
      { token_rimanenti: newBalance },
      { 
        where: { id: userId },
        transaction 
      }
    );

    return newBalance;
  }

  /**
   * Aggiorna token e ritorna il saldo aggiornato
   * @param userId - ID dell'utente
   * @param newBalance - Nuovo saldo
   * @param transaction - Transazione opzionale
   * @returns Saldo token aggiornato
   */
  async updateTokensAndGetBalance(userId: number, newBalance: number, transaction?: Transaction): Promise<number> {
    await Utente.update(
      { token_rimanenti: newBalance },
      { 
        where: { id: userId },
        transaction 
      }
    );

    return newBalance;
  }

  /**
   * Trova multiple utenti per ID (bulk operation)
   */
  async findMultipleByIds(userIds: number[], transaction?: Transaction): Promise<Utente[]> {
    if (userIds.length === 0) return [];
    
    return await Utente.findAll({
      where: {
        id: {
          [Op.in]: userIds
        }
      },
      transaction
    });
  }

  /**
   * Aggiorna token per multiple utenti (bulk operation)
   */
  async bulkUpdateTokens(
    updates: Array<{ userId: number; newTokenAmount: number }>,
    transaction?: Transaction
  ): Promise<void> {
    if (updates.length === 0) return;
    
    // Esegui aggiornamenti in parallelo
    await Promise.all(
      updates.map(({ userId, newTokenAmount }) => 
        this.updateTokens(userId, newTokenAmount, transaction)
      )
    );
  }

  /**
   * Verifica se multiple utenti hanno token sufficienti (bulk operation)
   */
  async checkMultipleUsersTokens(
    checks: Array<{ userId: number; requiredTokens: number }>,
    transaction?: Transaction
  ): Promise<Array<{ userId: number; hasEnoughTokens: boolean; currentTokens: number }>> {
    if (checks.length === 0) return [];
    
    const userIds = checks.map(check => check.userId);
    const users = await this.findMultipleByIds(userIds, transaction);
    
    return checks.map(check => {
      const user = users.find(u => u.id === check.userId);
      return {
        userId: check.userId,
        hasEnoughTokens: user ? user.token_rimanenti >= check.requiredTokens : false,
        currentTokens: user ? user.token_rimanenti : 0
      };
    });
  }
}

export default new UtenteDao();