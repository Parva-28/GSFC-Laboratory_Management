# Django Conversion Guide - LIMS UI to Django Templates

This guide provides detailed instructions for converting the React-based LIMS UI to Django templates.

## 🎯 Conversion Overview

The React application is structured to mirror Django's template organization. Each React component corresponds to one Django template file.

## 📋 Pre-Conversion Checklist

1. ✅ Review the current React component structure
2. ✅ Understand the data flow and mock data
3. ✅ Identify form submissions and state management
4. ✅ Plan Django models and views
5. ✅ Choose charting solution (Power BI, Chart.js, etc.)

## 🔄 Step-by-Step Conversion Process

### Step 1: Create Django Project Structure

```bash
django-admin startproject lims_project
cd lims_project
python manage.py startapp lims
```

### Step 2: Create Templates Directory

```
lims_project/
├── lims/
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/
│   │   │   └── login.html
│   │   ├── dashboard/
│   │   │   └── index.html
│   │   ├── labdata/
│   │   │   └── form.html
│   │   ├── inventory/
│   │   │   ├── index.html
│   │   │   └── add.html
│   │   ├── tanker/
│   │   │   ├── arrival.html
│   │   │   ├── dispatch.html
│   │   │   └── history.html
│   │   ├── reports/
│   │   │   └── index.html
│   │   └── analytics/
│   │       └── index.html
│   └── static/
│       ├── css/
│       │   └── styles.css
│       └── js/
│           └── charts.js
```

### Step 3: Convert Layout Component to Base Template

**React Component**: `layout/Layout.tsx`  
**Django Template**: `templates/base.html`

#### React (Current):
```jsx
export default function Layout({ user, onNavigate, onLogout, children, currentPage }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="bg-slate-800 text-white">
        {/* Navigation */}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header>
          <div>Logged in as: {user.username}</div>
        </header>
        
        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
```

#### Django Template (Target):
```html
{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}LIMS{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
    {% block extra_css %}{% endblock %}
</head>
<body class="min-h-screen bg-gray-50">
    <div class="flex">
        <!-- Sidebar -->
        <div class="bg-slate-800 text-white w-64">
            <nav class="p-4">
                <a href="{% url 'dashboard' %}" class="block px-4 py-3 rounded-lg hover:bg-slate-700">
                    Dashboard
                </a>
                <a href="{% url 'labdata_form' %}" class="block px-4 py-3 rounded-lg hover:bg-slate-700">
                    Lab Data Entry
                </a>
                <!-- More navigation items -->
            </nav>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-xl font-semibold text-gray-800">{% block page_title %}Dashboard{% endblock %}</h1>
                        <p class="text-sm text-gray-500">{{ user.laboratory }}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <span>{{ user.username }}</span>
                        <a href="{% url 'logout' %}" class="text-red-600">Logout</a>
                    </div>
                </div>
            </header>
            
            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto p-6">
                {% block content %}{% endblock %}
            </main>
        </div>
    </div>
    
    {% block extra_js %}{% endblock %}
</body>
</html>
```

### Step 4: Convert Login Page

**React Component**: `auth/Login.tsx`  
**Django Template**: `templates/auth/login.html`

#### React (Current):
```jsx
<form onSubmit={handleSubmit}>
  <input
    type="text"
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
  />
  <button type="submit">Login</button>
</form>
```

#### Django Template (Target):
```html
{% extends "base_login.html" %}

{% block content %}
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-semibold text-gray-800 mb-6">Login</h2>
            
            <form method="POST" action="{% url 'login' %}">
                {% csrf_token %}
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-medium mb-2">
                        Employee ID / Username
                    </label>
                    <input
                        type="text"
                        name="username"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 font-medium mb-2">
                        Laboratory
                    </label>
                    <select
                        name="laboratory"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="central">Central Laboratory</option>
                        <option value="plant-1">Plant-1 Laboratory</option>
                        <!-- More options -->
                    </select>
                </div>
                
                <button
                    type="submit"
                    class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Login
                </button>
            </form>
        </div>
    </div>
</div>
{% endblock %}
```

### Step 5: Convert Lab Data Form

**React Component**: `labdata/LabDataForm.tsx`  
**Django Template**: `templates/labdata/form.html`

