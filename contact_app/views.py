from django.shortcuts import render
from django.views.generic import ListView, CreateView, UpdateView, DeleteView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.db.models import Q
from django.http import JsonResponse
from django.core.paginator import Paginator
import csv, io
from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.views.decorators.http import require_http_methods

from .models import *
from .forms import *

# Create your views here.

class HomeView(LoginRequiredMixin, ListView):
    model = Contact
    template_name = "contact/home.html"
    context_object_name = "contacts"

    def get_queryset(self):
        return Contact.objects.filter(user=self.request.user)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["tags"] = Tag.objects.all()

        # Convert queryset to JSON-serializable list
        ctx["contacts_json"] = [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone_number,
                "address": c.address,
                "note": c.note,
                "avatar": c.image.url if c.image else None,
                "tags": [t.name for t in c.tag.all()],
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for c in ctx["contacts"]
        ]
        return ctx

@csrf_exempt
@login_required
@require_POST
def create_contact_ajax(request):
    form = ContactForm(request.POST, request.FILES)
    if form.is_valid():
        contact = form.save(commit=False)
        contact.user = request.user
        contact.save()

        # handle tags (comma-separated string)
        tags = request.POST.get("tags", "")
        for t in [x.strip() for x in tags.split(",") if x.strip()]:
            tag_obj, _ = Tag.objects.get_or_create(name=t)
            contact.tag.add(tag_obj)

        return JsonResponse({
            "success": True,
            "contact": {
                "id": contact.id,
                "name": contact.name,
                "email": contact.email,
                "phone": contact.phone_number,
                "address": contact.address,
                "note": contact.note,
                "avatar": contact.image.url if contact.image else None,
                "tags": [t.name for t in contact.tag.all()],
            }
        })
    else:
        return JsonResponse({"success": False, "errors": form.errors}, status=400)

@login_required
def import_contacts(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]

        if not csv_file.name.endswith('.csv'):
            messages.error(request, "Only CSV files are allowed.")
            return redirect("home")

        try:
            data_set = csv_file.read().decode("UTF-8")
            io_string = io.StringIO(data_set)
            reader = csv.DictReader(io_string)

            count = 0
            for row in reader:
                name = row.get("name") or row.get("Name") or row.get("fullname") or row.get("full_name") or row.get("Full Name") or "No name"
                email = row.get("email") or row.get("Email") or ""
                phone = row.get("phone") or row.get("Phone") or row.get("phone_number") or row.get("Phone Number") or "No Number"
                tags = (row.get("tags") or "").split(";")
                address = row.get("address") or row.get("Address") or ""
                note = row.get("note") or row.get("notes", "")

                contact = Contact.objects.create(
                    user=request.user,
                    name=name,
                    email=email,
                    phone_number=phone,
                    address=address,
                    note=note,   # match model field
                )
                for t in tags:
                    if t.strip():
                        tag_obj, _ = Tag.objects.get_or_create(name=t.strip())
                        contact.tag.add(tag_obj)
                count += 1

            messages.success(request, f"{count} contacts imported successfully!")
        except Exception as e:
            messages.error(request, f"Import failed: {str(e)}")

        return redirect("home")
    else:
        messages.error(request, "No file uploaded.")
        return redirect("home")

@login_required
def contact_list_api(request):
    qs = Contact.objects.filter(user=request.user)

    # if "id" is provided, return single contact
    cid = request.GET.get("id")
    if cid:
        try:
            c = qs.get(pk=cid)
        except Contact.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        return JsonResponse({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone_number,
            "address": c.address,
            "note": c.note,
            "avatar": c.image.url if c.image else None,
            "tags": [t.name for t in c.tag.all()],
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    # search query
    q = request.GET.get("q", "").strip()
    if q:
        qs = qs.filter(
            Q(name__icontains=q) |
            Q(email__icontains=q) |
            Q(phone_number__icontains=q) |
            Q(tag__name__icontains=q)
        ).distinct()

    # tag filter
    tag = request.GET.get("tag")
    if tag:
        qs = qs.filter(tag__name=tag)

    # sorting
    sort_by = request.GET.get("sortBy", "name")
    sort_dir = request.GET.get("sortDir", "asc")
    if sort_dir == "desc":
        sort_by = "-" + sort_by
    qs = qs.order_by(sort_by)

    # pagination
    per_page = int(request.GET.get("perPage", 10))
    page = int(request.GET.get("page", 1))
    paginator = Paginator(qs, per_page)
    contacts_page = paginator.get_page(page)

    data = []
    for c in contacts_page:
        data.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone_number,
            "address": c.address,
            "avatar": c.image.url if c.image else None,
            "tags": [t.name for t in c.tag.all()],
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    return JsonResponse({
        "results": data,
        "total": paginator.count,
        "page": page,
        "pages": paginator.num_pages,
    })

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_contact_ajax(request, pk):
    try:
        contact = Contact.objects.get(pk=pk, user=request.user)
    except Contact.DoesNotExist:
        return JsonResponse({"success": False, "error": "Not found"}, status=404)

    form = ContactForm(request.POST, request.FILES, instance=contact)
    if form.is_valid():
        updated = form.save()

        # tags
        tags = request.POST.get("tags", "")
        contact.tag.clear()
        for t in [x.strip() for x in tags.split(",") if x.strip()]:
            tag_obj, _ = Tag.objects.get_or_create(name=t)
            contact.tag.add(tag_obj)
            
        return JsonResponse({
            "success": True,
            "contact": {
                "id": updated.id,
                "name": updated.name,
                "email": updated.email,
                "phone": updated.phone_number,
                "address": updated.address,
                "note": contact.note,
                "avatar": updated.image.url if updated.image else None,
                "tags": [t.name for t in updated.tag.all()],
            }
        })
    return JsonResponse({"success": False, "errors": form.errors}, status=400)

@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def delete_contact_ajax(request, pk):
    try:
        contact = Contact.objects.get(pk=pk, user=request.user)
        contact.delete()
        return JsonResponse({"success": True})
    except Contact.DoesNotExist:
        return JsonResponse({"success": False, "error": "Not found"}, status=404)
