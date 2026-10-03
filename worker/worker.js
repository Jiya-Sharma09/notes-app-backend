require("dotenv").config();

// Starting this file starts the BullMQ worker.
// Run it as a separate Node process from the Express server.
require("./embeddingWorker");

console.log("Clarity embedding worker is running.");
