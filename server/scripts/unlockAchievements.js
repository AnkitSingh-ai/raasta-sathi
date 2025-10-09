#!/usr/bin/env node

/**
 * Script to unlock achievements based on user's current points and stats
 */

import dotenv from 'dotenv';
import User from '../models/User.js';
import Report from '../models/Report.js';
import connectDB from '../utils/database.js';

// Load environment variables
dotenv.config();

// Define achievements based on points and stats
const ACHIEVEMENTS = [
  {
    name: 'First Steps',
    description: 'Submit your first genuine traffic report',
    condition: (stats) => stats.genuineReports >= 1
  },
  {
    name: 'Reporter Novice',
    description: 'Submit 3 genuine traffic reports',
    condition: (stats) => stats.genuineReports >= 3
  },
  {
    name: 'Report Master',
    description: 'Submit 10 genuine traffic reports',
    condition: (stats) => stats.genuineReports >= 10
  },
  {
    name: 'Super Reporter',
    description: 'Submit 25 genuine traffic reports',
    condition: (stats) => stats.genuineReports >= 25
  },
  {
    name: 'Point Collector',
    description: 'Earn 100 points',
    condition: (stats) => stats.points >= 100
  },
  {
    name: 'Point Master',
    description: 'Earn 500 points',
    condition: (stats) => stats.points >= 500
  },
  {
    name: 'Level Up',
    description: 'Reach level 5',
    condition: (stats) => stats.level >= 5
  },
  {
    name: 'Accuracy Expert',
    description: 'Maintain 80% accuracy rate',
    condition: (stats) => stats.accuracy >= 80
  },
  {
    name: 'Photo Pro',
    description: 'Submit 5 genuine reports with photos',
    condition: (stats) => stats.reportsWithPhotos >= 5
  },
  {
    name: 'Community Hero',
    description: 'Submit 50 genuine traffic reports',
    condition: (stats) => stats.genuineReports >= 50
  }
];

async function calculateUserStats(userId) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'citizen') {
    return null;
  }

  // Get user's reports
  const userReports = await Report.find({ reportedBy: userId });
  
  // Filter out fake reports
  const genuineReports = userReports.filter(r => r.status !== 'Fake Report');
  const resolvedReports = userReports.filter(r => r.status === 'Resolved');
  const fakeReports = userReports.filter(r => r.status === 'Fake Report');
  const reportsWithPhotos = genuineReports.filter(r => 
    r.photo || (r.photos && r.photos.length > 0)
  );
  
  // Calculate accuracy based on resolved reports / total reports
  const accuracy = userReports.length > 0 
    ? Math.round((resolvedReports.length / userReports.length) * 100)
    : 0;
  
  return {
    points: user.points,
    level: user.level,
    genuineReports: genuineReports.length,
    resolvedReports: resolvedReports.length,
    fakeReports: fakeReports.length,
    reportsWithPhotos: reportsWithPhotos.length,
    accuracy: accuracy
  };
}

async function unlockAchievementsForUser(userId) {
  try {
    console.log(`🔄 Processing achievements for user ${userId}...`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return null;
    }
    
    if (user.role !== 'citizen') {
      console.log(`❌ User ${user.name} is not a citizen, skipping achievements`);
      return null;
    }
    
    // Calculate user stats
    const stats = await calculateUserStats(userId);
    if (!stats) {
      console.log(`❌ Could not calculate stats for user ${user.name}`);
      return null;
    }
    
    console.log(`📊 Stats for ${user.name}:`, stats);
    
    // Get current achievements
    const currentAchievements = user.achievements.map(a => a.name);
    console.log(`🏆 Current achievements:`, currentAchievements);
    
    // Check which achievements should be unlocked
    const achievementsToUnlock = [];
    
    for (const achievement of ACHIEVEMENTS) {
      const isUnlocked = achievement.condition(stats);
      const alreadyEarned = currentAchievements.includes(achievement.name);
      
      if (isUnlocked && !alreadyEarned) {
        achievementsToUnlock.push(achievement);
      }
    }
    
    if (achievementsToUnlock.length === 0) {
      console.log(`✅ No new achievements to unlock for ${user.name}`);
      return {
        userId: user._id,
        userName: user.name,
        newAchievements: [],
        totalAchievements: currentAchievements.length
      };
    }
    
    // Add new achievements to user
    for (const achievement of achievementsToUnlock) {
      user.achievements.push({ 
        name: achievement.name,
        earnedAt: new Date()
      });
      console.log(`🎉 Unlocked achievement: ${achievement.name}`);
    }
    
    await user.save();
    
    console.log(`✅ Successfully unlocked ${achievementsToUnlock.length} achievements for ${user.name}`);
    
    return {
      userId: user._id,
      userName: user.name,
      newAchievements: achievementsToUnlock.map(a => a.name),
      totalAchievements: user.achievements.length
    };
    
  } catch (error) {
    console.error(`❌ Error processing achievements for user ${userId}:`, error);
    throw error;
  }
}

async function unlockAchievementsForAllUsers() {
  try {
    console.log('🚀 Starting achievement unlock process...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Get all citizen users
    const users = await User.find({ role: 'citizen' });
    console.log(`📊 Found ${users.length} citizen users to process`);
    
    let totalNewAchievements = 0;
    const results = [];
    
    for (const user of users) {
      const result = await unlockAchievementsForUser(user._id);
      if (result) {
        results.push(result);
        totalNewAchievements += result.newAchievements.length;
      }
    }
    
    console.log('🎉 Achievement unlock process completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${results.length}`);
    console.log(`   - Total new achievements unlocked: ${totalNewAchievements}`);
    
    // Show detailed results
    results.forEach(result => {
      if (result.newAchievements.length > 0) {
        console.log(`   - ${result.userName}: ${result.newAchievements.join(', ')}`);
      }
    });
    
    return {
      success: true,
      usersProcessed: results.length,
      totalNewAchievements,
      results
    };
    
  } catch (error) {
    console.error('❌ Error in achievement unlock process:', error);
    throw error;
  }
}

async function main() {
  try {
    const result = await unlockAchievementsForAllUsers();
    console.log('🎉 Process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Process failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
