# Task: Implement Waste Management App Fixes

## Backend Changes
- [x] Update backend/models/User.js: Add cycleProgress (Number, default 0), wheelSpunThisCycle (Boolean, default false), firstPickupCouponUsed (Boolean, default false).
- [x] Update backend/utils/pointsCalculator.js: User points 10-50 based on weight; delivery earnings 10-40 rupees.
- [ ] Update backend/routes/progress.js: Fix totalWaste sum from transactions; add cycleProgress logic; reset on spin; first coupon flag.
- [ ] Update backend/routes/pickups.js: On complete, create transaction with 10-50 points, set first coupon if applicable.
- [ ] Update backend/routes/deliveries.js: On complete, add 10-40 rupees to earnings.

## Frontend Dependencies & Assets
- [ ] Install @react-native-community/datetimepicker: cd frontend && npx expo install @react-native-community/datetimepicker.
- [ ] Create frontend/assets/spin-wheel.png: Save provided wheel image.

## Frontend Changes - Core User Flow
- [ ] Update frontend/components/SpinningWheel.js: Use new spin-wheel.png image.
- [ ] Update frontend/pages/Rewards.js: Remove levels/pointsCard; update spin logic with cycleProgress.
- [ ] Update frontend/pages/Profile.js: Remove "Your Stats" section.
- [ ] Update frontend/pages/Dashboard.js: Dynamic trend chart (points * weight); enhance history with item details.
- [ ] Update frontend/pages/WasteUploadNew.js: Add DateTimePicker for scheduling date/time.
- [ ] Update frontend/pages/AfterScheduling.js: Auto-redirect to Dashboard after success; fix weight to kg.
- [ ] Update frontend/pages/ScheduledPage.js: Remove "scheduled" button; fix history details.

## Frontend Changes - Delivery Flow
- [ ] Update frontend/pages/DeliveryProfile.js: Remove "Your Stats" section.
- [ ] Update frontend/pages/DeliveryDashboard.js: Remove quick actions section.
- [ ] Update frontend/pages/DeliveryEarnings.js: Fix data retrieval.
- [ ] Update frontend/pages/WarehouseNavigation.js: Fix road navigation with directions API.

## Services & Testing
- [ ] Update frontend/services/apiService.js: Add/update progress API calls.
- [ ] Test all changes: Submit waste, check tracking/spin/redirect/points/history; delivery earnings/navigation.
- [ ] Final verification: Use browser_action for UI, execute_command for app run.

Progress: Starting with backend model update.
