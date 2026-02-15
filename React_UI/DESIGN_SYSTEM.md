# LIMS Design System - Industrial UI/UX Guidelines

## 🎨 Color Palette

### Primary Colors (Industrial Theme)

```css
/* Blue - Main Actions & Primary Elements */
--primary-blue-50: #eff6ff;
--primary-blue-100: #dbeafe;
--primary-blue-500: #3b82f6;  /* Main Blue */
--primary-blue-600: #2563eb;
--primary-blue-700: #1d4ed8;

/* Green - Success & Positive Indicators */
--success-green-100: #dcfce7;
--success-green-500: #10b981;  /* Main Green */
--success-green-600: #059669;
--success-green-800: #065f46;

/* Orange - Warnings & Secondary Data */
--warning-orange-100: #ffedd5;
--warning-orange-500: #f59e0b;  /* Main Orange */
--warning-orange-600: #d97706;

/* Red - Alerts & Critical Items */
--alert-red-100: #fee2e2;
--alert-red-500: #ef4444;  /* Main Red */
--alert-red-600: #dc2626;
--alert-red-800: #991b1b;

/* Purple - Accent Color */
--accent-purple-100: #f3e8ff;
--accent-purple-500: #8b5cf6;  /* Main Purple */
--accent-purple-600: #7c3aed;

/* Gray Scale - Backgrounds & Text */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Slate - Sidebar & Dark Elements */
--slate-700: #334155;
--slate-800: #1e293b;  /* Main Sidebar Color */
--slate-900: #0f172a;
```

## 🖌️ Component Styles

### Buttons

#### Primary Button (Blue)
```html
<button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
  Primary Action
</button>
```

#### Secondary Button (Gray)
```html
<button class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
  Secondary Action
</button>
```

#### Success Button (Green)
```html
<button class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
  Save / Submit
</button>
```

#### Danger Button (Red)
```html
<button class="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
  Delete / Remove
</button>
```

### Cards

#### Standard Card
```html
<div class="bg-white rounded-lg shadow p-6">
  <!-- Card content -->
</div>
```

#### Card with Border Accent
```html
<div class="bg-white rounded-lg shadow border-l-4 border-blue-500 p-6">
  <!-- Card content -->
</div>
```

#### Hover Card
```html
<div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
  <!-- Card content -->
</div>
```

### Form Inputs

#### Text Input
```html
<input 
  type="text" 
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Enter value..."
/>
```

#### Select Dropdown
```html
<select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

#### Textarea
```html
<textarea 
  rows="4"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Enter remarks..."
></textarea>
```

### Status Badges

#### Success Badge
```html
<span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
  Completed
</span>
```

#### Warning Badge
```html
<span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
  Pending
</span>
```

#### Danger Badge
```html
<span class="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
  Low Stock
</span>
```

#### Info Badge
```html
<span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
  In Progress
</span>
```

### Tables

#### Standard Table
```html
<table class="w-full">
  <thead class="bg-gray-50 border-b border-gray-200">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Header
      </th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

## 📏 Typography

### Font Sizes
- **Extra Small**: `text-xs` (0.75rem / 12px)
- **Small**: `text-sm` (0.875rem / 14px)
- **Base**: `text-base` (1rem / 16px)
- **Large**: `text-lg` (1.125rem / 18px)
- **Extra Large**: `text-xl` (1.25rem / 20px)
- **2X Large**: `text-2xl` (1.5rem / 24px)
- **3X Large**: `text-3xl` (1.875rem / 30px)

### Font Weights
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Usage Guidelines

#### Page Titles
```html
<h1 class="text-2xl font-bold text-gray-800">Page Title</h1>
```

#### Section Titles
```html
<h2 class="text-xl font-semibold text-gray-800">Section Title</h2>
```

#### Subsection Titles
```html
<h3 class="text-lg font-semibold text-gray-800">Subsection Title</h3>
```

#### Body Text
```html
<p class="text-gray-600">Regular body text content</p>
```

#### Labels
```html
<label class="block text-gray-700 font-medium mb-2">Field Label</label>
```

## 🎯 Layout Patterns

### Dashboard Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Cards here -->
</div>
```

### Two-Column Layout
```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Content here -->
</div>
```

### Three-Column Layout
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Content here -->
</div>
```

## 🔔 Alert Messages

### Success Alert
```html
<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
  <p class="text-green-800 font-medium">Success message</p>
</div>
```

### Warning Alert
```html
<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
  <p class="text-yellow-800 font-medium">Warning message</p>
</div>
```

### Error Alert
```html
<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
  <p class="text-red-800 font-medium">Error message</p>
</div>
```

### Info Alert
```html
<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
  <p class="text-blue-800 font-medium">Info message</p>
</div>
```

