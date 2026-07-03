from rest_framework import serializers
from .models import Employee, Timesheet, LeaveRequest


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'job_title', 'department', 'hire_date',
            'employment_status', 'role', 'manager', 'password', 'can_create_users',
            'can_manage_all_records',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', 'password123')
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class EmployeeSummarySerializer(serializers.ModelSerializer):
    """Lightweight nested representation used inside Timesheet/LeaveRequest."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class TimesheetSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        default=serializers.CurrentUserDefault()
    )
    employee_detail = EmployeeSummarySerializer(source='employee', read_only=True)

    class Meta:
        model = Timesheet
        fields = [
            'id', 'employee', 'employee_detail',
            'work_date', 'clock_in', 'clock_out',
            'hours_worked', 'task_description', 'status', 'created_at',
        ]
        read_only_fields = ['created_at', 'hours_worked']


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        default=serializers.CurrentUserDefault()
    )
    employee_detail = EmployeeSummarySerializer(source='employee', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_detail',
            'leave_type', 'start_date', 'end_date',
            'reason', 'status', 'requested_at', 'decided_at', 'manager_notes'
        ]
        read_only_fields = ['requested_at']
