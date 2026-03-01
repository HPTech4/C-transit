1. Product Overview & System Context
1.1 Purpose
C-Transit is an offline-first, closed-loop digital payment system designed specifically for campus transportation.
The system solves the problem of cash handling and boarding delays on buses operating in environments with unreliable cellular coverage.
Students use per-funded RFID smart cards to instantly pay for rides. Because campus buses operates in an environment with bad internet connectivity,
the hardware terminals on the buses act as the primary source of truth during the ride, authenticating cards against a locally stored whitelist/blacklist,
logging the transaction, and storing the data securely.
When the bus enters an area with a 2G cellular signal, it automatically batches and transmits the offline transactions to a secure cloud backend,
which permanently updates the student's digital wallet balance. It is built to be ultra-lightweight, fault-tolerant, and financially secure.

1.2 System Block Diagram



















1.3 Core Workflows
The system operates on three primary independent workflows to ensure hardware and software are decoupled.
Workflow A: The Offline Tap (Hardware Isolation)
Occurs when a student boards the bus, regardless of network status.
    1. Scan: Student taps their RFID card on the ESP32 terminal.
    2. Local Validation: The ESP32 checks the Card UID against its locally saved text file (the Whitelist and Blacklist).
    3. Execution: If present on the whitelist it checkes the blacklisted, if absent, the ESP32 logs the ride.
    4. Timestamp & Store: The ESP32 pulls the exact time from the DS3231 Hardware RTC, formats a CSV string (TerminalID,CardUID,-200,Timestamp), 
    and saves it to local flash memory. The student boards.

Workflow B: The Network Sync (The MQTT Bridge)
Occurs autonomously in the background whenever the ESP32 detects a 2G signal.
    1. Secure Handshake: The ESP32's 2G module establishes a TLS/SSL connection to HiveMQ Cloud Serverless on Port 8883, using the embedded ISRG Root X1 certificate.
    2. Batch Publish: The ESP32 batches all saved offline CSV strings separated by a pipe (|) and publishes them to the ctransit/tx/flush topic 
    using QoS 1 (Guaranteed Delivery).
    3. Acknowledge & Clear: Once HiveMQ acknowledges receipt, the ESP32 permanently deletes the batched rides from its local memory to free up space.
    4. Backend Ingestion: The Node.js server (listening to HiveMQ) instantly catches the payload, parses the CSV into JSON, and executes a bulk insert into the 
    MongoDB Transactions collection.
    5. Ledger Update: The backend recalculates the affected students' balances and updates the Cards whitelist. If a student drops below zero, 
    their UID is added to the database Blacklist.
    
Workflow C: The User Top-Up (The REST API)
Occurs when a student wants to check their balance or add funds.
    1. Dashboard Access: The student opens the C-Transit Web/Mobile App.
    2. Fetch Data: The frontend makes a standard HTTPS REST API request (GET /api/user/balance/:uid) to the Node.js backend.
    3. Fund Account: The student pays via a payment gateway (e.g., Monnify). The gateway sends a webhook to the Node.js server.
    4. Update Record: The Node.js server adds a positive funding record (e.g., +1000) to the Transactions collection and updates the user's cached_balance.
    5. Hardware Update: The next time a bus connects to the 2G network, it pulls the updated Blacklist via a REST endpoint, unblocking the student 
    if they were previously suspended for insufficient funds.
