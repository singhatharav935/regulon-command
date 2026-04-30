/**
 * Database Setup Script for Real CA Dashboard
 * Run this to initialize the production database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🔧 Setting up SANNIDH CA Dashboard Database...');
  
  try {
    // Read SQL schema files
    const schemaSQL = fs.readFileSync('./database-ca-dashboard.sql', 'utf8');
    
    console.log('📋 Creating tables and schemas...');
    
    // Execute schema creation
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: schemaSQL
    });
    
    if (error) {
      console.error('❌ Error creating database schema:', error);
      throw error;
    }
    
    console.log('✅ Database schema created successfully');
    
    // Create initial admin user if not exists
    const { data: adminUser, error: adminError } = await supabase
      .from('ca_firms')
      .select('*')
      .eq('email', 'admin@sannidh.com')
      .single();
    
    if (!adminUser && !adminError) {
      console.log('👤 Creating default CA firm...');
      
      const { error: insertError } = await supabase
        .from('ca_firms')
        .insert([
          {
            firm_name: 'SANNIDH CA Services',
            email: 'admin@sannidh.com',
            phone: '+91-9876543210',
            address: 'Mumbai, Maharashtra',
            registration_number: 'CA001SANNIDH',
            status: 'active'
          }
        ]);
      
      if (insertError) {
        console.error('❌ Error creating default CA firm:', insertError);
      } else {
        console.log('✅ Default CA firm created');
      }
    }
    
    // Setup government data agents
    console.log('🤖 Setting up government data collection agents...');
    
    const agents = [
      { name: 'GST Portal Agent', source: 'gst.gov.in', status: 'active' },
      { name: 'MCA Portal Agent', source: 'mca.gov.in', status: 'active' },
      { name: 'Income Tax Agent', source: 'incometax.gov.in', status: 'active' },
      { name: 'SEBI Agent', source: 'sebi.gov.in', status: 'active' },
      { name: 'RBI Agent', source: 'rbi.org.in', status: 'active' },
      { name: 'CBIC Agent', source: 'cbic.gov.in', status: 'active' },
      { name: 'eGazette Agent', source: 'egazette.gov.in', status: 'active' }
    ];
    
    const { error: agentError } = await supabase
      .from('regulatory_agents')
      .upsert(agents, { onConflict: 'source' });
    
    if (agentError) {
      console.error('❌ Error setting up agents:', agentError);
    } else {
      console.log('✅ Government data agents configured');
    }
    
    console.log(`
🎯 SANNIDH CA Dashboard Database Setup Complete!

📊 Database Structure:
   • CA Firms & Users
   • Client Management
   • Filing & Task Management
   • Dependency Tracking
   • AI Drafting History
   • Payment Integration
   • Notification System
   • Government Data Integration

🔗 Next Steps:
   1. Start the backend server: npm run dev
   2. Configure government API keys in .env
   3. Test the real CA dashboard: http://localhost:3000/real-ca-dashboard
   
🚀 Ready for production use!
    `);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();