## 📊 Chart Colors

### Production Charts
- **Urea**: `#3b82f6` (Blue)
- **DAP**: `#10b981` (Green)
- **NPK**: `#f59e0b` (Orange)
- **SSP**: `#ef4444` (Red)
- **Others**: `#8b5cf6` (Purple)

### Material Usage Charts
- **Nitrogen**: `#3b82f6` (Blue)
- **Sulphuric Acid**: `#ef4444` (Red)
- **Ammonia**: `#10b981` (Green)
- **Phosphoric Acid**: `#f59e0b` (Orange)
- **Caustic Soda**: `#8b5cf6` (Purple)

## 🖼️ Icons

Using Lucide React (https://lucide.dev/)

### Common Icons
- **Dashboard**: `LayoutDashboard`
- **Lab Data**: `TestTube`, `FlaskConical`
- **Inventory**: `Package`
- **Tanker**: `Truck`
- **Reports**: `FileText`
- **Analytics**: `BarChart3`
- **Alert**: `AlertTriangle`, `AlertCircle`
- **Success**: `CheckCircle`
- **Trending Up**: `TrendingUp`
- **Trending Down**: `TrendingDown`
- **Download**: `Download`
- **Search**: `Search`
- **Calendar**: `Calendar`
- **Bell**: `Bell` (Notifications)
- **Logout**: `LogOut`
- **Save**: `Save`
- **Plus**: `Plus`

### Icon Sizes
```html
<!-- Small (16px) -->
<Icon className="w-4 h-4" />

<!-- Medium (20px) -->
<Icon className="w-5 h-5" />

<!-- Large (24px) -->
<Icon className="w-6 h-6" />

<!-- Extra Large (32px) -->
<Icon className="w-8 h-8" />
```

## 📐 Spacing

### Padding
- **Small**: `p-4` (1rem / 16px)
- **Medium**: `p-6` (1.5rem / 24px)
- **Large**: `p-8` (2rem / 32px)

### Margin
- **Small**: `mb-4` (1rem / 16px)
- **Medium**: `mb-6` (1.5rem / 24px)
- **Large**: `mb-8` (2rem / 32px)

### Gap (Grid/Flex)
- **Small**: `gap-4` (1rem / 16px)
- **Medium**: `gap-6` (1.5rem / 24px)
- **Large**: `gap-8` (2rem / 32px)

## 🎭 Animation & Transitions

### Hover Transitions
```html
<button class="... transition-colors">Smooth color change</button>
<div class="... transition-shadow">Smooth shadow change</div>
<div class="... transition-all">Smooth all properties</div>
```

### Default Duration
All transitions use the default duration (150ms)

## 🌓 Responsive Breakpoints

- **Mobile**: `< 768px` (default)
- **Tablet**: `md:` (≥ 768px)
- **Desktop**: `lg:` (≥ 1024px)
- **Large Desktop**: `xl:` (≥ 1280px)

### Responsive Pattern Example
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns -->
</div>
```

## ✨ Special Effects

### Box Shadow
- **Small**: `shadow` - Subtle shadow
- **Medium**: `shadow-md` - Medium shadow
- **Large**: `shadow-lg` - Large shadow

### Rounded Corners
- **Small**: `rounded` - 4px
- **Medium**: `rounded-lg` - 8px
- **Full**: `rounded-full` - Perfect circle/pill

### Border
- **Standard**: `border` (1px)
- **Thick**: `border-2` (2px)
- **Extra Thick**: `border-4` (4px)

## 📱 Mobile-First Design

All components are designed mobile-first and scale up for larger screens:

```html
<!-- Mobile-first approach -->
<div class="px-4 md:px-6 lg:px-8">
  <!-- Padding increases with screen size -->
</div>
```

## 🎨 Gradient Backgrounds

### Login Page Gradient
```html
<div class="bg-gradient-to-br from-blue-50 to-gray-100">
  <!-- Content -->
</div>
```

### KPI Card Gradients
```html
<div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
  <!-- Blue gradient -->
</div>

<div class="bg-gradient-to-br from-green-500 to-green-600 text-white">
  <!-- Green gradient -->
</div>
```

## 🔍 Focus States

All interactive elements have focus states for accessibility:

```html
<input class="... focus:outline-none focus:ring-2 focus:ring-blue-500" />
<button class="... focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

## ♿ Accessibility

- Minimum contrast ratio: 4.5:1 for text
- All buttons have visible focus states
- Form inputs have associated labels
- Icon-only buttons have aria-labels or sr-only text
- Semantic HTML elements used throughout

---

**Design System Version**: 1.0  
**Last Updated**: February 5, 2026  
**Framework**: Tailwind CSS v4  
**Icon Library**: Lucide React
