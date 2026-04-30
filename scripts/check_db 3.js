
import 'dotenv/config';
import { supabase } from '../backend/real-backend/server.js';

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'users' });
  if (error) {
    console.error('Error fetching columns:', error);
    // If RPC doesn't exist, try a simple select
    const { data: selectData, error: selectError } = await supabase.from('users').select('*').limit(1);
    if (selectError) {
      console.error('Select error:', selectError);
    } else {
      console.log('Sample data from users:', selectData);
      if (selectData.length > 0) {
        console.log('Keys in users:', Object.keys(selectData[0]));
      } else {
          console.log('Users table is empty.');
      }
    }
  } else {
    console.log('Columns in users:', data);
  }
}

checkSchema();
