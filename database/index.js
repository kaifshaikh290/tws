const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// SQLite database configuration
const DB_PATH = path.join(__dirname, '../data/transport_management.db');

let db;

// Initialize SQLite database
const connectDB = async () => {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log('SQLite database connected successfully');
    
    // Create tables
    await createTables();
    
    // Create default admin user
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('SQLite database connection error:', error);
    process.exit(1);
  }
};

// Create database tables
const createTables = async () => {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Drivers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      vehicle_no TEXT NOT NULL,
      total_paid REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transporters table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transporters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      total_paid REAL DEFAULT 0,
      pending REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bills table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      driver_id INTEGER NOT NULL,
      transporter_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'unpaid',
      bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers (id),
      FOREIGN KEY (transporter_id) REFERENCES transporters (id)
    )
  `);

  // Transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      driver_id INTEGER NOT NULL,
      transporter_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'unpaid',
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers (id),
      FOREIGN KEY (transporter_id) REFERENCES transporters (id),
      FOREIGN KEY (bill_id) REFERENCES bills (id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers (name);
    CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers (phone);
    CREATE INDEX IF NOT EXISTS idx_transporters_name ON transporters (name);
    CREATE INDEX IF NOT EXISTS idx_transporters_phone ON transporters (phone);
    CREATE INDEX IF NOT EXISTS idx_bills_driver_id ON bills (driver_id);
    CREATE INDEX IF NOT EXISTS idx_bills_transporter_id ON bills (transporter_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_driver_id ON transactions (driver_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_transporter_id ON transactions (transporter_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_bill_id ON transactions (bill_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
    CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions (transaction_date);
  `);
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.run(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@transportmanagement.com', 'admin']
      );
      
      console.log('Default admin user created: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

// Export database instance
const getDB = () => db;

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    if (db) {
      await db.close();
      console.log('SQLite database connection closed');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
});

module.exports = {
  connectDB,
  getDB
};
