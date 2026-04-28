# UAT Test Plan - SANNIDH Platform

## Test Scenarios (30 Core Tests)

### Authentication (6 tests)
1. ✅ Sign up as Company Owner
2. ✅ Sign up as External CA  
3. ✅ Login with valid credentials
4. ✅ Login fails with wrong password
5. ✅ Password reset flow works
6. ✅ Multi-role: Same email, different personas

### Dashboards (6 tests)
7. ✅ Company Owner dashboard loads
8. ✅ External CA dashboard loads
9. ✅ CA Firm dashboard loads
10. ✅ In-House CA dashboard loads
11. ✅ Lawyer dashboard loads
12. ✅ Admin dashboard loads

### Core Features (6 tests)
13. ✅ AI Drafting Engine generates document
14. ✅ Compliance Chatbot responds
15. ✅ Document upload works
16. ✅ Task creation works
17. ✅ Deadline tracking visible
18. ✅ Notifications display

### UI/UX (6 tests)
19. ✅ Dark mode toggle works
20. ✅ Mobile responsive (phone)
21. ✅ Tablet responsive
22. ✅ Desktop layout correct
23. ✅ Forms validate input
24. ✅ Error messages clear

### Security (3 tests)
25. ✅ HTTPS enforced
26. ✅ Rate limiting works
27. ✅ Session timeout works

### Performance (3 tests)
28. ✅ Page loads < 3 seconds
29. ✅ Dashboard interactive < 5 seconds
30. ✅ No console errors

---

## Beta User Roles Needed

- 2x Company Owners
- 2x External CAs
- 2x CA Firms
- 1x In-House CA
- 1x Lawyer
- 1x Admin

Total: 9 users

---

## Test Results Template

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Sign up Company Owner | ⏳ | |
| 2 | Sign up External CA | ⏳ | |
| ... | ... | ... | |

Status: ✅ Pass | ❌ Fail | ⏳ Pending

---

## Bug Severity

- **Critical**: Blocks usage (P0)
- **High**: Major feature broken (P1)
- **Medium**: Minor issue (P2)
- **Low**: Cosmetic (P3)

