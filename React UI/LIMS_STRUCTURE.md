# Laboratory Information Management System (LIMS) - UI Structure

## 🏗️ Project Overview

This is a complete UI/UX design for an industrial fertilizer manufacturing Laboratory Information Management System (LIMS). The design is structured to be easily convertible to Django templates.

## 📂 File Structure Mapping to Django Templates

### Current React Structure → Django Template Structure

```
/src/app/components/
├── auth/
│   └── Login.tsx                    → templates/auth/login.html
│
├── dashboard/
│   └── Dashboard.tsx                → templates/dashboard/index.html
│
├── labdata/
│   └── LabDataForm.tsx              → templates/labdata/form.html
│
├── inventory/
│   ├── InventoryIndex.tsx           → templates/inventory/index.html
│   └── InventoryAdd.tsx             → templates/inventory/add.html
│
├── tanker/
│   ├── TankerArrival.tsx            → templates/tanker/arrival.html
│   ├── TankerDispatch.tsx           → templates/tanker/dispatch.html
│   └── TankerHistory.tsx            → templates/tanker/history.html
│
├── reports/
│   └── ReportsIndex.tsx             → templates/reports/index.html
│
├── analytics/
│   └── AnalyticsIndex.tsx           → templates/analytics/index.html
│
└── layout/
    └── Layout.tsx                   → templates/base.html (Django base template)
```

## 🎯 Key Features Implemented

### 1. Authentication (Login Page)
- **File**: `auth/Login.tsx`
- Organization branding with laboratory theme
- Employee ID/Username input
- Password input
- Laboratory selection dropdown (Central Lab + 7 Plant Labs)
- Clean, professional industrial design

### 2. Dashboard
- **File**: `dashboard/Dashboard.tsx`
- Summary cards:
  - Samples Today (with trend indicator)
  - Pending Approvals
  - Inventory Alerts
  - Monthly Production
- Charts:
  - Monthly Production Bar Chart (Urea, DAP, NPK, SSP)
  - Daily Samples Line Chart
- Recent Activity Table

### 3. Lab Data Entry Form
- **File**: `labdata/LabDataForm.tsx`
- Sample identification section
- Analysis data inputs (Moisture %, Purity %)
- Date and time pickers
- Analyst auto-filled from logged-in user
- Submit and Reset buttons

### 4. Inventory Management
- **Files**: `inventory/InventoryIndex.tsx`, `inventory/InventoryAdd.tsx`
- Overview page with material cards:
  - Visual stock level indicators
  - Low stock alerts
  - Progress bars
  - Material details (Nitrogen, Sulphuric Acid, Caustic Soda, etc.)
- Add inventory entry form
- Stock In/Out transaction recording

### 5. Tanker Tracking
- **Files**: `tanker/TankerArrival.tsx`, `tanker/TankerDispatch.tsx`, `tanker/TankerHistory.tsx`
- **Arrival**: Record incoming raw material tankers
- **Dispatch**: Record outgoing finished product tankers
- **History**: Complete traceability timeline with search and filters

### 6. Reports
- **File**: `reports/ReportsIndex.tsx`
- Categorized reports:
  - Production Reports
  - Inventory Reports
  - Lab Performance Reports
  - Tanker & Logistics Reports
  - Compliance & Audit Reports
- Date range filters
- Export functionality (PDF/Excel)

### 7. Analytics Dashboard
- **File**: `analytics/AnalyticsIndex.tsx`
- Comprehensive data visualization:
  - Monthly Production Bar Chart
  - Product Contribution Pie Chart
  - Daily Raw Material Usage Line Chart
  - Lab Performance Bar Chart
  - Quality Metrics Trend
- KPI cards with statistics
- Filter options (Date Range, Product, Laboratory)

## 🎨 Design System

### Color Scheme (Industrial Theme)
- **Primary Blue**: `#3b82f6` - Main actions, charts
- **Green**: `#10b981` - Success states, positive trends
- **Orange**: `#f59e0b` - Warnings, secondary data
- **Red**: `#ef4444` - Alerts, critical items
- **Purple**: `#8b5cf6` - Accent color
- **Gray Scale**: Professional backgrounds and text