#### Django View:
```python
# lims/views.py
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import LabDataForm

@login_required
def labdata_form(request):
    if request.method == 'POST':
        form = LabDataForm(request.POST)
        if form.is_valid():
            sample = form.save(commit=False)
            sample.analyst = request.user
            sample.save()
            return redirect('dashboard')
    else:
        form = LabDataForm()
    
    return render(request, 'labdata/form.html', {'form': form})
```

#### Django Form:
```python
# lims/forms.py
from django import forms
from .models import Sample

class LabDataForm(forms.ModelForm):
    class Meta:
        model = Sample
        fields = ['sample_id', 'batch_id', 'order_number', 'product', 
                  'moisture', 'purity', 'sample_date', 'sample_time', 'remarks']
        widgets = {
            'sample_id': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg',
                'placeholder': 'S-2026-0205-XXX'
            }),
            # More widgets...
        }
```

#### Django Template:
```html
{% extends "base.html" %}

{% block content %}
<div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Lab Data Entry</h2>
    
    <form method="POST" class="bg-white rounded-lg shadow">
        {% csrf_token %}
        
        <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Sample Identification</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">
                        Sample ID <span class="text-red-500">*</span>
                    </label>
                    {{ form.sample_id }}
                </div>
                <!-- More fields -->
            </div>
        </div>
        
        <div class="p-6 bg-gray-50">
            <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                Submit Sample Data
            </button>
        </div>
    </form>
</div>
{% endblock %}
```

### Step 6: Convert Charts (Analytics)

#### Option 1: Power BI Embedded (Recommended for Enterprise)

```html
{% extends "base.html" %}

{% block content %}
<div>
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Analytics & Insights</h2>
    
    <!-- Power BI Embedded Report -->
    <div class="bg-white rounded-lg shadow p-6">
        <iframe 
            width="100%" 
            height="600" 
            src="https://app.powerbi.com/reportEmbed?reportId={{ powerbi_report_id }}&autoAuth=true"
            frameborder="0" 
            allowFullScreen="true">
        </iframe>
    </div>
</div>
{% endblock %}
```

#### Option 2: Chart.js (Open Source)

**Template:**
```html
{% extends "base.html" %}

{% block content %}
<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Monthly Production (MT)</h3>
    <canvas id="productionChart"></canvas>
</div>
{% endblock %}

{% block extra_js %}
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const ctx = document.getElementById('productionChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: {{ months|safe }},
            datasets: [
                {
                    label: 'Urea',
                    data: {{ urea_data|safe }},
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'DAP',
                    data: {{ dap_data|safe }},
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
</script>
{% endblock %}
```

**View:**
```python
@login_required
def analytics(request):
    # Fetch data from database
    production_data = ProductionReport.objects.filter(
        date__gte=timezone.now() - timedelta(days=180)
    )
    
    # Prepare data for charts
    months = [p.month for p in production_data]
    urea_data = [p.urea_quantity for p in production_data]
    dap_data = [p.dap_quantity for p in production_data]
    
    context = {
        'months': json.dumps(months),
        'urea_data': json.dumps(urea_data),
        'dap_data': json.dumps(dap_data),
    }
    
    return render(request, 'analytics/index.html', context)
```

## 🗄️ Django Models

