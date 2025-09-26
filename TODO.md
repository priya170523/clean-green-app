# TODO List for Dashboard Graph Update

## Backend Changes
- [x] Add new API endpoint `/users/total-waste-stats` in `backend/routes/users.js` to fetch total pickups aggregated by day for the last 7 days.

## Frontend Changes
- [x] Add `getTotalWasteStats` function in `frontend/services/apiService.js`.
- [x] Modify `frontend/pages/Dashboard.js` to fetch total waste stats and update the LineChart to display "Waste Analysis Trend" with total pickups data.

## Testing
- [x] Test the new API endpoint.
- [x] Verify the dashboard displays the updated graph correctly.
