/**
 * Database utilities for Regulon Backend
 */

import pkg from 'pg';
const { Pool } = pkg;

// Create a reusable database pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/regulon_production',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a single client from the pool for transactions
export const getClient = async () => {
  return await pool.connect();
};

// Graceful shutdown
export const shutdown = async () => {
  await pool.end();
};

export default {
  pool,
  query,
  getClient,
  shutdown
};