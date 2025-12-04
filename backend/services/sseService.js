let sseClients = [];

function addClient(res) {
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);
  console.log(`Client ${clientId} connected. Total: ${sseClients.length}`);
  return clientId;
}

function removeClient(clientId) {
  console.log(`Client ${clientId} disconnected`);
  sseClients = sseClients.filter(client => client.id !== clientId);
}

function broadcast(data) {
  if (sseClients.length === 0) return;
  const sseFormattedData = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => client.res.write(sseFormattedData));
}

module.exports = { addClient, removeClient, broadcast };