# Task: Modify API calls for delivery notifications and fix login page reload

## Information Gathered:
- DeliveryDashboard.js fetches available pickups on online toggle and listens for 'pickup-admin-approved' socket events for 'awaiting_agent' notifications. Need periodic polling to ensure notifications.
- Login.js switchRole shows splash and clears data, but lacks page reload. Need to add DevSettings.reload().
- apiService.js provides pickupAPI.getAvailablePickups().

## Plan:
1. **Update DeliveryDashboard.js for periodic polling** ✅
   - Added pollingIntervalRef useRef.
   - Added useEffect with setInterval to poll pickupAPI.getAvailablePickups() every 30 seconds when isOnline.
   - For new 'awaiting_agent' pickups, create notifications and show Alerts.

2. **Update Login.js for page reload** ✅
   - Imported DevSettings from 'react-native'.
   - In switchRole, after clearing data, called DevSettings.reload().

## Dependent Files to be Edited:
- frontend/pages/DeliveryDashboard.js
- frontend/pages/Login.js

## Followup Steps:
- Test periodic polling in DeliveryDashboard for notifications.
- Test role switch in Login for splash, data clearing, and reload.
