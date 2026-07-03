from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Employee, Timesheet, LeaveRequest


@admin.register(Employee)
class EmployeeAdmin(UserAdmin):
    # Override fieldsets completely to avoid UserAdmin's assumptions about fields
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Job Details', {'fields': ('job_title', 'department', 'hire_date', 'employment_status', 'role', 'manager')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2',
                       'phone_number', 'job_title', 'department', 'hire_date',
                       'employment_status', 'role', 'manager'),
        }),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'job_title', 'department', 'role', 'employment_status', 'is_active')
    list_filter = ('role', 'employment_status', 'department', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'department', 'job_title')
    ordering = ('username',)


@admin.register(Timesheet)
class TimesheetAdmin(admin.ModelAdmin):
    list_display = ('employee', 'work_date', 'clock_in', 'clock_out', 'hours_worked', 'status')
    list_filter = ('status',)
    search_fields = ('employee__username', 'employee__email', 'task_description')
    ordering = ('-work_date',)


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status', 'requested_at')
    list_filter = ('status', 'leave_type')
    search_fields = ('employee__username', 'employee__email', 'reason')
    ordering = ('-requested_at',)
