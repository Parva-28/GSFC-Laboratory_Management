from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, InventoryMaster, InventoryInward, InventoryRequest, InventoryApproval, TankerArrival, TankerHistory, LabData, AuthToken

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(InventoryMaster)
admin.site.register(InventoryInward)
admin.site.register(InventoryRequest)
admin.site.register(InventoryApproval)
admin.site.register(TankerArrival)
admin.site.register(TankerHistory)
admin.site.register(LabData)
admin.site.register(AuthToken)
