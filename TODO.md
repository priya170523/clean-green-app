# Updated Task: Fix Issues from Feedback - Levels, Stats, Navigation, and Route

## Backend Model Updates
- [x] Update backend/models/Transaction.js: Add 'bottles' to wasteDetails.type enum (current: ['plastic', 'paper', 'organic', 'metal', 'glass', 'mixed'] → add 'bottles').
- [x] Update backend/models/User.js: Add currentLevel: {type: Number, default: 1}; Add getLevel(totalPoints) method to compute level based on thresholds (0-200:1, 201-400:2, 401-800:3, 801-1600:4, 1601-3200:5, etc. doubling).
- [x] Update backend/models/Reward.js: Add 'level_up' to type enum to fix validation error.

## Backend Route Updates
- [x] Update backend/routes/users.js: In /dashboard, calculate and add to stats: totalSubmissions (completedPickups count), totalWaste (sum actualWeight from completed pickups), currentLevel (user.getLevel(user.totalPoints)).
- [x] Update backend/routes/pickups.js: In complete pickup handler, after adding points: check if level up (newLevel = user.getLevel(user.totalPoints)), if newLevel > user.currentLevel, set currentLevel = newLevel, create Reward (coupon for level up), set wheelSpunThisCycle = false to activate spin.
- [x] Update backend/routes/progress.js: Update spin eligibility to check !user.wheelSpunThisCycle (activates after successful submission), and perhaps totalPickups > 0.
- [x] Update backend/routes/progress.js: Add level up coupon creation when user levels up (₹10 per level, 30 days expiry).
- [x] Fix Reward.create calls in progress.js and pickups.js to include all required fields (partner, discount, expiryDate).

## Frontend Updates
- [x] Update frontend/pages/Dashboard.js: Use stats.totalSubmissions for "Number of Submissions", stats.totalWaste for "Total Waste Submitted", add currentLevel display (e.g., "Level {stats.currentLevel}").
- [x] Update frontend/pages/Rewards.js: Remove cycleProgress logic, use spinAvailable from API, remove waste progress section, keep level progress section, update level display to use currentLevel from API.
- [x] Update frontend/navigation/AppNavigator.js: Ensure all stack screens have headerLeft: ({navigation}) => <TouchableOpacity onPress={() => navigation.goBack()}><Text>Back</Text></TouchableOpacity> or similar for pages without back button.
- [x] Update frontend/pages/DeliveryRoutePage.js: Fix route navigation: Ensure it shows directions from delivery agent current location to correct user pickup address (verify pickup.user address, not another location; use mapsService for directions).

## Testing & Verification
- [ ] Test submission flow: Create pickup with 'bottles' type, complete it, verify no validation error, stats update (submissions +1, waste +kg, points added), level up if threshold crossed (coupon created), spin activated (wheelSpunThisCycle=false).
- [ ] Test dashboard: Verify totalSubmissions, totalWaste, currentLevel display correctly.
- [ ] Test navigation: Check back buttons in WasteUploadNew.js, AfterScheduling.js, DeliveryRoutePage.js, etc.
- [ ] Test route page: In DeliveryRoutePage, confirm navigation from agent location to correct user address.
- [ ] Test rewards page: Verify spin available after every submission, level up coupons created and displayed.
- [ ] Final verification: Run app, test full user flow (submit → schedule → complete → spin → rewards).

Progress: Fixed Reward model validation error by adding 'level_up' to enum and ensuring all required fields are provided in Reward.create calls.
