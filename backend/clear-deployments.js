const { DataSource } = require('typeorm');

async function checkTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'deployify',
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');
    
    // List all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Available tables:');
    tables.forEach(table => console.log(`- ${table.table_name}`));
    
    // Clear deployments only
    const deployResult = await dataSource.query('DELETE FROM deployments');
    console.log(`Deleted ${deployResult[1]} deployments`);
    
    console.log('Deployments cleared successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dataSource.destroy();
    process.exit(0);
  }
}

checkTables();