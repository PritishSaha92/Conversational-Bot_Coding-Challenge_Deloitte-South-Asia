from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('company_id', 'role', 'post', 'phone', 'department', 'profile_pic', 'avg_work_hours')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('company_id', 'role', 'post', 'phone', 'department', 'profile_pic', 'avg_work_hours')}),
    )
    list_display = ['username', 'email', 'company_id', 'role', 'avg_work_hours', 'is_staff']
    search_fields = ['username', 'email', 'company_id']

admin.site.register(CustomUser, CustomUserAdmin)
