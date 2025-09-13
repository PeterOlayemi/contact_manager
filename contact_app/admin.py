from django.contrib import admin
from .models import *

# Register your models here.

admin.site.site_header = "Contact Manager Admin"
admin.site.site_title = "Contact Manager Admin Portal"
admin.site.index_title = "Welcome to Contact Manager Admin Portal"

admin.site.register(Tag)
admin.site.register(Contact)
