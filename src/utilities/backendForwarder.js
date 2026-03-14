const { insertRideBatch } = require('../db/insertRideBatch.js'); 

async function forwardToBackend(batch) {
    // Guard clause: Do nothing if the batch is empty
    if (!batch || batch.length === 0) return;

    try {
        console.log(`Passing batch of ${batch.length} logs to the PostgreSQL database...`);
        
        await insertRideBatch(batch); 
        
        console.log('Batch successfully handed off and saved to the ledger.');
        return true;
        
    } catch (error) {
      
        console.error('The backend PostgreSQL service threw an error during bulk insert:', error);
    }
}

module.exports = { forwardToBackend };
