# Fix Registration Login Bug & Habit Sharing

## Status: In Progress

### Steps:
- [x] 1. Analyze project files and identify root causes (search_files + read_files)
- [x] 2. Read js/landingscript.js to confirm frontend flow
- [x] 3. Edit api/register.php: After successful INSERT, set $_SESSION['user_id'] and $_SESSION['firstname'] (auto-login) 
- [ ] 4. Test new registration: Shows success -> redirects to dashboard.php -> correct user name, phpUserId matches, empty habits list
- [ ] 5. Test habit creation: Habits owned by correct user_id, not visible in other accounts
- [ ] 6. Test multiple accounts: Register/login different users -> isolated habits
- [x] 7. Add logout button/link in dashboard/navbar
- [ ] 8. Verify no localStorage auth pollution

**Expected Result:** Register auto-logs in (correct session), each user sees only own habits.

**Next:** Test the fixes (steps 4-8 manual).

