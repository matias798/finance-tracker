# Shared Expense Tracker - PRD

## Overview
A TypeScript web app for a couple (Matias and Agustina) to track shared purchases and expenses.

## Users
- **Matias** - User 1
- **Agustina** - User 2

## Core Features

### 1. User Selection (No Password)
- Simple login screen with two buttons (Matias / Agustina)
- Ability to switch users at any time
- No authentication required

### 2. Shopping Cart
- Add items you want to purchase
- View pending purchase items
- Move items to expenses when purchased

### 3. Expenses Tracking
- Track items that have been purchased
- Mark who paid for each item
- Checkbox to indicate if the expense was divided/split between both

### 4. History
- View archived/past items
- Complete transaction history

### 5. UI/UX
- Dark theme throughout
- Currency: Danish Kroner (DKK)
- Mobile-first responsive design

## Data Models

### User
- id: string
- name: string ("Matias" | "Agustina")

### Item
- id: string
- name: string
- amount: number
- currency: "DKK"
- type: "cart" | "expense"
- paidBy: string (userId)
- isDivided: boolean
- createdAt: datetime
- createdBy: string (userId)

## API Endpoints
- GET /api/users - Get all users
- GET /api/items - Get all items
- POST /api/items - Create item
- PUT /api/items/:id - Update item
- DELETE /api/items/:id - Delete item
- PUT /api/items/:id/toggle-divided - Toggle divided status

## Technical Stack
- Frontend: Expo (React Native + TypeScript)
- Backend: FastAPI
- Database: MongoDB
