from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, TimesheetViewSet, LeaveRequestViewSet, ThrottledTokenObtainPairView

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'timesheets', TimesheetViewSet, basename='timesheet')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leaverequest')

urlpatterns = [
    path('', include(router.urls)),
    path('api/token/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
]