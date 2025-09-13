from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User

# Create your models here.

class Tag(models.Model):
    name = models.CharField(max_length=49, unique=True)
    
    def __str__(self):
        return self.name

class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=99)
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=15)
    tag = models.ManyToManyField(Tag, related_name='contacts', blank=True)
    image = models.ImageField(upload_to='contact_image/%Y/%m/', blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        return f"{self.user.username} adds contact - {self.name}"
