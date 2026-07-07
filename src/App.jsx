import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import "./styles.css";
import logo from "./assets/logo.jpg";

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || "User" });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setMessage("Please fill in all fields.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      const newUser = { email, name, uid: userCredential.user.uid };

      await setDoc(doc(db, "users", newUser.uid), {
        email: email,
        name: name,
        monthlyBudget: 0,
        savingsGoal: null,
        streak: 0,
        lastExpenseDate: "",
        expenses: []
      });

      setUser(newUser);
      setMessage("Account created successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please provide email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Logged in successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setEmail("");
      setPassword("");
      setMessage("Logged out.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
               <img src={logo} alt="BudgetBlox Logo" className="logo-image" />
          </div>
          <div className="login-heading">BudgetBlox</div>
        </div>
        <div className="login-subheading">Track. Save. Grow.</div>

        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        {isSignup ? (
          <button className="primary-button" onClick={handleSignup}>
            Create Account
          </button>
        ) : (
          <button className="primary-button" onClick={handleLogin}>
            Login to BudgetBlox
          </button>
        )}

        <button className="toggle-text" onClick={() => { setIsSignup(!isSignup); setMessage(""); }}>
          {isSignup ? "Already have an account? Login" : "New user? Sign Up"}
        </button>

        <div className="message-text">{message}</div>
      </div>
    </div>
  );
}