### Typography
- Clean sans-serif font family
- Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Responsive text sizes

### Layout Patterns
- **Card-based UI**: Clean, organized sections
- **Responsive Grid**: Adapts to different screen sizes
- **Sidebar Navigation**: Collapsible for smaller screens
- **Top Header**: User info, notifications, logout

## 🔄 Converting to Django

### Step 1: Base Template
Convert `layout/Layout.tsx` to Django's `base.html`:
- Sidebar navigation remains the same
- Add Django template tags: `{% block content %}{% endblock %}`
- Replace React state with Django context variables

### Step 2: Individual Pages
Each component file converts to a Django template:
- Remove React imports and hooks
- Replace `{variable}` with `{{ variable }}`
- Convert form submissions to Django forms
- Replace client-side routing with Django URLs

### Step 3: Forms
- Convert React form state to Django forms
- Use Django's CSRF tokens
- Replace `onSubmit` with Django form action
- Validation handled server-side

### Step 4: Charts
- Replace Recharts with:
  - **Option 1**: Power BI embedded (as mentioned in requirements)
  - **Option 2**: Chart.js (vanilla JavaScript)
  - **Option 3**: Server-side chart generation (matplotlib → images)

### Example Conversion:

**React (Current):**
```jsx
<input
  type="text"
  name="sampleId"
  value={formData.sampleId}
  onChange={handleChange}
  className="w-full px-4 py-2 border..."
  required
/>
```

**Django Template (Target):**
```html
<input
  type="text"
  name="sample_id"
  value="{{ form.sample_id.value|default:'' }}"
  class="w-full px-4 py-2 border..."
  required
/>
```

## 📊 Mock Data

All components use realistic mock data for demonstration:
- Sample IDs follow pattern: `S-2026-0205-XXX`
- Batch IDs: `B-XXXXXX`
- Order Numbers: `ORD-XXXXXX`
- Tanker Numbers: `TKR-XXXXX`
- Production volumes in Metric Tons (MT)

## 🔐 Role-Based Access (UI Concepts)

The design supports three user roles:

### Central Admin
- Full access to all laboratories
- Can view comparative analytics
- Switch laboratory context

### Plant Admin
- Plant-specific data access
- Approval queues
- User management for their plant

### Editor
- Data entry permissions
- Lab data forms
- Inventory entries

### Viewer
- Read-only access
- Dashboard viewing
- Report generation

## 🌐 Browser Compatibility

The UI is built with:
- Modern CSS (Tailwind v4)
- Responsive design (mobile, tablet, desktop)
- Clean HTML structure suitable for all browsers

## 📱 Responsive Design

All pages are responsive:
- **Desktop**: Full layout with sidebar
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu, stacked cards

## 🔧 Technical Stack (Current React Implementation)

- **Framework**: React 18.3.1
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks (useState)

## 🎯 Next Steps for Django Conversion

1. Set up Django project structure
2. Create Django models for:
   - Laboratories
   - Users (with roles)
   - Samples
   - Inventory
   - Tankers
   - Reports
3. Convert Layout component to base template
4. Convert each page component to Django template
5. Implement Django views and URLs
6. Add Django forms for data entry
7. Integrate Power BI for analytics
8. Add authentication and authorization
9. Set up database (PostgreSQL recommended)
10. Deploy and test

## 📝 Notes

- All styling uses Tailwind utility classes
- No external CSS files needed (except Tailwind)
- Icons can be replaced with icon fonts or SVGs
- Forms are structured for easy Django form integration
- Charts use standard data formats compatible with most libraries

## 🏭 Organization Structure

- **1 Central Laboratory**: Full oversight
- **7 Plant Laboratories**: Individual operations
- **Multiple Products**: Urea, DAP, NPK, SSP, MOP, Ammonium Sulphate
- **Raw Materials**: Nitrogen, Sulphuric Acid, Caustic Soda, Phosphoric Acid, Ammonia, Potassium Chloride

---

**Design Date**: February 5, 2026  
**Version**: 1.0  
**Status**: Ready for Django Template Conversion
