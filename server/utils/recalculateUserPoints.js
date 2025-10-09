import User from '../models/User.js';
import Report from '../models/Report.js';

/**
 * Recalculate and update user points based on their actual report activity
 * This ensures points are only awarded for genuine reports
 */
export const recalculateAllUserPoints = async () => {
  try {
    console.log('🔄 Starting user points recalculation...');
    
    // Get all citizen users
    const users = await User.find({ role: 'citizen' });
    console.log(`📊 Found ${users.length} citizen users to recalculate`);
    
    let updatedCount = 0;
    let totalPointsRecalculated = 0;
    
    for (const user of users) {
      // Get user's reports
      const userReports = await Report.find({ reportedBy: user._id });
      
      // Filter out fake reports
      const genuineReports = userReports.filter(r => r.status !== 'Fake Report');
      const resolvedReports = userReports.filter(r => r.status === 'Resolved');
      const fakeReports = userReports.filter(r => r.status === 'Fake Report');
      
      // Calculate points based on genuine reports only
      let calculatedPoints = 0;
      
      // Base points for each genuine report (10 points)
      calculatedPoints += genuineReports.length * 10;
      
      // Bonus points for resolved reports (5 points)
      calculatedPoints += resolvedReports.length * 5;
      
      // Bonus points for reports with photos (2 points)
      const reportsWithPhotos = genuineReports.filter(r => 
        r.photo || (r.photos && r.photos.length > 0)
      );
      calculatedPoints += reportsWithPhotos.length * 2;
      
      // Update user points if different
      if (user.points !== calculatedPoints) {
        const oldPoints = user.points;
        user.points = calculatedPoints;
        
        // Update badge based on new points
        if (user.points >= 5000) user.badge = 'Diamond Reporter';
        else if (user.points >= 3000) user.badge = 'Gold Guardian';
        else if (user.points >= 1500) user.badge = 'Silver Scout';
        else if (user.points >= 500) user.badge = 'Bronze Hero';
        else if (user.points >= 100) user.badge = 'Rising Star';
        else user.badge = 'New Reporter';
        
        // Update level
        user.level = Math.floor(user.points / 250) + 1;
        
        await user.save();
        
        console.log(`✅ Updated user ${user.name} (${user._id}): ${oldPoints} → ${calculatedPoints} points`);
        console.log(`   Reports: ${userReports.length} total, ${genuineReports.length} genuine, ${resolvedReports.length} resolved, ${fakeReports.length} fake`);
        console.log(`   Badge: ${user.badge}, Level: ${user.level}`);
        
        updatedCount++;
        totalPointsRecalculated += Math.abs(calculatedPoints - oldPoints);
      }
    }
    
    console.log(`🎉 Points recalculation completed!`);
    console.log(`📊 Updated ${updatedCount} users`);
    console.log(`📊 Total points difference: ${totalPointsRecalculated}`);
    
    return {
      success: true,
      usersUpdated: updatedCount,
      totalUsers: users.length,
      totalPointsDifference: totalPointsRecalculated
    };
    
  } catch (error) {
    console.error('❌ Error recalculating user points:', error);
    throw error;
  }
};

/**
 * Recalculate points for a specific user
 */
export const recalculateUserPoints = async (userId) => {
  try {
    console.log(`🔄 Recalculating points for user ${userId}...`);
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role !== 'citizen') {
      throw new Error('Only citizen users have points');
    }
    
    // Get user's reports
    const userReports = await Report.find({ reportedBy: user._id });
    
    // Filter out fake reports
    const genuineReports = userReports.filter(r => r.status !== 'Fake Report');
    const resolvedReports = userReports.filter(r => r.status === 'Resolved');
    const fakeReports = userReports.filter(r => r.status === 'Fake Report');
    
    // Calculate points based on genuine reports only
    let calculatedPoints = 0;
    
    // Base points for each genuine report (10 points)
    calculatedPoints += genuineReports.length * 10;
    
    // Bonus points for resolved reports (5 points)
    calculatedPoints += resolvedReports.length * 5;
    
    // Bonus points for reports with photos (2 points)
    const reportsWithPhotos = genuineReports.filter(r => 
      r.photo || (r.photos && r.photos.length > 0)
    );
    calculatedPoints += reportsWithPhotos.length * 2;
    
    const oldPoints = user.points;
    user.points = calculatedPoints;
    
    // Update badge based on new points
    if (user.points >= 5000) user.badge = 'Diamond Reporter';
    else if (user.points >= 3000) user.badge = 'Gold Guardian';
    else if (user.points >= 1500) user.badge = 'Silver Scout';
    else if (user.points >= 500) user.badge = 'Bronze Hero';
    else if (user.points >= 100) user.badge = 'Rising Star';
    else user.badge = 'New Reporter';
    
    // Update level
    user.level = Math.floor(user.points / 250) + 1;
    
    await user.save();
    
    console.log(`✅ Updated user ${user.name}: ${oldPoints} → ${calculatedPoints} points`);
    console.log(`   Reports: ${userReports.length} total, ${genuineReports.length} genuine, ${resolvedReports.length} resolved, ${fakeReports.length} fake`);
    console.log(`   Badge: ${user.badge}, Level: ${user.level}`);
    
    return {
      success: true,
      userId: user._id,
      userName: user.name,
      oldPoints,
      newPoints: calculatedPoints,
      pointsDifference: calculatedPoints - oldPoints,
      reports: {
        total: userReports.length,
        genuine: genuineReports.length,
        resolved: resolvedReports.length,
        fake: fakeReports.length
      },
      badge: user.badge,
      level: user.level
    };
    
  } catch (error) {
    console.error(`❌ Error recalculating points for user ${userId}:`, error);
    throw error;
  }
};
