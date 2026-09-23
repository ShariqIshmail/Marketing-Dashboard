const fs = require('fs');
const path = require('path');
const pool = require('./connection');

const initDB = async () => {
  try {
    console.log('Initializing database schema...');

    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    // Split into individual statements and execute
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement + ';');
        console.log('✓ Executed:', statement.split('\n')[0].substring(0, 60) + '...');
      }
    }

    console.log('\n✓ Database schema initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error);
    process.exit(1);
  }
};

initDB();
