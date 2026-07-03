# pyrefly: ignore [missing-import]
from rest_framework import permissions
from .models import RoleChoices

class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (RoleChoices.ADMIN, RoleChoices.MANAGER)

class CanCreateUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == RoleChoices.ADMIN:
            return True
        if request.user.role == RoleChoices.MANAGER and request.user.can_create_users:
            return True
        return False

class IsOwnerOrAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == RoleChoices.ADMIN:
            return True
        if request.user.role == RoleChoices.MANAGER:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Determine the owner (Employee instance) of the object
        owner = obj if hasattr(obj, 'role') else getattr(obj, 'employee', None)
        
        if not owner:
            return False
        
        # User is owner
        if owner == request.user:
            return True
        
        # User is admin
        if request.user.role == RoleChoices.ADMIN:
            return True

        if request.user.role == RoleChoices.MANAGER:
            # Manager has been granted company-wide record access
            if request.user.can_manage_all_records:
                return True
            # User is manager and the object's owner reports to them
            if owner.manager == request.user:
                return True

        return False

class IsManagerOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == RoleChoices.MANAGER
        )