```python
# lims/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class Laboratory(models.Model):
    LAB_TYPES = [
        ('central', 'Central Laboratory'),
        ('plant-1', 'Plant-1 Laboratory'),
        ('plant-2', 'Plant-2 Laboratory'),
        # ... more plants
    ]
    name = models.CharField(max_length=100, choices=LAB_TYPES, unique=True)
    code = models.CharField(max_length=10, unique=True)
    
    def __str__(self):
        return self.get_name_display()

class User(AbstractUser):
    ROLE_CHOICES = [
        ('central_admin', 'Central Admin'),
        ('plant_admin', 'Plant Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

class Sample(models.Model):
    PRODUCT_CHOICES = [
        ('urea', 'Urea'),
        ('dap', 'DAP'),
        ('npk', 'NPK'),
        ('ssp', 'SSP'),
        ('mop', 'MOP'),
        ('ammonium_sulphate', 'Ammonium Sulphate'),
    ]
    
    sample_id = models.CharField(max_length=50, unique=True)
    batch_id = models.CharField(max_length=50)
    order_number = models.CharField(max_length=50, blank=True)
    product = models.CharField(max_length=50, choices=PRODUCT_CHOICES)
    moisture = models.DecimalField(max_digits=5, decimal_places=2)
    purity = models.DecimalField(max_digits=5, decimal_places=2)
    analyst = models.ForeignKey(User, on_delete=models.CASCADE)
    sample_date = models.DateField()
    sample_time = models.TimeField()
    remarks = models.TextField(blank=True)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.sample_id

class Inventory(models.Model):
    MATERIAL_CHOICES = [
        ('nitrogen', 'Nitrogen (N₂)'),
        ('sulphuric_acid', 'Sulphuric Acid (H₂SO₄)'),
        ('caustic_soda', 'Caustic Soda (NaOH)'),
        ('phosphoric_acid', 'Phosphoric Acid (H₃PO₄)'),
        ('ammonia', 'Ammonia (NH₃)'),
        ('potassium_chloride', 'Potassium Chloride (KCl)'),
    ]
    
    material = models.CharField(max_length=50, choices=MATERIAL_CHOICES)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, default='MT')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2)
    max_stock = models.DecimalField(max_digits=10, decimal_places=2)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['material', 'laboratory']

class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
    ]
    
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=3, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    time = models.TimeField()
    supplier = models.CharField(max_length=200, blank=True)
    remarks = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Tanker(models.Model):
    TYPE_CHOICES = [
        ('arrival', 'Arrival'),
        ('dispatch', 'Dispatch'),
    ]
    
    tanker_number = models.CharField(max_length=50)
    tanker_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    material = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    time = models.TimeField()
    batch_number = models.CharField(max_length=50, blank=True)
    order_number = models.CharField(max_length=50, blank=True)
    driver = models.CharField(max_length=100, blank=True)
    supplier = models.CharField(max_length=200, blank=True)
    destination = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=50)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
```

## 🛣️ Django URLs

```python
# lims/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('labdata/form/', views.labdata_form, name='labdata_form'),
    path('inventory/', views.inventory_index, name='inventory'),
    path('inventory/add/', views.inventory_add, name='inventory_add'),
    path('tanker/arrival/', views.tanker_arrival, name='tanker_arrival'),
    path('tanker/dispatch/', views.tanker_dispatch, name='tanker_dispatch'),
    path('tanker/history/', views.tanker_history, name='tanker_history'),
    path('reports/', views.reports, name='reports'),
    path('analytics/', views.analytics, name='analytics'),
]
```

## 🔐 Authentication & Authorization

```python
# lims/views.py
from django.contrib.auth.decorators import login_required, user_passes_test

def is_admin(user):
    return user.role in ['central_admin', 'plant_admin']

def is_editor(user):
    return user.role in ['central_admin', 'plant_admin', 'editor']

@login_required
@user_passes_test(is_editor)
def labdata_form(request):
    # Only admins and editors can add data
    pass

@login_required
def reports(request):
    # Everyone can view reports
    pass
```

## 📦 Required Django Packages

```bash
pip install django
pip install django-crispy-forms
pip install django-crispy-tailwind
pip install pillow
pip install python-dateutil
```

## ✅ Conversion Checklist

- [ ] Set up Django project and apps
- [ ] Create all models and run migrations
- [ ] Convert Layout component to base.html
- [ ] Convert Login page
- [ ] Convert Dashboard
- [ ] Convert Lab Data Form
- [ ] Convert Inventory pages
- [ ] Convert Tanker tracking pages
- [ ] Convert Reports page
- [ ] Convert Analytics page
- [ ] Implement authentication
- [ ] Add role-based permissions
- [ ] Integrate charts (Power BI or Chart.js)
- [ ] Add form validations
- [ ] Test all forms and submissions
- [ ] Deploy static files (Tailwind CSS)
- [ ] Set up database (PostgreSQL)
- [ ] Create admin interface
- [ ] Add data fixtures for testing
- [ ] Security audit
- [ ] Performance optimization

## 📚 Additional Resources

- Django Documentation: https://docs.djangoproject.com/
- Tailwind CSS: https://tailwindcss.com/
- Chart.js: https://www.chartjs.org/
- Power BI Embedded: https://powerbi.microsoft.com/embedded/

---

**Conversion Status**: Ready  
**Estimated Time**: 2-3 weeks for full conversion  
**Complexity**: Medium
