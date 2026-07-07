# BudgetBlox (React Web)

A personal finance tracker crafted to help students manage their budgets effectively, monitor their expenses dynamically, and achieve their savings goals.

## Migration Details
This project was migrated from a React Native (Expo) architecture to standard React Web using **Vite**. 
**Firebase** has been completely extracted and replaced with browser `localStorage` to handle mock authentication and rapid local data persistence.

## Features Added
1. **Transactions List** 
   - A dedicated section showcasing all recent expenses.
   - Includes real-time **Search** capability by expense name.
   - Includes a **Category Filter** dropdown.
2. **Role-Based UI**
   - Toggle behavior between Admin and Viewer roles (via the dropdown at the top).
   - **Viewer:** Cannot view or use the Add Expense form or the Clear All Data buttons.
   - **Admin:** Has unrestricted access to append records and wipe data.
3. **Smart Insights Section**
   - A newly added card calculating:
     - The highest spending category.
     - Total expenditures recorded exactly on the current week.
     - Notification if you are running within your budget or have exceeded it.
4. **Time-Based Visualization**
   - Integrated a new **Line Chart** depicting your Weekly Spending Trends.
   - Powered by `recharts`.
   - Also retained the Pie Chart for categorical spending splits.

## How to Run

1. Open your terminal in the root directory (`BudgetBlox`).
2. Run `npm install` (or `npm.cmd install` on Windows if standard npm blocks scripts).
3. Run `npm run dev` to start the local development server.
4. Visit the provided localhost URL in your browser.

## Tech Stack
- Frontend: React 18, Vite
- Charts: Recharts
- Styling: Plain CSS
- Database/Auth: Browser API `localStorage`

## Future Enhancements
- Expand to a full backend with Node/Express and MongoDB.
- Add receipt image uploading.
- Implement an API-based insights generation using an LLM.

---
*Created by [Your Name] for students trying to budget safely.*
