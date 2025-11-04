import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Allow frontend on localhost:3001
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Prepare DB path and folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbFile = process.env.DB_FILE || path.join(dataDir, 'app.db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Choose storage: native SQLite when available, otherwise JSON file store
const useNative = process.env.USE_SQLITE === 'true';
let db; // when native
let store; // when json

const storeFile = path.join(dataDir, 'app.json');

async function initStorage() {
  if (useNative) {
    try {
      const { default: Database } = await import('better-sqlite3');
      db = new Database(dbFile);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
  db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact TEXT,
          phone TEXT,
          address TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS drivers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          teamName TEXT,
          plateNumbers TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact TEXT,
          phone TEXT,
          address TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS delivery_batches (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          supplierId TEXT,
          supplierName TEXT,
          departureDate TEXT,
          coalPrice REAL,
          totalWeight REAL,
          totalAmount REAL,
          paidAmount REAL,
          remainingAmount REAL,
          status TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS delivery_vehicles (
          id TEXT PRIMARY KEY,
          batchId TEXT NOT NULL,
          plateNumber TEXT,
          driverName TEXT,
          weight REAL,
          amount REAL,
          createdAt TEXT,
          FOREIGN KEY(batchId) REFERENCES delivery_batches(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS batch_payment_records (
          id TEXT PRIMARY KEY,
          batchId TEXT NOT NULL,
          amount REAL,
          paymentDate TEXT,
          remark TEXT,
          createdAt TEXT,
          FOREIGN KEY(batchId) REFERENCES delivery_batches(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS cargo_payments (
          id TEXT PRIMARY KEY,
          shipmentId TEXT,
          customerId TEXT,
          customerName TEXT,
          calculatedAmount REAL,
          actualAmount REAL,
          paymentDate TEXT,
          remark TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS freight_payments (
          id TEXT PRIMARY KEY,
          driverId TEXT,
          driverName TEXT,
          plateNumbers TEXT,
          calculatedAmount REAL,
          actualAmount REAL,
          paymentDate TEXT,
          remark TEXT,
          createdAt TEXT,
          arrivalRecordId TEXT
        );
        CREATE TABLE IF NOT EXISTS customer_payments (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          amount REAL,
          paymentDate TEXT,
          remark TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS arrival_records (
          id TEXT PRIMARY KEY,
          arrivalDate TEXT,
          customerId TEXT,
          customerName TEXT,
          sellingPricePerTon REAL,
          freightPerTon REAL,
          totalWeight REAL,
          totalLoss REAL,
          totalReceivable REAL,
          actualFreightPaid REAL,
          freightPaymentStatus TEXT,
          actualReceived REAL,
          receivablePaymentStatus TEXT,
          status TEXT,
          remark TEXT,
          relatedShipments TEXT,
          createdAt TEXT
        );
      `);
      // Try to add arrival_record_id column for customer_payments if missing
      try {
        const cols = db.prepare("PRAGMA table_info('customer_payments')").all();
        const hasArrivalId = cols.some(c => c.name === 'arrival_record_id');
        if (!hasArrivalId) {
          db.exec("ALTER TABLE customer_payments ADD COLUMN arrival_record_id TEXT");
        }
      } catch (e) {
        console.warn('Failed to ensure arrival_record_id column on customer_payments:', e.message);
      }
      console.log('Using native SQLite storage');
    } catch (e) {
      console.warn('Native SQLite unavailable, falling back to JSON store:', e.message);
      await initJsonStore();
    }
  } else {
    await initJsonStore();
  }
}

async function initJsonStore() {
  if (!fs.existsSync(storeFile)) {
    const initial = {
      customers: [],
      drivers: [],
      suppliers: [],
      delivery_batches: [],
      delivery_vehicles: [],
      batch_payment_records: [],
      cargo_payments: [],
      freight_payments: [],
      customer_payments: [],
      arrival_records: []
    };
    fs.writeFileSync(storeFile, JSON.stringify(initial, null, 2));
  }
  store = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
  console.log('Using JSON file storage:', path.basename(storeFile));
}

function saveStore() {
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: path.basename(dbFile) });
});

// Customers CRUD
app.get('/api/customers', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
    return res.json(rows);
  }
  const rows = [...store.customers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/customers', (req, res) => {
  const id = `c${Date.now()}`;
  const { name, contact = '', phone = '', address = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const createdAt = new Date().toISOString().split('T')[0];
  if (db) {
    db.prepare('INSERT INTO customers (id, name, contact, phone, address, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, contact, phone, address, createdAt);
  } else {
    store.customers.push({ id, name, contact, phone, address, createdAt });
    saveStore();
  }
  res.status(201).json({ id, name, contact, phone, address, createdAt });
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, contact, phone, address } = req.body || {};
  if (db) {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE customers SET name = ?, contact = ?, phone = ?, address = ? WHERE id = ?')
      .run(name ?? existing.name, contact ?? existing.contact, phone ?? existing.phone, address ?? existing.address, id);
    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return res.json(updated);
  }
  const idx = store.customers.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const existing = store.customers[idx];
  const updated = { ...existing, name: name ?? existing.name, contact: contact ?? existing.contact, phone: phone ?? existing.phone, address: address ?? existing.address };
  store.customers[idx] = updated;
  saveStore();
  res.json(updated);
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = store.customers.length;
    store.customers = store.customers.filter(c => c.id !== id);
    if (store.customers.length === before) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// Suppliers CRUD
app.get('/api/suppliers', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM suppliers ORDER BY createdAt DESC').all();
    return res.json(rows);
  }
  const rows = [...store.suppliers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/suppliers', (req, res) => {
  const id = `s${Date.now()}`;
  const { name, contact = '', phone = '', address = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const createdAt = new Date().toISOString().split('T')[0];
  if (db) {
    db.prepare('INSERT INTO suppliers (id, name, contact, phone, address, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, contact, phone, address, createdAt);
  } else {
    store.suppliers.push({ id, name, contact, phone, address, createdAt });
    saveStore();
  }
  res.status(201).json({ id, name, contact, phone, address, createdAt });
});

app.put('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const { name, contact, phone, address } = req.body || {};
  if (db) {
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    db.prepare('UPDATE suppliers SET name = ?, contact = ?, phone = ?, address = ? WHERE id = ?')
      .run(name ?? existing.name, contact ?? existing.contact, phone ?? existing.phone, address ?? existing.address, id);
    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    return res.json(updated);
  }
  const idx = store.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const existing = store.suppliers[idx];
  const updated = { ...existing, name: name ?? existing.name, contact: contact ?? existing.contact, phone: phone ?? existing.phone, address: address ?? existing.address };
  store.suppliers[idx] = updated;
  saveStore();
  res.json(updated);
});

app.delete('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = store.suppliers.length;
    store.suppliers = store.suppliers.filter(s => s.id !== id);
    if (store.suppliers.length === before) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// Drivers CRUD with fallback to aggregated list when empty
app.get('/api/drivers', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM drivers ORDER BY createdAt DESC').all();
    if (rows.length > 0) {
      const parsed = rows.map(r => ({
        id: r.id,
        name: r.name,
        phone: r.phone || '',
        teamName: r.teamName || '',
        plateNumbers: (() => { try { return JSON.parse(r.plateNumbers || '[]'); } catch { return []; } })(),
        createdAt: r.createdAt
      }));
      return res.json(parsed);
    }
    // Fallback to aggregate from delivery_vehicles
    const vehs = db.prepare('SELECT plateNumber, driverName, createdAt FROM delivery_vehicles').all();
    const map = new Map();
    for (const v of vehs) {
      const name = v.driverName || '未知司机';
      const id = 'drv_' + Buffer.from(String(name)).toString('hex').slice(0, 8);
      const plate = v.plateNumber || '';
      if (!map.has(id)) {
        map.set(id, { id, name, phone: '', teamName: '', plateNumbers: [], createdAt: v.createdAt || new Date().toISOString().split('T')[0] });
      }
      const entry = map.get(id);
      if (plate && !entry.plateNumbers.includes(plate)) entry.plateNumbers.push(plate);
    }
    return res.json(Array.from(map.values()));
  }
  const rows = [...(store.drivers || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (rows.length > 0) return res.json(rows);
  // Fallback aggregate from JSON delivery_vehicles
  const aggregate = (rows2) => {
    const map = new Map();
    for (const v of rows2) {
      const name = v.driverName || '未知司机';
      const id = 'drv_' + Buffer.from(String(name)).toString('hex').slice(0, 8);
      const plate = v.plateNumber || '';
      if (!map.has(id)) {
        map.set(id, { id, name, phone: '', teamName: '', plateNumbers: [], createdAt: v.createdAt || new Date().toISOString().split('T')[0] });
      }
      const entry = map.get(id);
      if (plate && !entry.plateNumbers.includes(plate)) entry.plateNumbers.push(plate);
    }
    return Array.from(map.values());
  };
  return res.json(aggregate(store.delivery_vehicles || []));
});

app.post('/api/drivers', (req, res) => {
  const id = `drv${Date.now()}`;
  const { name, phone = '', teamName = '', plateNumbers = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const createdAt = new Date().toISOString().split('T')[0];
  const payload = {
    id,
    name,
    phone,
    teamName,
    plateNumbers: Array.isArray(plateNumbers) ? plateNumbers : [],
    createdAt
  };
  if (db) {
    db.prepare('INSERT INTO drivers (id, name, phone, teamName, plateNumbers, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, phone, teamName, JSON.stringify(payload.plateNumbers), createdAt);
  } else {
    if (!store.drivers) store.drivers = [];
    store.drivers.push(payload);
    saveStore();
  }
  res.status(201).json(payload);
});

app.put('/api/drivers/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const existing = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const updated = {
      name: req.body?.name ?? existing.name,
      phone: req.body?.phone ?? existing.phone,
      teamName: req.body?.teamName ?? existing.teamName,
      plateNumbers: Array.isArray(req.body?.plateNumbers)
        ? JSON.stringify(req.body.plateNumbers)
        : existing.plateNumbers,
      createdAt: existing.createdAt
    };
    db.prepare('UPDATE drivers SET name = ?, phone = ?, teamName = ?, plateNumbers = ? WHERE id = ?')
      .run(updated.name, updated.phone, updated.teamName, updated.plateNumbers, id);
    const row = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    return res.json({
      id,
      name: row.name,
      phone: row.phone || '',
      teamName: row.teamName || '',
      plateNumbers: (() => { try { return JSON.parse(row.plateNumbers || '[]'); } catch { return []; } })(),
      createdAt: row.createdAt
    });
  }
  const idx = (store.drivers || []).findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const existing = store.drivers[idx];
  const updated = {
    ...existing,
    name: req.body?.name ?? existing.name,
    phone: req.body?.phone ?? existing.phone,
    teamName: req.body?.teamName ?? existing.teamName,
    plateNumbers: Array.isArray(req.body?.plateNumbers) ? req.body.plateNumbers : existing.plateNumbers
  };
  store.drivers[idx] = updated;
  saveStore();
  res.json(updated);
});

app.delete('/api/drivers/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM drivers WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = (store.drivers || []).length;
    store.drivers = (store.drivers || []).filter(d => d.id !== id);
    if (before === (store.drivers || []).length) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// Payments: Cargo
app.get('/api/payments/cargo', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM cargo_payments ORDER BY createdAt DESC').all();
    return res.json(rows);
  }
  const rows = [...(store.cargo_payments || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/payments/cargo', (req, res) => {
  const id = `cp${Date.now()}`;
  const {
    shipmentId = '', customerId = '', customerName = '', calculatedAmount = 0,
    actualAmount = 0, paymentDate = new Date().toISOString().split('T')[0], remark = ''
  } = req.body || {};
  const createdAt = new Date().toISOString().split('T')[0];
  const payload = { id, shipmentId, customerId, customerName, calculatedAmount: Number(calculatedAmount), actualAmount: Number(actualAmount), paymentDate, remark, createdAt };
  if (db) {
    db.prepare(`INSERT INTO cargo_payments (id, shipmentId, customerId, customerName, calculatedAmount, actualAmount, paymentDate, remark, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, shipmentId, customerId, customerName, Number(calculatedAmount), Number(actualAmount), paymentDate, remark, createdAt);
  } else {
    if (!store.cargo_payments) store.cargo_payments = [];
    store.cargo_payments.push(payload);
    saveStore();
  }
  res.status(201).json(payload);
});

// Payments: Freight
app.get('/api/payments/freight', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM freight_payments ORDER BY createdAt DESC').all();
    const parsed = rows.map(r => ({
      ...r,
      plateNumbers: (() => { try { return JSON.parse(r.plateNumbers || '[]'); } catch { return []; } })()
    }));
    return res.json(parsed);
  }
  const rows = [...(store.freight_payments || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/payments/freight', (req, res) => {
  const id = `fp${Date.now()}`;
  const {
    driverId = '', driverName = '', plateNumbers = [], calculatedAmount = 0,
    actualAmount = 0, paymentDate = new Date().toISOString().split('T')[0], remark = '', arrivalRecordId = null
  } = req.body || {};
  const createdAt = new Date().toISOString().split('T')[0];
  const payload = { id, driverId, driverName, plateNumbers: Array.isArray(plateNumbers) ? plateNumbers : [], calculatedAmount: Number(calculatedAmount), actualAmount: Number(actualAmount), paymentDate, remark, createdAt, arrivalRecordId };
  if (db) {
    db.prepare(`INSERT INTO freight_payments (id, driverId, driverName, plateNumbers, calculatedAmount, actualAmount, paymentDate, remark, createdAt, arrivalRecordId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, driverId, driverName, JSON.stringify(payload.plateNumbers), Number(calculatedAmount), Number(actualAmount), paymentDate, remark, createdAt, arrivalRecordId);
  } else {
    if (!store.freight_payments) store.freight_payments = [];
    store.freight_payments.push(payload);
    saveStore();
  }
  res.status(201).json(payload);
});

app.delete('/api/payments/freight/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM freight_payments WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = (store.freight_payments || []).length;
    store.freight_payments = (store.freight_payments || []).filter(p => p.id !== id);
    if (before === store.freight_payments.length) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// Payments: Customer receipts
app.get('/api/payments/customer', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM customer_payments ORDER BY createdAt DESC').all();
    return res.json(rows);
  }
  const rows = [...(store.customer_payments || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/payments/customer', (req, res) => {
  const id = `rc${Date.now()}`; // receipt id
  const {
    customerId = '', customerName = '', amount = 0, paymentDate = new Date().toISOString().split('T')[0], remark = '', arrivalRecordId = null
  } = req.body || {};
  const createdAt = new Date().toISOString().split('T')[0];
  const payload = { id, customerId, customerName, amount: Number(amount), paymentDate, remark, createdAt, arrivalRecordId };
  if (db) {
    db.prepare(`INSERT INTO customer_payments (id, customerId, customerName, amount, paymentDate, remark, createdAt, arrival_record_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, customerId, customerName, Number(amount), paymentDate, remark, createdAt, arrivalRecordId);
  } else {
    if (!store.customer_payments) store.customer_payments = [];
    store.customer_payments.push(payload);
    saveStore();
  }
  res.status(201).json(payload);
});

// Delivery batches: list with nested vehicles and payments
app.get('/api/batches', (req, res) => {
  if (db) {
    const batches = db.prepare('SELECT * FROM delivery_batches ORDER BY createdAt DESC').all();
    const vehiclesStmt = db.prepare('SELECT * FROM delivery_vehicles WHERE batchId = ?');
    const paymentsStmt = db.prepare('SELECT * FROM batch_payment_records WHERE batchId = ?');
    const result = batches.map(b => ({
      ...b,
      vehicles: vehiclesStmt.all(b.id),
      paymentRecords: paymentsStmt.all(b.id)
    }));
    return res.json(result);
  }
  const batches = [...store.delivery_batches].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const result = batches.map(b => ({
    ...b,
    vehicles: store.delivery_vehicles.filter(v => v.batchId === b.id),
    paymentRecords: store.batch_payment_records.filter(p => p.batchId === b.id)
  }));
  res.json(result);
});

// Create a batch with vehicles
app.post('/api/batches', (req, res) => {
  const id = `b${Date.now()}`;
  const {
    customerId = '', customerName = '', supplierId = '', supplierName = '',
    departureDate = '', coalPrice = 0, vehicles = []
  } = req.body || {};
  const createdAt = new Date().toISOString().split('T')[0];
  const totalWeight = vehicles.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
  const totalAmount = vehicles.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const paidAmount = 0;
  const remainingAmount = totalAmount;
  const status = remainingAmount > 0 ? (paidAmount > 0 ? 'partial_paid' : 'pending') : 'fully_paid';

  if (db) {
    const insertBatch = db.prepare(`INSERT INTO delivery_batches 
      (id, customerId, customerName, supplierId, supplierName, departureDate, coalPrice, totalWeight, totalAmount, paidAmount, remainingAmount, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertVehicle = db.prepare(`INSERT INTO delivery_vehicles (id, batchId, plateNumber, driverName, weight, amount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const transaction = db.transaction(() => {
      insertBatch.run(id, customerId, customerName, supplierId, supplierName, departureDate, coalPrice, totalWeight, totalAmount, paidAmount, remainingAmount, status, createdAt);
      for (const v of vehicles) {
        const vid = `v${Date.now()}${Math.floor(Math.random()*1000)}`;
        insertVehicle.run(vid, id, v.plateNumber || '', v.driverName || '', Number(v.weight) || 0, Number(v.amount) || 0, createdAt);
      }
    });
    transaction();
  } else {
    store.delivery_batches.push({ id, customerId, customerName, supplierId, supplierName, departureDate, coalPrice, totalWeight, totalAmount, paidAmount, remainingAmount, status, createdAt });
    for (const v of vehicles) {
      const vid = `v${Date.now()}${Math.floor(Math.random()*1000)}`;
      store.delivery_vehicles.push({ id: vid, batchId: id, plateNumber: v.plateNumber || '', driverName: v.driverName || '', weight: Number(v.weight) || 0, amount: Number(v.amount) || 0, createdAt });
    }
    saveStore();
  }

  res.status(201).json({ id, customerId, customerName, supplierId, supplierName, departureDate, coalPrice, totalWeight, totalAmount, paidAmount, remainingAmount, status, createdAt });
});

// Add a payment to a batch
app.post('/api/batches/:id/payments', (req, res) => {
  const { id } = req.params;
  const batch = db
    ? db.prepare('SELECT * FROM delivery_batches WHERE id = ?').get(id)
    : store.delivery_batches.find(b => b.id === id);
  if (!batch) return res.status(404).json({ error: 'batch not found' });
  const { amount = 0, paymentDate = new Date().toISOString().split('T')[0], remark = '' } = req.body || {};
  const pid = `p${Date.now()}`;
  const createdAt = new Date().toISOString();

  const newPaid = (batch.paidAmount || 0) + Number(amount);
  const newRemaining = Math.max(0, (batch.remainingAmount || 0) - Number(amount));
  const newStatus = newRemaining <= 0 ? 'fully_paid' : (newPaid > 0 ? 'partial_paid' : 'pending');

  if (db) {
    const insertPayment = db.prepare('INSERT INTO batch_payment_records (id, batchId, amount, paymentDate, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    const updateBatch = db.prepare('UPDATE delivery_batches SET paidAmount = ?, remainingAmount = ?, status = ? WHERE id = ?');
    const transaction = db.transaction(() => {
      insertPayment.run(pid, id, Number(amount), paymentDate, remark, createdAt);
      updateBatch.run(newPaid, newRemaining, newStatus, id);
    });
    transaction();
  } else {
    store.batch_payment_records.push({ id: pid, batchId: id, amount: Number(amount), paymentDate, remark, createdAt });
    const idx = store.delivery_batches.findIndex(b => b.id === id);
    if (idx !== -1) {
      store.delivery_batches[idx] = { ...store.delivery_batches[idx], paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
    }
    saveStore();
  }

  res.status(201).json({ id: pid, batchId: id, amount: Number(amount), paymentDate, remark, createdAt });
});

// Delete a batch (cascade vehicles and payments)
app.delete('/api/batches/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM delivery_batches WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = store.delivery_batches.length;
    store.delivery_batches = store.delivery_batches.filter(b => b.id !== id);
    store.delivery_vehicles = store.delivery_vehicles.filter(v => v.batchId !== id);
    store.batch_payment_records = store.batch_payment_records.filter(p => p.batchId !== id);
    if (before === store.delivery_batches.length) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// (old aggregated /api/drivers route replaced by CRUD with fallback above)

// Derived list: shipments (from batches + vehicles)
app.get('/api/shipments', (req, res) => {
  const build = (vehicles, batchById) => vehicles.map(v => {
    const b = batchById[v.batchId] || {};
    const driverName = v.driverName || '未知司机';
    const driverId = 'drv_' + Buffer.from(String(driverName)).toString('hex').slice(0, 8);
    const coalPrice = Number(b.coalPrice) || 0;
    const weight = Number(v.weight) || 0;
    const coalAmount = Number(v.amount) || (coalPrice * weight);
    return {
      id: v.id,
      batchId: v.batchId,
      vehicleId: v.id,
      plateNumber: v.plateNumber || '',
      driverName,
      driverId,
      customerId: b.customerId || '',
      customerName: b.customerName || '',
      supplierId: b.supplierId || '',
      supplierName: b.supplierName || '',
      coalPrice,
      freightPrice: 0,
      weight,
      coalAmount,
      freightAmount: 0,
      departureDate: b.departureDate || '',
      arrivalDate: undefined,
      status: 'shipping',
      createdAt: v.createdAt || b.createdAt || new Date().toISOString().split('T')[0]
    };
  });
  if (db) {
    const batches = db.prepare('SELECT * FROM delivery_batches').all();
    const batchById = Object.fromEntries(batches.map(b => [b.id, b]));
    const vehicles = db.prepare('SELECT * FROM delivery_vehicles').all();
    return res.json(build(vehicles, batchById));
  }
  const batchById = Object.fromEntries((store.delivery_batches || []).map(b => [b.id, b]));
  const vehicles = store.delivery_vehicles || [];
  res.json(build(vehicles, batchById));
});

// Arrival Records CRUD
app.get('/api/arrival-records', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM arrival_records ORDER BY createdAt DESC').all();
    const parsed = rows.map(r => ({
      ...r,
      relatedShipments: (() => { try { return JSON.parse(r.relatedShipments || '[]'); } catch { return []; } })()
    }));
    return res.json(parsed);
  }
  const rows = [...(store.arrival_records || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

app.post('/api/arrival-records', (req, res) => {
  const id = `ar${Date.now()}`;
  const {
    arrivalDate = '', customerId = '', customerName = '', sellingPricePerTon = 0,
    freightPerTon = 0, totalWeight = 0, totalLoss = 0, totalReceivable = 0,
    actualFreightPaid = 0, freightPaymentStatus = 'pending', actualReceived = 0,
    receivablePaymentStatus = 'pending', status = 'pending', remark = '', relatedShipments = []
  } = req.body || {};
  const createdAt = new Date().toISOString().split('T')[0];
  const payload = {
    id, arrivalDate, customerId, customerName, sellingPricePerTon: Number(sellingPricePerTon), freightPerTon: Number(freightPerTon),
    totalWeight: Number(totalWeight), totalLoss: Number(totalLoss), totalReceivable: Number(totalReceivable), actualFreightPaid: Number(actualFreightPaid),
    freightPaymentStatus, actualReceived: Number(actualReceived), receivablePaymentStatus, status, remark, relatedShipments, createdAt
  };
  if (db) {
    db.prepare(`INSERT INTO arrival_records (id, arrivalDate, customerId, customerName, sellingPricePerTon, freightPerTon, totalWeight, totalLoss, totalReceivable, actualFreightPaid, freightPaymentStatus, actualReceived, receivablePaymentStatus, status, remark, relatedShipments, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, arrivalDate, customerId, customerName, Number(sellingPricePerTon), Number(freightPerTon), Number(totalWeight), Number(totalLoss), Number(totalReceivable), Number(actualFreightPaid),
      freightPaymentStatus, Number(actualReceived), receivablePaymentStatus, status, remark, JSON.stringify(relatedShipments || []), createdAt
    );
  } else {
    if (!store.arrival_records) store.arrival_records = [];
    store.arrival_records.push(payload);
    saveStore();
  }
  res.status(201).json(payload);
});

app.put('/api/arrival-records/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const existing = db.prepare('SELECT * FROM arrival_records WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const updated = { ...existing, ...req.body };
    db.prepare(`UPDATE arrival_records SET arrivalDate = ?, customerId = ?, customerName = ?, sellingPricePerTon = ?, freightPerTon = ?, totalWeight = ?, totalLoss = ?, totalReceivable = ?, actualFreightPaid = ?, freightPaymentStatus = ?, actualReceived = ?, receivablePaymentStatus = ?, status = ?, remark = ?, relatedShipments = ? WHERE id = ?`)
      .run(
        updated.arrivalDate, updated.customerId, updated.customerName, Number(updated.sellingPricePerTon), Number(updated.freightPerTon), Number(updated.totalWeight), Number(updated.totalLoss), Number(updated.totalReceivable), Number(updated.actualFreightPaid),
        updated.freightPaymentStatus, Number(updated.actualReceived), updated.receivablePaymentStatus, updated.status, updated.remark, JSON.stringify(updated.relatedShipments || []), id
      );
    const row = db.prepare('SELECT * FROM arrival_records WHERE id = ?').get(id);
    return res.json({
      ...row,
      relatedShipments: (() => { try { return JSON.parse(row.relatedShipments || '[]'); } catch { return []; } })()
    });
  }
  const idx = (store.arrival_records || []).findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const existing = store.arrival_records[idx];
  const updated = { ...existing, ...req.body };
  store.arrival_records[idx] = updated;
  saveStore();
  res.json(updated);
});

app.delete('/api/arrival-records/:id', (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM arrival_records WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  } else {
    const before = (store.arrival_records || []).length;
    store.arrival_records = (store.arrival_records || []).filter(r => r.id !== id);
    if (before === store.arrival_records.length) return res.status(404).json({ error: 'not found' });
    saveStore();
  }
  res.status(204).send();
});

// Start server
await initStorage();
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
