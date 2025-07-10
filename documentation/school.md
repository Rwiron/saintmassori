🎓 Montessori School Management System API (Phase 1: Admin & Student Focus)
🎯 Goal
Build an API to manage the academic workflow and student billing system for a Montessori school. In this phase, the system supports:

Academic setup and student promotion

Class and tariff assignment

Student billing based on tariffs

👥 Roles
1. Admin
The administrator can:

Manage academic years and terms

Create grades and classes (e.g. P1A, P2B)

Assign students to classes

Promote students to the next class

Close academic years

Define tariffs per class/grade

Bill students according to assigned tariffs

2. Student
A student is:

Assigned to a class

Associated with a tariff via their class

Promoted at end of academic year

Billed automatically based on their class tariff

📚 Core Modules
1. Academic Management
Feature	Description
Create Academic Year	E.g. 2025-2026
Add Terms	First Term, Second Term, Third Term
Close Academic Year	Once all terms are completed
Promote Students	After academic year is closed

2. Grade & Class Setup
Feature	Description
Create Grades	E.g. P1, P2, P3
Create Class Sections	E.g. P1A, P1B tied to P1
Assign Students	Link students to specific class

3. Student Management
Feature	Description
Register Students	Capture student info
Assign to Class	Based on grade/class
Promote Student	Move student to next grade/class

4. Tariff & Billing
Feature	Description
Create Tariff	E.g. Tuition, Activity Fees
Assign Tariff to Class	One class = one tariff
Bill Student	System calculates bill based on class’s tariff
Track Payments (future)	Optional next phase