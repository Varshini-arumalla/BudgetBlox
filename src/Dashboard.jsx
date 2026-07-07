import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import './styles.css';

const CATEGORIES = ["Food", "Travel", "Recharge", "Stationary", "Entertainment", "Other"];
const COLORS = ['#4facfe', '#00f2fe', '#00cdac', '#ff9a9e', '#a8edea', '#fed6e3'];

export default function Dashboard({ user, onLogout }) {
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [hasBudget, setHasBudget] = useState(false);

  const [expenses, setExpenses] = useState([]);

  const [savingsGoal, setSavingsGoal] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [hasGoal, setHasGoal] = useState(false);

  const [streak, setStreak] = useState(0);
  const [lastExpenseDate, setLastExpenseDate] = useState("");

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");


  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date().toDateString();

  useEffect(() => {
    if (!user || !user.uid) return;
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.monthlyBudget) {
          setMonthlyBudget(data.monthlyBudget);
          setBudgetInput(data.monthlyBudget.toString());
          setHasBudget(true);
        } else {
          setHasBudget(false);
          setMonthlyBudget(0);
        }

        if (data.savingsGoal) {
          setSavingsGoal(data.savingsGoal.name);
          setGoalAmount(data.savingsGoal.amount);
          setHasGoal(true);
        } else {
          setHasGoal(false);
        }

        setStreak(data.streak || 0);
        setLastExpenseDate(data.lastExpenseDate || "");
        setExpenses(data.expenses || []);
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  const saveToStorage = async (newData) => {
    if (!user || !user.uid) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, newData);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const currentMonthExpenses = useMemo(() =>
    expenses.filter(expense => expense.monthYear === currentMonth),
    [expenses, currentMonth]);

  const totalSpent = useMemo(() =>
    currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    [currentMonthExpenses]);

  const balance = useMemo(() =>
    monthlyBudget - totalSpent,
    [monthlyBudget, totalSpent]);


  const handleSaveBudget = () => {
    if (!budgetInput || isNaN(budgetInput) || Number(budgetInput) <= 0) {
      alert("Please enter a valid budget amount!");
      return;
    }
    const amt = Number(budgetInput);
    setMonthlyBudget(amt);
    setHasBudget(true);
    saveToStorage({ monthlyBudget: amt });
  };

  const handleSetGoal = () => {
    if (!savingsGoal.trim() || !goalAmount || isNaN(goalAmount) || Number(goalAmount) <= 0) {
      alert("Please enter valid goal details!");
      return;
    }
    setHasGoal(true);
    saveToStorage({ savingsGoal: { name: savingsGoal.trim(), amount: goalAmount } });
  };

  const handleAddExpense = () => {
    if (!expenseName.trim() || !expenseAmount || isNaN(expenseAmount) || Number(expenseAmount) <= 0) {
      alert("Please enter valid expense details!");
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      name: expenseName.trim(),
      amount: Number(expenseAmount),
      category: expenseCategory,
      monthYear: currentMonth,
      date: today,
      timestamp: new Date().toISOString()
    };

    const newExpenses = [newExpense, ...expenses];
    setExpenses(newExpenses);


    let newStreak = streak;
    if (lastExpenseDate !== today) {
      if (lastExpenseDate) {
        const lastDateObj = new Date(lastExpenseDate);
        const todayDateObj = new Date(today);

        lastDateObj.setHours(0, 0, 0, 0);
        todayDateObj.setHours(0, 0, 0, 0);

        const diffDays = Math.round((todayDateObj - lastDateObj) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      setStreak(newStreak);
      setLastExpenseDate(today);
    }

    saveToStorage({ expenses: newExpenses, streak: newStreak, lastExpenseDate: today });

    setExpenseName("");
    setExpenseAmount("");
  };

  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all your data? This cannot be undone.")) {
      if (!user || !user.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          monthlyBudget: 0,
          savingsGoal: null,
          streak: 0,
          lastExpenseDate: "",
          expenses: []
        });
        setMonthlyBudget(0);
        setHasBudget(false);
        setBudgetInput("");
        setExpenses([]);
        setSavingsGoal("");
        setGoalAmount("");
        setHasGoal(false);
        setStreak(0);
      } catch (error) {
        console.error("Error clearing data: ", error);
      }
    }
  };

  const categoryChartData = useMemo(() => {
    const totals = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    currentMonthExpenses.forEach(exp => totals[exp.category] += exp.amount);
    return CATEGORIES.map((c, i) => ({ name: c, value: totals[c] })).filter(d => d.value > 0);
  }, [currentMonthExpenses]);

  const weeklyTrendData = useMemo(() => {
    const weeklySpending = [0, 0, 0, 0];
    currentMonthExpenses.forEach(exp => {
      const d = new Date(exp.timestamp);
      const w = Math.floor((d.getDate() - 1) / 7);
      if (w >= 0 && w < 4) weeklySpending[w] += exp.amount;
    });
    return [
      { name: 'Week 1', Spent: weeklySpending[0] },
      { name: 'Week 2', Spent: weeklySpending[1] },
      { name: 'Week 3', Spent: weeklySpending[2] },
      { name: 'Week 4', Spent: weeklySpending[3] }
    ];
  }, [currentMonthExpenses]);


  const getInsights = () => {
    if (currentMonthExpenses.length === 0) return ["No expenses logged yet."];

    const totals = {};
    currentMonthExpenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    let highestCat = null;
    let max = 0;
    for (const [cat, val] of Object.entries(totals)) {
      if (val > max) { max = val; highestCat = cat; }
    }

    const currentWeekIdx = Math.floor((new Date().getDate() - 1) / 7);
    const thisWeekSpent = currentWeekIdx < 4 ? weeklyTrendData[currentWeekIdx].Spent : 0;

    const insights = [];
    if (highestCat) insights.push(`Highest spending category: ${highestCat} (₹${max})`);
    insights.push(`Total spent this week: ₹${thisWeekSpent}`);

    if (totalSpent > monthlyBudget) {
      insights.push(`⚠️ You have exceeded your budget by ₹${totalSpent - monthlyBudget}!`);
    } else if (totalSpent > monthlyBudget * 0.8) {
      insights.push(`⚠️ Nearing budget limit (₹${monthlyBudget - totalSpent} left).`);
    } else {
      insights.push(`👍 You are within budget.`);
    }
    return insights;
  };

  const filteredTransactions = currentMonthExpenses.filter(exp => {
    const matchesCat = filterCategory === "All" || exp.category === filterCategory;
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-container">
        <button className="logout-button" onClick={onLogout}>Logout</button>

        <h1 className="dashboard-header">Welcome, {user.name}!</h1>
        <div className="dashboard-subheader">{currentMonth}</div>

        <div className="streak-container">
          <div className="streak-badge">🔥 {streak} Day Streak</div>
        </div>
      </div>

      {!hasBudget && (
        <div className="card">
          <h2 className="card-title">Set Your Budget </h2>
          <input
            type="number"
            className="input-field"
            placeholder="Enter Weekly/Monthly Budget Amount"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <button className="primary-button" onClick={handleSaveBudget}>
            Save Budget
          </button>
        </div>
      )}

      {hasBudget && (
        <div className="card">
          <h2 className="card-title">Financial Overview</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-label">Budget</div>
              <div className="overview-amount">₹{monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">Spent</div>
              <div className="overview-amount text-danger">₹{totalSpent.toLocaleString()}</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">Balance</div>
              <div className={`overview-amount ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                ₹{balance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-header">
              <span>Budget Usage</span>
              <span>{monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (totalSpent / monthlyBudget) * 100)}%`,
                  backgroundColor: totalSpent > monthlyBudget ? '#ff6b6b' : (totalSpent > monthlyBudget * 0.8 ? '#ffa726' : '#4facfe')
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Insights</h2>
        <ul className="insights-list">
          {getInsights().map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="card-title">Add Expense</h2>
        <input
          type="text"
          className="input-field"
          placeholder="Expense Reason"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
        />
        <input
          type="number"
          className="input-field"
          placeholder="Amount"
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
        />

        <span className="category-label">Category:</span>
        <div className="category-container">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-button ${expenseCategory === cat ? 'selected' : ''}`}
              onClick={() => setExpenseCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          className="primary-button"
          onClick={handleAddExpense}
          disabled={!expenseName.trim() || !expenseAmount}
        >
          Add Expense
        </button>
      </div>

      {currentMonthExpenses.length > 0 && (
        <div className="card">
          <h2 className="card-title">Spending Analysis</h2>

          <h3 className="chart-title">Spending by Category</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[CATEGORIES.indexOf(entry.name) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h3 className="chart-title">Weekly Spending Trend</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Line type="monotone" dataKey="Spent" stroke="#4facfe" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Recent Transactions</h2>

        <div className="filter-search-container">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            {currentMonthExpenses.length === 0 ? "No transactions this month." : "No transactions match your search."}
          </div>
        ) : (
          filteredTransactions.map((item) => (
            <div key={item.id} className="transaction-row">
              <div className="transaction-info">
                <span className="transaction-name">{item.name}</span>
                <span className="transaction-category">
                  {item.category} • {item.date}
                </span>
              </div>
              <span className="transaction-amount">-₹{item.amount.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Savings Goal</h2>
        {!hasGoal ? (
          <>
            <input
              type="text"
              className="input-field"
              placeholder="Goal Name (e.g., New Laptop)"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
            />
            <input
              type="number"
              className="input-field"
              placeholder="Target Amount"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
            />
            <button className="primary-button" onClick={handleSetGoal}>
              Set Savings Goal
            </button>
          </>
        ) : (
          <>
            <span className="goal-text">Target: {savingsGoal} - ₹{Number(goalAmount).toLocaleString()}</span>
            <span className="suggestion-text">
              Keep your balance above ₹{goalAmount} to reach this!
            </span>
            <button className="primary-button btn-secondary" onClick={() => setHasGoal(false)}>
              Change Goal
            </button>
          </>
        )}
      </div>

      <button className="primary-button btn-danger" onClick={clearAllData}>
        Clear All Data
      </button>
    </div>
  );
}
