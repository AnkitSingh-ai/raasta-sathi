#!/usr/bin/env node

/**
 * Script to recalculate all user points based on their actual report activity
 * This fixes the issue where users have points but no reports
 */

import dotenv from 'dotenv';
import { recalculateAllUserPoints } from '../utils/recalculateUserPoints.js';
import connectDB from '../utils/database.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting points recalculation script...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Recalculate all user points
    const result = await recalculateAllUserPoints();
    
    console.log('🎉 Points recalculation completed successfully!');
    console.log('📊 Summary:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running points recalculation:', error);
    process.exit(1);
  }
}

// Run the script
main();
