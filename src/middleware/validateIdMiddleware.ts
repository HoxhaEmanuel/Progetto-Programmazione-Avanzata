import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { modelloDao } from '../dao';

/**
 * Estende AuthenticatedRequest con ID validati
 */
export interface ValidatedRequest extends AuthenticatedRequest {
  modelId?: number;
  requestId?: number;
}

/**
 * Middleware per validare e parsare l'ID del modello dai parametri URL
 * Elimina la duplicazione di parseInt(req.params.id) in tutti i controller
 */
export const validateModelId = (req: ValidatedRequest, res: Response, next: NextFunction): void => {
  const modelId = parseInt(req.params.id);
  
  if (isNaN(modelId) || modelId <= 0) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'ID modello non valido'));
  }
  
  req.modelId = modelId;
  next();
};

/**
 * Middleware per validare l'ID del modello e verificare che esista
 * Combina validazione + esistenza in un singolo middleware
 */
export const validateAndCheckModelExists = async (req: ValidatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(req.params.id);
    
    if (isNaN(modelId) || modelId <= 0) {
      return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'ID modello non valido'));
    }
    
    // Verifica esistenza modello
    const modello = await modelloDao.findById(modelId);
    if (!modello) {
      return next(ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato'));
    }
    
    req.modelId = modelId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware per validare l'ID della richiesta dai parametri URL
 */
export const validateRequestId = (req: ValidatedRequest, res: Response, next: NextFunction): void => {
  const requestId = parseInt(req.params.requestId || req.params.id);
  
  if (isNaN(requestId) || requestId <= 0) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'ID richiesta non valido'));
  }
  
  req.requestId = requestId;
  next();
};

/**
 * Middleware per validare array di ID numerici nel body
 * Utile per operazioni bulk
 */
export const validateIdArray = (fieldName: string) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    const ids = req.body[fieldName];
    
    if (!Array.isArray(ids)) {
      return next(ErrorFactory.createError(ErrorTypes.BadRequest, `${fieldName} deve essere un array`));
    }
    
    if (ids.length === 0) {
      return next(ErrorFactory.createError(ErrorTypes.BadRequest, `${fieldName} non può essere vuoto`));
    }
    
    // Valida che tutti gli elementi siano ID numerici validi
    for (let i = 0; i < ids.length; i++) {
      const id = parseInt(ids[i]);
      if (isNaN(id) || id <= 0) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 
          `Elemento ${i + 1} in ${fieldName} non è un ID valido`));
      }
      ids[i] = id; // Converte a numero
    }
    
    next();
  };
};

/**
 * Middleware per validare parametri di paginazione
 */
export const validatePagination = (req: ValidatedRequest, res: Response, next: NextFunction): void => {
  const { pagina = 1, limite = 20 } = req.query;
  
  const paginaNum = parseInt(pagina as string);
  const limiteNum = parseInt(limite as string);
  
  if (isNaN(paginaNum) || paginaNum < 1) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Numero pagina deve essere >= 1'));
  }
  
  if (isNaN(limiteNum) || limiteNum < 1 || limiteNum > 100) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Limite deve essere tra 1 e 100'));
  }
  
  // Aggiungi parametri validati alla request
  req.pagination = {
    page: paginaNum,
    limit: limiteNum,
    offset: (paginaNum - 1) * limiteNum
  };
  
  next();
};

/**
 * Estende ValidatedRequest con parametri di paginazione
 */
declare module './validateIdMiddleware' {
  interface ValidatedRequest {
    pagination?: {
      page: number;
      limit: number;
      offset: number;
    };
  }
}