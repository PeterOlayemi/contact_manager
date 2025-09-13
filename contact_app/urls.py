from django.urls import path
from .views import *

urlpatterns = [
    path('', HomeView.as_view(), name="home"),
    path("import/", import_contacts, name="import_contacts"),
    path("create-contact/", create_contact_ajax, name="create_contact_ajax"),
    path("contacts/api/", contact_list_api, name="contact_list_api"),
    path("contacts/<int:pk>/update-ajax/", update_contact_ajax, name="update_contact_ajax"),
    path("contacts/<int:pk>/delete-ajax/", delete_contact_ajax, name="delete_contact_ajax"),
]
