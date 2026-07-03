"""
Populate script for the ERP database — ~50 employees, flat org structure.
Matches models.py exactly (AbstractUser-based Employee, top-level *Choices classes).

Run with:
    python3 manage.py shell -c "exec(open('populate_data_large.py').read())"
"""

import os
import django
import random
from datetime import date, time, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_api.settings')
django.setup()

from core.models import (
    Employee, Timesheet, LeaveRequest,
    RoleChoices, EmploymentStatusChoices, LeaveTypeChoices, RequestStatusChoices,
)

print("Clearing existing non-superuser data...")
Timesheet.objects.all().delete()
LeaveRequest.objects.all().delete()
Employee.objects.filter(is_superuser=False).delete()

FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
    "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nadia", "Oscar", "Priya",
    "Quentin", "Rachel", "Samuel", "Tara", "Umar", "Victoria", "William", "Xena",
    "Yusuf", "Zara", "Adam", "Beth", "Caleb", "Daniela", "Elijah", "Faith",
    "Gabriel", "Holly", "Isaac", "Jasmine", "Kyle", "Liam", "Megan", "Noah",
    "Olivia", "Paul", "Queenie", "Ryan", "Sophia", "Thomas", "Uma", "Vincent",
    "Wendy", "Xander",
]
LAST_NAMES = [
    "Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
    "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
    "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee",
    "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green",
    "Baker", "Adams", "Nelson", "Carter", "Mitchell", "Perez", "Roberts",
    "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
    "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook",
]

DEPARTMENTS = ["Engineering", "QA", "HR", "Sales", "Marketing", "Finance", "IT Support", "Operations"]
JOB_TITLES_BY_DEPT = {
    "Engineering": ["Software Engineer", "Senior Software Engineer", "DevOps Engineer", "Backend Developer", "Frontend Developer"],
    "QA": ["QA Engineer", "QA Analyst", "Test Automation Engineer"],
    "HR": ["HR Generalist", "Recruiter", "HR Coordinator"],
    "Sales": ["Sales Representative", "Account Executive", "Sales Coordinator"],
    "Marketing": ["Marketing Specialist", "Content Strategist", "Social Media Manager"],
    "Finance": ["Financial Analyst", "Accountant", "Payroll Administrator"],
    "IT Support": ["IT Support Technician", "Systems Administrator", "Helpdesk Analyst"],
    "Operations": ["Operations Coordinator", "Project Coordinator", "Office Manager"],
}

LEAVE_TYPES = [LeaveTypeChoices.SICK, LeaveTypeChoices.VACATION, LeaveTypeChoices.PERSONAL]
STATUSES = [RequestStatusChoices.PENDING, RequestStatusChoices.APPROVED, RequestStatusChoices.REJECTED]

random.seed(42)  # reproducible output

print("Creating managers...")

manager1 = Employee(
    username="alice_manager",
    email="alice@example.com",
    first_name="Alice",
    last_name="Smith",
    job_title="Engineering Manager",
    department="Engineering",
    hire_date=date(2021, 2, 1),
    employment_status=EmploymentStatusChoices.ACTIVE,
    role=RoleChoices.MANAGER,
)
manager1.set_password("password123")
manager1.save()

manager2 = Employee(
    username="bob_manager",
    email="bob@example.com",
    first_name="Bob",
    last_name="Johnson",
    job_title="Operations Manager",
    department="Operations",
    hire_date=date(2021, 5, 10),
    employment_status=EmploymentStatusChoices.ACTIVE,
    role=RoleChoices.MANAGER,
)
manager2.set_password("password123")
manager2.save()

managers = [manager1, manager2]

print("Creating ~48 employees...")

used_names = set()
employees = list(managers)

target_count = 50
while len(employees) < target_count:
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    key = (first, last)
    if key in used_names:
        continue
    used_names.add(key)

    department = random.choice(DEPARTMENTS)
    job_title = random.choice(JOB_TITLES_BY_DEPT[department])
    username = f"{first.lower()}_{last.lower()}"
    email = f"{first.lower()}.{last.lower()}@example.com"

    hire_date = date(2022, 1, 1) + timedelta(days=random.randint(0, 1400))
    employment_status = random.choices(
        [EmploymentStatusChoices.ACTIVE, EmploymentStatusChoices.ON_LEAVE, EmploymentStatusChoices.TERMINATED],
        weights=[0.85, 0.10, 0.05],
    )[0]

    # Flat structure: everyone reports to one of the two managers, no deeper hierarchy
    manager = random.choice(managers)

    emp = Employee(
        username=username,
        email=email,
        first_name=first,
        last_name=last,
        job_title=job_title,
        department=department,
        hire_date=hire_date,
        employment_status=employment_status,
        role=RoleChoices.EMPLOYEE,
        manager=manager,
    )
    emp.set_password("password123")
    emp.save()
    employees.append(emp)

print(f"Created {len(employees)} total employees (incl. {len(managers)} managers).")

print("Creating timesheets (last 10 workdays per active employee)...")

active_employees = [e for e in employees if e.employment_status == EmploymentStatusChoices.ACTIVE]
today = date(2026, 6, 24)

timesheet_count = 0
for emp in active_employees:
    work_day = today
    days_added = 0
    while days_added < 10:
        if work_day.weekday() < 5:  # skip weekends
            clock_in_hour = random.choice([8, 9])
            clock_in_minute = random.choice([0, 15, 30])
            hours = round(random.uniform(7.0, 9.0), 2)
            Timesheet.objects.create(
                employee=emp,
                work_date=work_day,
                clock_in=time(clock_in_hour, clock_in_minute),
                clock_out=time((clock_in_hour + int(hours)) % 24, clock_in_minute),
                hours_worked=Decimal(str(hours)),
                task_description=random.choice([
                    "Worked on assigned tasks", "Attended team meetings",
                    "Code review and bug fixes", "Client follow-ups",
                    "Documentation and reporting", "Sprint planning",
                ]),
                status=random.choices(STATUSES, weights=[0.2, 0.7, 0.1])[0],
            )
            timesheet_count += 1
            days_added += 1
        work_day -= timedelta(days=1)

print(f"Created {timesheet_count} timesheet entries.")

print("Creating leave requests (1-2 per employee, ~70% of employees)...")

leave_count = 0
for emp in employees:
    if random.random() > 0.7:
        continue
    num_requests = random.choice([1, 1, 2])
    for _ in range(num_requests):
        start = today + timedelta(days=random.randint(-30, 60))
        duration = random.randint(1, 7)
        end = start + timedelta(days=duration - 1)
        status = random.choices(STATUSES, weights=[0.3, 0.6, 0.1])[0]
        LeaveRequest.objects.create(
            employee=emp,
            leave_type=random.choice(LEAVE_TYPES),
            start_date=start,
            end_date=end,
            reason=random.choice([
                "Personal time off", "Family commitment", "Feeling unwell",
                "Annual vacation", "Medical appointment", "Rest and recovery",
            ]),
            status=status,
        )
        leave_count += 1

print(f"Created {leave_count} leave requests.")
print("Database populated successfully!")