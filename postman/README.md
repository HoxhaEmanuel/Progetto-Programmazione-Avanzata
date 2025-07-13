# Collection Postman - Progetto Crown-Sourcing

Questa directory contiene le collection Postman per testare manualmente tutte le API del progetto Crown-Sourcing.

## File Inclusi

- **`Crown-Sourcing-API.postman_collection.json`**: Collection completa con tutte le richieste API
- **`Crown-Sourcing.postman_environment.json`**: Environment con le variabili necessarie
- **`README.md`**: Questo file con le istruzioni

## Come Importare in Postman

### 1. Importa la Collection
1. Apri Postman
2. Clicca su **"Import"** in alto a sinistra
3. Seleziona il file `Crown-Sourcing-API.postman_collection.json`
4. Clicca **"Import"**

### 2. Importa l'Environment
1. Clicca sull'icona dell'ingranaggio in alto a destra (Manage Environments)
2. Clicca **"Import"**
3. Seleziona il file `Crown-Sourcing.postman_environment.json`
4. Clicca **"Import"**
5. Seleziona l'environment "Crown-Sourcing Environment" dal dropdown in alto a destra

## Configurazione Iniziale

### 1. Avvia il Server
Prima di testare, assicurati che il server sia in esecuzione:
```bash
npm run dev
```
Il server dovrebbe essere disponibile su `http://localhost:3000`

### 2. Verifica l'URL Base
Nell'environment, verifica che la variabile `base_url` sia impostata correttamente:
- **Sviluppo locale**: `http://localhost:3000`
- **Produzione**: Modifica con l'URL del tuo server

## Ordine di Esecuzione Consigliato

### 1. **Autenticazione**
1. **Register User** - Registra un nuovo utente
2. **Login User** - Effettua il login (salva automaticamente il token in `auth_token`)
3. **Login Admin** - Login come amministratore (salva automaticamente il token in `admin_token`)

### 2. **Gestione Modelli**
1. **Create Model** - Crea un nuovo modello (salva automaticamente l'ID in `model_id`)
2. **Get User Models** - Visualizza i modelli dell'utente
3. **Execute A* on Model** - Esegui pathfinding sul modello
4. **Get Model Status** - Controlla lo stato del modello

### 3. **Sistema di Aggiornamenti**
1. **Request Cell Update** - Richiedi aggiornamento di celle
2. **Get Pending Requests** - Visualizza richieste in sospeso
3. **Approve/Reject Requests** - Approva o rifiuta richieste

### 4. **Funzioni Amministrative**
1. **Recharge User Tokens** - Ricarica token utente (richiede admin)
2. **Get System Stats** - Statistiche del sistema (richiede admin)
3. **Get All Users** - Lista tutti gli utenti (richiede admin)

## Variabili Automatiche

Le seguenti variabili vengono impostate automaticamente:
- `auth_token`: Token JWT dell'utente (dal login)
- `admin_token`: Token JWT dell'admin (dal login admin)
- `user_id`: ID dell'utente loggato
- `admin_id`: ID dell'amministratore
- `model_id`: ID del modello creato

## Credenziali di Default

### Utente Normale
- **Email**: `utente@progetto.it`
- **Password**: `password_user`

### Amministratore
- **Email**: `admin@progetto.it`
- **Password**: `password_admin`

*Nota: Queste credenziali sono create automaticamente dal seeding del database*

## Test Scenarios

### Scenario 1: Flusso Utente Completo
1. Registra nuovo utente
2. Login
3. Crea modello
4. Esegui pathfinding
5. Richiedi aggiornamento celle

### Scenario 2: Flusso Amministrativo
1. Login come admin
2. Visualizza statistiche sistema
3. Ricarica token utente
4. Approva richieste aggiornamento

### Scenario 3: Test di Errori
1. Login con credenziali errate
2. Accesso a endpoint protetti senza token
3. Creazione modello con griglia invalida
4. Pathfinding con coordinate fuori bounds

## Utilizzo con Newman (CLI)

Per eseguire i test da linea di comando:

```bash
# Installa Newman
npm install -g newman

# Esegui la collection
newman run Crown-Sourcing-API.postman_collection.json \
  -e Crown-Sourcing.postman_environment.json

# Esegui con report HTML
newman run Crown-Sourcing-API.postman_collection.json \
  -e Crown-Sourcing.postman_environment.json \
  -r html --reporter-html-export report.html

# Test di carico (10 iterazioni)
newman run Crown-Sourcing-API.postman_collection.json \
  -e Crown-Sourcing.postman_environment.json \
  -n 10
```

## Troubleshooting

### Errore di Connessione
- Verifica che il server sia in esecuzione
- Controlla che `base_url` sia corretto
- Assicurati che non ci siano firewall che bloccano la porta 3000

### Token Scaduto
- Riesegui il login per ottenere un nuovo token
- I token JWT hanno una scadenza configurabile

### Errori di Validazione
- Controlla che i dati inviati rispettino il formato richiesto
- Verifica che i campi obbligatori siano presenti

### Database Non Inizializzato
- Esegui il seeding del database: `npm run seed`
- Verifica che le tabelle siano create correttamente

## Estensioni Consigliate

Per migliorare l'esperienza di testing:

1. **Postman Interceptor**: Per catturare richieste dal browser
2. **Newman Reporter**: Per report dettagliati
3. **Postman Monitor**: Per monitoraggio continuo delle API

## Contribuire

Per aggiungere nuovi test:
1. Aggiungi la richiesta alla collection
2. Includi test scripts appropriati
3. Aggiorna questo README se necessario
4. Testa la nuova richiesta prima di committare