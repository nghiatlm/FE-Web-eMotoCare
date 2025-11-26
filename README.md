# eMotocare - Electric Motorbike Warranty & Maintenance Management System

A comprehensive management system for electric vehicle warranty, repair, and maintenance services with multiple user roles and professional management features.

## 📋 Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [API Integration](#api-integration)
- [Deployment](#deployment)

## 🎯 Introduction

eMotocare is a electric motorbike warranty and maintenance management system built to support the entire workflow from appointment booking, vehicle inspection, repair, warranty to inventory management and payment processing. The system supports multiple user roles with distinct permissions and functionalities.

## ✨ Key Features

### 👥 User Management
- Account management with multiple roles (Admin, Manager, Staff, Technician, Storekeeper, Customer)
- Detailed role-based permissions
- Employee and customer information management

### 🏢 Branch Management
- Service center branch information management
- View reports and statistics by branch
- Employee management by branch

### 🚗 Vehicle Management
- Customer electric vehicle information management
- Track repair and maintenance history
- Manage vehicle-attached parts

### 📅 Appointment/Booking Management
- Service appointment scheduling
- Appointment management by status
- Real-time notifications via SignalR

### 🔧 Electric Vehicle Check (EV Check)
- Detailed electric vehicle inspection process
- Inspection step management
- Inspection result storage

### 🛡️ Warranty Management
- Create and manage warranty claims
- RMA (Return Merchandise Authorization) processing
- Warranty status tracking
- Manufacturer response management

### 📦 Inventory Management
- Parts inventory management
- Import/Export slips
- Track parts quantity and status
- Missing parts management

### 💰 Payment Processing
- Service payment processing
- Invoice management
- QR code payment integration

### 📊 Reports & Statistics
- Dashboard with charts and metrics
- Branch-specific reports
- Revenue and service statistics

### 📦 Service Packages
- Service package management
- Create and edit service packages
- Apply service packages to customers

### 📢 Campaigns
- Create and manage promotional campaigns
- Track campaign effectiveness

## 👤 User Roles

### 🔴 ROLE_ADMIN (Administrator)
- Full system management
- User and branch management
- View overview reports
- Service package and campaign management

### 🟡 ROLE_MANAGER (Branch Manager)
- Manage assigned branch
- Manage employees within branch
- Process warranty claims
- Manage overall inventory
- View branch reports

### 🟢 ROLE_STAFF (Service Staff)
- Appointment management
- Create new bookings
- Process payments
- Manage warranty claims
- Electric vehicle inspection

### 🔵 ROLE_TECHNICIAN (Technician)
- View assigned task list
- Perform inspections and repairs
- Update work status
- Manage parts usage

### 🟣 ROLE_STOREKEEPER (Storekeeper)
- Parts inventory management
- Create import/export slips
- Track parts quantity
- Manage part details

### ⚪ ROLE_CUSTOMER (Customer)
- View own vehicle information
- View service history
- Track warranty status

## 🛠️ Technologies Used

### Frontend Framework & Libraries
- **React 18.3.1** - UI framework
- **Vite 5.4.19** - Build tool and dev server
- **React Router DOM 6.30.1** - Routing
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation

### UI Components & Styling
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI components
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Ant Design 5.27.4** - Additional UI components
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

### State Management & Data Fetching
- **TanStack Query (React Query) 5.83.0** - Server state management
- **Axios 1.12.2** - HTTP client

### Real-time Communication
- **SignalR (@microsoft/signalr) 9.0.6** - Real-time updates

### Utilities
- **date-fns 3.6.0** - Date manipulation
- **jwt-decode 4.0.0** - JWT token decoding
- **lodash 4.17.21** - Utility functions
- **qrcode 1.5.4** - QR code generation

### Charts & Visualization
- **Recharts 2.15.4** - Chart library

### File Storage
- **Firebase 12.5.0** - File upload and storage

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📦 Installation

### System Requirements
- Node.js (version 18 or higher)
- npm, yarn, or bun

### Installation Steps


1. **Install dependencies**
```bash
npm install
# or
yarn install
# or
bun install
```

2. **Run development application**
```bash
npm run dev
```

## 🚀 Scripts

### Development
```bash
npm run dev
```
Run development server with hot reload

### Build
```bash
npm run build
```
Build application for production

```bash
npm run build:dev
```
Build application for development environment

### Preview
```bash
npm run preview
```
Preview production build locally

### Lint
```bash
npm run lint
```
Run ESLint to check code quality

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

Output will be created in the `dist/` directory.

### Deploy to Hosting
1. Build the application: `npm run build`
2. Upload the `dist/` folder to your web server
3. Configure web server to serve static files
4. Ensure environment variables are configured correctly

### Environment Variables
Ensure the following environment variables are configured:
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_FIREBASE_*`: Firebase configuration information

## 📝 Notes

- The system uses JWT for authentication
- Real-time updates are handled via SignalR
- File upload uses Firebase Storage
- Responsive design supports mobile and desktop

## 👥 Contributing

This project is developed for educational and commercial purposes. All contributions are welcome!


**Developed by**: eMotocare Group
**Version**: 1.0.0  
**Last Updated**: 2025
