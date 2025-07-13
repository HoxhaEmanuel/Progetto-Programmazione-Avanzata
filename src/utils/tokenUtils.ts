/**
 * Utility avanzato per la gestione dei token
 * Fornisce funzioni robuste per calcoli, validazioni e formattazione
 */

/**
 * Formatta il saldo dei token per la visualizzazione
 * Gestisce casi edge come NaN, Infinity, numeri negativi
 * Accetta sia number che string (per valori DECIMAL di Sequelize)
 */
export const formatTokenBalance = (balance: number | string): string => {
  // Converte stringa a numero se necessario
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (!Number.isFinite(numBalance) || numBalance < 0) {
    return '0.00';
  }
  return numBalance.toFixed(2);
};

/**
 * Verifica se l'utente ha token sufficienti con validazione robusta
 */
export const hasSufficientTokens = (currentBalance: number, requiredTokens: number): boolean => {
  if (!Number.isFinite(currentBalance) || !Number.isFinite(requiredTokens)) {
    return false;
  }
  if (currentBalance < 0 || requiredTokens < 0) {
    return false;
  }
  return currentBalance >= requiredTokens;
};

/**
 * Calcola i token rimanenti dopo una deduzione con validazione
 */
export const calculateRemainingTokens = (currentBalance: number, tokensToDeduct: number): number => {
  if (!Number.isFinite(currentBalance) || !Number.isFinite(tokensToDeduct)) {
    return 0;
  }
  return Math.max(0, currentBalance - tokensToDeduct);
};

/**
 * Calcola il costo di creazione di un modello basato sulle dimensioni
 */
export const calculateModelCreationCost = (width: number, height: number): number => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Dimensioni modello non valide');
  }
  
  const totalCells = width * height;
  const baseCost = 0.05;
  
  // Costo progressivo per modelli più grandi
  let cost = totalCells * baseCost;
  
  if (totalCells > 10000) {
    cost *= 1.5; // Maggiorazione per modelli molto grandi
  } else if (totalCells > 5000) {
    cost *= 1.2; // Maggiorazione per modelli grandi
  }
  
  return Math.round(cost * 100) / 100; // Arrotonda a 2 decimali
};

/**
 * Calcola il costo di aggiornamento celle
 */
export const calculateUpdateCost = (cellCount: number, isCreator: boolean = false): number => {
  if (!Number.isInteger(cellCount) || cellCount < 0) {
    throw new Error('Numero celle non valido');
  }
  
  if (isCreator) {
    return 0; // I creatori non pagano per modificare le proprie griglie
  }
  
  const baseCostPerCell = 0.35;
  let cost = cellCount * baseCostPerCell;
  
  // Sconto per aggiornamenti bulk
  if (cellCount > 50) {
    cost *= 0.8; // 20% di sconto per aggiornamenti grandi
  } else if (cellCount > 20) {
    cost *= 0.9; // 10% di sconto per aggiornamenti medi
  }
  
  return Math.round(cost * 100) / 100;
};

/**
 * Calcola il costo di esecuzione dell'algoritmo A*
 */
export const calculateExecutionCost = (modelCreationCost: number): number => {
  if (!Number.isFinite(modelCreationCost) || modelCreationCost < 0) {
    throw new Error('Costo creazione modello non valido');
  }
  
  // Il costo di esecuzione è uguale al costo di creazione
  return modelCreationCost;
};

/**
 * Valida un importo di token
 */
export const validateTokenAmount = (amount: number): boolean => {
  return Number.isFinite(amount) && amount >= 0 && amount <= 999999.99;
};

/**
 * Converte token da stringa a numero con validazione
 */
export const parseTokenAmount = (tokenString: string): number => {
  const parsed = parseFloat(tokenString);
  if (!validateTokenAmount(parsed)) {
    throw new Error('Importo token non valido');
  }
  return Math.round(parsed * 100) / 100; // Arrotonda a 2 decimali
};

/**
 * Formatta token per display con unità
 */
export const formatTokensWithUnit = (balance: number): string => {
  const formatted = formatTokenBalance(balance);
  return `${formatted} tokens`;
};

/**
 * Calcola la percentuale di token utilizzati
 */
export const calculateTokenUsagePercentage = (used: number, total: number): number => {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / total) * 100));
};