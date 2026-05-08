const { getDB } = require('./index');

// Driver model
const Driver = {
  find: async (query = {}) => {
    const db = getDB();
    let sql = 'SELECT * FROM drivers';
    const params = [];
    
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      Object.keys(query).forEach(key => {
        if (query[key]) {
          conditions.push(`${key} = ?`);
          params.push(query[key]);
        }
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    sql += ' ORDER BY created_at DESC';
    return db.all(sql, params);
  },
  
  findById: async (id) => {
    const db = getDB();
    return db.get('SELECT * FROM drivers WHERE id = ?', [id]);
  },
  
  findOne: async (query) => {
    const db = getDB();
    const conditions = [];
    const params = [];
    
    Object.keys(query).forEach(key => {
      if (query[key]) {
        conditions.push(`${key} = ?`);
        params.push(query[key]);
      }
    });
    
    const sql = conditions.length > 0 
      ? `SELECT * FROM drivers WHERE ${conditions.join(' AND ')}`
      : 'SELECT * FROM drivers LIMIT 1';
    
    return db.get(sql, params);
  },
  
  create: async (data) => {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO drivers (name, phone, vehicle_no, total_paid) VALUES (?, ?, ?, ?)',
      [data.name, data.phone, data.vehicleNo, data.totalPaid || 0]
    );
    return { _id: result.lastID, ...data };
  },
  
  findByIdAndUpdate: async (id, data) => {
    const db = getDB();
    await db.run(
      'UPDATE drivers SET name = ?, phone = ?, vehicle_no = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [data.name, data.phone, data.vehicleNo, id]
    );
    return { _id: id, ...data };
  },
  
  findByIdAndDelete: async (id) => {
    const db = getDB();
    await db.run('DELETE FROM drivers WHERE id = ?', [id]);
    return { _id: id };
  }
};

// Transporter model
const Transporter = {
  find: async (query = {}) => {
    const db = getDB();
    let sql = 'SELECT * FROM transporters';
    const params = [];
    
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      Object.keys(query).forEach(key => {
        if (query[key]) {
          conditions.push(`${key} = ?`);
          params.push(query[key]);
        }
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    sql += ' ORDER BY created_at DESC';
    return db.all(sql, params);
  },
  
  findById: async (id) => {
    const db = getDB();
    return db.get('SELECT * FROM transporters WHERE id = ?', [id]);
  },
  
  findOne: async (query) => {
    const db = getDB();
    const conditions = [];
    const params = [];
    
    Object.keys(query).forEach(key => {
      if (query[key]) {
        conditions.push(`${key} = ?`);
        params.push(query[key]);
      }
    });
    
    const sql = conditions.length > 0 
      ? `SELECT * FROM transporters WHERE ${conditions.join(' AND ')}`
      : 'SELECT * FROM transporters LIMIT 1';
    
    return db.get(sql, params);
  },
  
  create: async (data) => {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO transporters (name, phone, address, total_paid, pending) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.phone, data.address || null, data.totalPaid || 0, data.pending || 0]
    );
    return { _id: result.lastID, ...data };
  },
  
  findByIdAndUpdate: async (id, data) => {
    const db = getDB();
    await db.run(
      'UPDATE transporters SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [data.name, data.phone, data.address || null, id]
    );
    return { _id: id, ...data };
  },
  
  findByIdAndDelete: async (id) => {
    const db = getDB();
    await db.run('DELETE FROM transporters WHERE id = ?', [id]);
    return { _id: id };
  }
};

// Bill model
const Bill = {
  find: async (query = {}) => {
    const db = getDB();
    let sql = `
      SELECT b.*, 
             d.name as driver_name, d.phone as driver_phone, d.vehicle_no as driver_vehicle_no,
             t.name as transporter_name, t.phone as transporter_phone
      FROM bills b
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN transporters t ON b.transporter_id = t.id
    `;
    const params = [];
    
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      Object.keys(query).forEach(key => {
        if (query[key]) {
          conditions.push(`b.${key} = ?`);
          params.push(query[key]);
        }
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    sql += ' ORDER BY b.created_at DESC';
    const results = await db.all(sql, params);
    
    // Format results to match expected structure
    return results.map(row => ({
      _id: row.id,
      from: row.from_location,
      to: row.to_location,
      driver: {
        _id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
        vehicleNo: row.driver_vehicle_no
      },
      transporter: {
        _id: row.transporter_id,
        name: row.transporter_name,
        phone: row.transporter_phone
      },
      amount: row.amount,
      status: row.status,
      billDate: row.bill_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },
  
  findById: async (id) => {
    const db = getDB();
    const row = await db.get(`
      SELECT b.*, 
             d.name as driver_name, d.phone as driver_phone, d.vehicle_no as driver_vehicle_no,
             t.name as transporter_name, t.phone as transporter_phone
      FROM bills b
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN transporters t ON b.transporter_id = t.id
      WHERE b.id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      _id: row.id,
      from: row.from_location,
      to: row.to_location,
      driver: {
        _id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
        vehicleNo: row.driver_vehicle_no
      },
      transporter: {
        _id: row.transporter_id,
        name: row.transporter_name,
        phone: row.transporter_phone
      },
      amount: row.amount,
      status: row.status,
      billDate: row.bill_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },
  
  create: async (data) => {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO bills (from_location, to_location, driver_id, transporter_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.from, data.to, data.driver, data.transporter, data.amount, data.status]
    );
    return { _id: result.lastID, ...data };
  },
  
  findByIdAndUpdate: async (id, data) => {
    const db = getDB();
    await db.run(
      'UPDATE bills SET from_location = ?, to_location = ?, driver_id = ?, transporter_id = ?, amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [data.from, data.to, data.driver, data.transporter, data.amount, data.status, id]
    );
    return { _id: id, ...data };
  },
  
  findByIdAndDelete: async (id) => {
    const db = getDB();
    await db.run('DELETE FROM bills WHERE id = ?', [id]);
    return { _id: id };
  }
};

// Transaction model
const Transaction = {
  find: async (query = {}) => {
    const db = getDB();
    let sql = `
      SELECT t.*, 
             d.name as driver_name, d.phone as driver_phone, d.vehicle_no as driver_vehicle_no,
             tr.name as transporter_name, tr.phone as transporter_phone,
             b.from_location as bill_from, b.to_location as bill_to, b.amount as bill_amount, b.status as bill_status
      FROM transactions t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN transporters tr ON t.transporter_id = tr.id
      LEFT JOIN bills b ON t.bill_id = b.id
    `;
    const params = [];
    
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      Object.keys(query).forEach(key => {
        if (query[key]) {
          conditions.push(`t.${key} = ?`);
          params.push(query[key]);
        }
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    sql += ' ORDER BY t.transaction_date DESC';
    const results = await db.all(sql, params);
    
    return results.map(row => ({
      _id: row.id,
      bill: row.bill_id ? {
        _id: row.bill_id,
        from: row.bill_from,
        to: row.bill_to,
        amount: row.bill_amount,
        status: row.bill_status
      } : null,
      driver: {
        _id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
        vehicleNo: row.driver_vehicle_no
      },
      transporter: {
        _id: row.transporter_id,
        name: row.transporter_name,
        phone: row.transporter_phone
      },
      amount: row.amount,
      type: row.type,
      status: row.status,
      transactionDate: row.transaction_date,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },
  
  findById: async (id) => {
    const db = getDB();
    const row = await db.get(`
      SELECT t.*, 
             d.name as driver_name, d.phone as driver_phone, d.vehicle_no as driver_vehicle_no,
             tr.name as transporter_name, tr.phone as transporter_phone,
             b.from_location as bill_from, b.to_location as bill_to, b.amount as bill_amount, b.status as bill_status
      FROM transactions t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN transporters tr ON t.transporter_id = tr.id
      LEFT JOIN bills b ON t.bill_id = b.id
      WHERE t.id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      _id: row.id,
      bill: row.bill_id ? {
        _id: row.bill_id,
        from: row.bill_from,
        to: row.bill_to,
        amount: row.bill_amount,
        status: row.bill_status
      } : null,
      driver: {
        _id: row.driver_id,
        name: row.driver_name,
        phone: row.driver_phone,
        vehicleNo: row.driver_vehicle_no
      },
      transporter: {
        _id: row.transporter_id,
        name: row.transporter_name,
        phone: row.transporter_phone
      },
      amount: row.amount,
      type: row.type,
      status: row.status,
      transactionDate: row.transaction_date,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },
  
  create: async (data) => {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO transactions (bill_id, driver_id, transporter_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.bill || null, data.driver, data.transporter, data.amount, data.type, data.status, data.description]
    );
    return { _id: result.lastID, ...data };
  },
  
  findOneAndUpdate: async (query, update) => {
    const db = getDB();
    await db.run(
      'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [update.status, query._id]
    );
    return { _id: query._id, ...update };
  },
  
  deleteOne: async (query) => {
    const db = getDB();
    await db.run('DELETE FROM transactions WHERE id = ?', [query._id]);
  },
  
  countDocuments: async (query) => {
    const db = getDB();
    const result = await db.get('SELECT COUNT(*) as count FROM transactions WHERE driver_id = ?', [query.driver]);
    return result.count;
  }
};

// User model
const User = {
  findOne: async (query) => {
    const db = getDB();
    return db.get('SELECT * FROM users WHERE username = ?', [query.username]);
  },
  
  create: async (data) => {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [data.username, data.password, data.email, data.role]
    );
    return { _id: result.lastID, ...data };
  }
};

module.exports = {
  Driver,
  Transporter,
  Bill,
  Transaction,
  User
};
