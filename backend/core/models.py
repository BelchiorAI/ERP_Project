from django.db import models
from django.contrib.auth.models import AbstractUser

class RoleChoices(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    MANAGER = 'manager', 'Manager'
    EMPLOYEE = 'employee', 'Employee'

class EmploymentStatusChoices(models.TextChoices):
    ACTIVE = 'active', 'Active'
    ON_LEAVE = 'on_leave', 'On Leave'
    TERMINATED = 'terminated', 'Terminated'

class LeaveTypeChoices(models.TextChoices):
    SICK = 'sick', 'Sick'
    VACATION = 'vacation', 'Vacation'
    PERSONAL = 'personal', 'Personal'

class RequestStatusChoices(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'

class Employee(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    job_title = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    hire_date = models.DateField(null=True, blank=True)
    employment_status = models.CharField(max_length=20, choices=EmploymentStatusChoices.choices, default=EmploymentStatusChoices.ACTIVE)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.EMPLOYEE)
    can_create_users = models.BooleanField(default=False)
    can_manage_all_records = models.BooleanField(default=False)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_admin(self):
        return self.role == RoleChoices.ADMIN
    
    @property
    def is_manager(self):
        return self.role == RoleChoices.MANAGER

class Timesheet(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='timesheets')
    work_date = models.DateField()
    clock_in = models.TimeField()
    clock_out = models.TimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    task_description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=RequestStatusChoices.choices, default=RequestStatusChoices.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['employee', 'work_date'], name='unique_timesheet_per_day')
        ]

class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LeaveTypeChoices.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=RequestStatusChoices.choices, default=RequestStatusChoices.PENDING)
    manager_notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(end_date__gte=models.F('start_date')), name='end_date_gte_start_date')
        ]
