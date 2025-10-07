import clientsData from "@/services/mockData/clients.json";

let clients = [...clientsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clientService = {
  getAll: async () => {
    await delay(300);
    return [...clients];
  },

  getById: async (id) => {
    await delay(200);
    const client = clients.find(c => c.Id === parseInt(id));
    if (!client) throw new Error("Client not found");
    return { ...client };
  },

  create: async (clientData) => {
    await delay(400);
    const maxId = clients.reduce((max, c) => Math.max(max, c.Id), 0);
    const newClient = {
      ...clientData,
      Id: maxId + 1,
      createdAt: new Date().toISOString(),
      status: "Active"
    };
    clients.push(newClient);
    return { ...newClient };
  },

  update: async (id, clientData) => {
    await delay(300);
    const index = clients.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Client not found");
    clients[index] = { ...clients[index], ...clientData };
    return { ...clients[index] };
  },

  delete: async (id) => {
    await delay(300);
    const index = clients.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Client not found");
    clients.splice(index, 1);
    return true;
  }
};

export default clientService;