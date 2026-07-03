from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Employee, Timesheet, LeaveRequest, RoleChoices
from .serializers import EmployeeSerializer, TimesheetSerializer, LeaveRequestSerializer
from .permissions import IsAdminOrManager, IsOwnerOrAdminOrManager, CanCreateUserPermission, IsManagerOnly
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import ScopedRateThrottle
from django.utils import timezone
from datetime import datetime
import csv
from django.http import HttpResponse

class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == RoleChoices.ADMIN)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [CanCreateUserPermission]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == RoleChoices.MANAGER:
            serializer.save(role=RoleChoices.EMPLOYEE, manager=user)
        else:
            serializer.save()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Employee.objects.none()
            
        if user.role in (RoleChoices.ADMIN, RoleChoices.MANAGER):
            return Employee.objects.all()
        else:
            return Employee.objects.filter(id=user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RoleBasedQuerySetMixin:
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()

        if user.role in (RoleChoices.ADMIN, RoleChoices.MANAGER):
            return self.queryset
        else:
            return self.queryset.filter(employee=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == RoleChoices.EMPLOYEE:
            serializer.validated_data.pop('status', None)
            serializer.save(employee=user)
        else:
            employee = serializer.validated_data.get('employee', user)
            serializer.save(employee=employee)
            
    def perform_update(self, serializer):
        user = self.request.user
        if user.role == RoleChoices.EMPLOYEE:
            serializer.validated_data.pop('status', None)
            serializer.validated_data.pop('decided_at', None)
            serializer.validated_data.pop('manager_notes', None)
        serializer.save()

class TimesheetViewSet(RoleBasedQuerySetMixin, viewsets.ModelViewSet):
    queryset = Timesheet.objects.all()
    serializer_class = TimesheetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrManager]

    def get_permissions(self):
        # list & create only need to be authenticated (RoleBasedQuerySetMixin handles filtering).
        # retrieve/update/destroy need object-level check.
        if self.action == 'monthly_report':
            return [permissions.IsAuthenticated(), IsManagerOnly()]
        if self.action in ['list', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdminOrManager()]

    def _calc_hours(self, serializer):
        clock_in = serializer.validated_data.get('clock_in', getattr(serializer.instance, 'clock_in', None))
        clock_out = serializer.validated_data.get('clock_out', getattr(serializer.instance, 'clock_out', None))
        if clock_in and clock_out:
            diff = datetime.combine(datetime.today(), clock_out) - datetime.combine(datetime.today(), clock_in)
            hours = diff.total_seconds() / 3600
            serializer.validated_data['hours_worked'] = round(hours, 2)

    def perform_create(self, serializer):
        self._calc_hours(serializer)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._calc_hours(serializer)
        super().perform_update(serializer)

    @action(detail=False, methods=['get'], url_path='monthly-report', permission_classes=[permissions.IsAuthenticated, IsManagerOnly])
    def monthly_report(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        if not year or not month:
            return Response({"detail": "year and month query parameters are required."}, status=400)
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response({"detail": "year and month must be integers."}, status=400)
            
        timesheets = Timesheet.objects.filter(
            work_date__year=year,
            work_date__month=month
        )
        
        employee_id = request.query_params.get('employee_id')
        if employee_id:
            try:
                timesheets = timesheets.filter(employee_id=int(employee_id))
            except ValueError:
                return Response({"detail": "employee_id must be an integer."}, status=400)
        
        timesheets = timesheets.order_by('work_date', 'employee__last_name', 'employee__first_name')
        
        format_type = request.query_params.get('export', 'json')
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="timesheet-report-{year}-{month:02d}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Employee ID', 'Username', 'Employee Name', 'Work Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Task Description', 'Status'])
            
            for t in timesheets:
                full_name = f"{t.employee.first_name} {t.employee.last_name}".strip() or t.employee.username
                writer.writerow([
                    t.employee.id,
                    t.employee.username,
                    full_name,
                    t.work_date.strftime('%Y-%m-%d'),
                    t.clock_in.strftime('%H:%M') if t.clock_in else '',
                    t.clock_out.strftime('%H:%M') if t.clock_out else '',
                    t.hours_worked if t.hours_worked is not None else '',
                    t.task_description,
                    t.status
                ])
            return response
            
        serializer = self.get_serializer(timesheets, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(RoleBasedQuerySetMixin, viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrManager]

    def get_permissions(self):
        if self.action in ['list', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdminOrManager()]

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != RoleChoices.EMPLOYEE:
            status = serializer.validated_data.get('status')
            if status in ['approved', 'rejected']:
                serializer.validated_data['decided_at'] = timezone.now()
        super().perform_update(serializer)
