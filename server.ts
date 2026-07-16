/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { UserRole } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Server: Gemini API Client initialized successfully.");
  } catch (error) {
    console.error("Server: Failed to initialize Gemini client:", error);
  }
} else {
  console.log("Server: GEMINI_API_KEY is not configured or uses placeholder.");
}

// Database JSON Persistence file
const DB_FILE = path.join(process.cwd(), "assets", ".aistudio", "trading_db.json");

// Ensure parent folder exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (e) {
    console.warn(`Warning: Could not create database directory at ${dbDir}. Using in-memory database only.`);
  }
}

// Default Seed Data
const initialDB = {
  users: [
    {
      id: "usr_student",
      name: "Alex Trader",
      email: "student@bashonair.com",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      bio: "Aspiring Forex and Crypto trader focused on Smart Money Concepts.",
      joinedDate: "2026-01-15T08:00:00Z"
    },
    {
      id: "usr_admin",
      name: "Coach Bash",
      email: "admin@bashonair.com",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      bio: "Chief Trading Mentor at Bash On Air. 10+ years of institutional trading experience.",
      joinedDate: "2025-06-01T08:00:00Z"
    }
  ],
  courses: [
    {
      id: "course_forex_beginners",
      title: "Complete Forex Beginner's Masterclass",
      description: "Learn the absolute fundamentals of the foreign exchange market. Understand currency pairs, market sessions, candlestick anatomy, brokers, leverage, and basic technical analysis.",
      instructor: "Coach Bash",
      lessons: [
        { id: "l1", title: "Introduction to Forex & Market Structures", duration: "12:15", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l2", title: "Understanding Pips, Lots, and Leverage", duration: "18:40", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l3", title: "Setting Up MetaTrader & Charting", duration: "15:20", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l4", title: "Basic Support and Resistance Theory", duration: "22:10", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l5", title: "Your First Trading Strategy Demo", duration: "25:35", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false }
      ],
      duration: "1h 34m",
      level: "Beginner",
      rating: 4.8,
      price: 150000,
      category: "Forex",
      enrolledCount: 1420
    },
    {
      id: "course_smc_pro",
      title: "Smart Money Concepts & Order Blocks",
      description: "Dive deep into how commercial institutions trade. Understand market structure shifts, liquidity sweeps, fair value gaps, mitigation zones, and high-probability order blocks.",
      instructor: "Coach Bash",
      lessons: [
        { id: "l1_smc", title: "Market Structure: MS, BOS, and CHoCH", duration: "25:10", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l2_smc", title: "Identifying Valid Order Blocks & Breakers", duration: "20:45", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l3_smc", title: "Fair Value Gaps (FVG) & Liquidity Pools", duration: "30:15", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l4_smc", title: "Premium vs Discount Pricing Matrix", duration: "18:50", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l5_smc", title: "SMC High-Winrate Setup Case Studies", duration: "35:12", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false }
      ],
      duration: "2h 10m",
      level: "Advanced",
      rating: 4.95,
      price: 350000,
      category: "Smart Money Concepts",
      enrolledCount: 890
    },
    {
      id: "course_crypto_defi",
      title: "Crypto Trading, DeFi & On-Chain Analysis",
      description: "Navigate the highly volatile cryptocurrency markets. Master spot trading, leverage futures, decipher on-chain metrics, track smart wallets, and structure long-term growth portfolios.",
      instructor: "Coach Air",
      lessons: [
        { id: "l1_crypto", title: "The Bitcoin Cycle & Halving Economics", duration: "15:40", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l2_crypto", title: "Trading Futures & Perps Responsibly", duration: "22:15", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l3_crypto", title: "On-Chain Tools: Glassnode & Etherscan", duration: "28:30", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l4_crypto", title: "DeFi Yield Farming & Risk Management", duration: "20:10", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false }
      ],
      duration: "1h 26m",
      level: "Intermediate",
      rating: 4.7,
      price: 225000,
      category: "Crypto",
      enrolledCount: 1120
    },
    {
      id: "course_risk_management",
      title: "Advanced Risk & Professional Capital Management",
      description: "The most important course you will ever take. Learn mathematical sizing models, risk-to-reward metrics, portfolio preservation rules, drawdowns survival, and psychological trading bias hacks.",
      instructor: "Coach Air",
      lessons: [
        { id: "l1_risk", title: "The Math Behind the 1% Sizing Rule", duration: "14:20", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l2_risk", title: "Understanding Expectancy & R-Multiple", duration: "19:15", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l3_risk", title: "How to Keep Your Account Funding", duration: "25:40", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false },
        { id: "l4_risk", title: "Trading Journal: The Ultimate Catalyst", duration: "16:10", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", isLocked: false }
      ],
      duration: "1h 15m",
      level: "Intermediate",
      rating: 4.9,
      price: 180000,
      category: "Risk Management",
      enrolledCount: 2150
    }
  ],
  enrollments: [
    { id: "enr_1", userId: "usr_student", courseId: "course_forex_beginners", progress: 60, completedLessons: ["l1", "l2", "l3"] }
  ],
  signals: [
    {
      id: "sig_1",
      pair: "EUR/USD",
      entry: 1.0850,
      stopLoss: 1.0815,
      takeProfit: 1.0955,
      risk: "Medium",
      direction: "BUY",
      status: "ACTIVE",
      winRate: 88,
      timestamp: "2026-07-13T07:15:00Z",
      comment: "Sweep of London session lows completed. Targetting the 4H Fair Value Gap."
    },
    {
      id: "sig_2",
      pair: "BTC/USD",
      entry: 89650,
      stopLoss: 90200,
      takeProfit: 87500,
      risk: "High",
      direction: "SELL",
      status: "HIT TP",
      winRate: 92,
      timestamp: "2026-07-12T14:20:00Z",
      comment: "Double top at psychological 90k resistance level on 1H chart with institutional divergence."
    },
    {
      id: "sig_3",
      pair: "XAU/USD (Gold)",
      entry: 2345.5,
      stopLoss: 2351.0,
      takeProfit: 2325.0,
      risk: "Medium",
      direction: "SELL",
      status: "ACTIVE",
      winRate: 84,
      timestamp: "2026-07-13T06:30:00Z",
      comment: "Testing the hourly supply zone. Expecting bearish reversal targeting Daily Order block."
    },
    {
      id: "sig_4",
      pair: "US30",
      entry: 39150,
      stopLoss: 39020,
      takeProfit: 39450,
      risk: "Medium",
      direction: "BUY",
      status: "CLOSED",
      winRate: 85,
      timestamp: "2026-07-11T12:00:00Z",
      comment: "Broke above consolidation. Secured +300 pips. Manual exit recommended."
    }
  ],
  mentorshipSlots: [
    { id: "slot_1", mentorName: "Coach Bash", date: "2026-07-15", time: "10:00 AM UTC", status: "available", topic: "SMC structure review" },
    { id: "slot_2", mentorName: "Coach Bash", date: "2026-07-15", time: "2:00 PM UTC", status: "booked", topic: "Forex Basics 1-on-1" },
    { id: "slot_3", mentorName: "Coach Air", date: "2026-07-16", time: "11:00 AM UTC", status: "available", topic: "Crypto Futures Risk Sizing" },
    { id: "slot_4", mentorName: "Coach Air", date: "2026-07-16", time: "4:00 PM UTC", status: "available", topic: "Trading Psychology Audit" }
  ],
  blogPosts: [
    {
      id: "blog_1",
      title: "The Psychology of a Winning Trader",
      excerpt: "Why is it that two traders with the exact same blueprint can have completely opposite results? Let's dive deep into risk aversion, greed, and trading discipline.",
      content: `The hard truth of professional trading is that your emotional state will make or break your account balance. You can have a 90% accurate system, but if you panic during drawdowns or double down on losing positions out of revenge, your account will bleed to zero.

### 1. The Revenge Trading Trap
When you take a loss, your brain registers it as a personal attack. The automatic reaction is to strike back—by opening a larger size trade without setup confirmation. This is called revenge trading. 
To beat this:
- Accept that losses are a regular operating cost of running a business.
- Walk away from your computer screens for at least 1 hour after any consecutive losses.

### 2. FOMO (Fear Of Missing Out)
Seeing a currency pair breakout and buying the top because you feel left behind is the easiest way to buy institutional supply. Professional traders wait for pullbacks into high-probability demand blocks. If the market goes without them, they happily let it go. There are always more trades.

### 3. Master the R-Multiple
Treat trading like statistical risk rather than a get-rich-quick gamble. Focus strictly on taking setups that provide at least a 1:3 Risk-to-Reward ratio. That way, you only need to be right 30% of the time to remain fully profitable over the long term.`,
      author: "Coach Bash",
      date: "2026-07-10T10:00:00Z",
      category: "Trading Psychology",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600",
      views: 520,
      likes: 42,
      comments: [
        { id: "c1", author: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", text: "This article saved my account today. I was about to revenge trade GBPUSD!", date: "2026-07-10T12:40:00Z" }
      ]
    },
    {
      id: "blog_2",
      title: "Trading Position Sizing: How to Survive High Volatility",
      excerpt: "If you don't know the exact dollar risk of your position before pressing buy or sell, you are gambling. Master the mathematical sizing formula used by hedge fund managers.",
      content: `Let's break down the exact mathematical formula that keeps institutional desks safe during high volatility news events like the NFP, CPI, and FOMC speeches.

### The Professional Sizing Formula:
\`Position Size = (Account Balance * Risk Percentage) / (Stop Loss in Pips * Pip Value)\`

For example:
- Account Balance: $10,000
- Maximum Risk: 1% ($100)
- Stop Loss: 20 Pips on EURUSD
- Pip Value: $10 per standard lot

With this formula, your standard lot sizing will be exactly \`100 / (20 * 10) = 0.5 Lots\`. 
This guarantees that even if your trade is invalidated and hits your stop loss, your capital loss is strictly capped at $100.

Never adjust your stop loss to fit your lot size; always adjust your lot size to fit your stop loss.`,
      author: "Coach Air",
      date: "2026-07-08T09:15:00Z",
      category: "Forex Tips",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600",
      views: 310,
      likes: 28,
      comments: []
    }
  ],
  faqs: [
    { id: "faq_1", question: "Is Bash On Air a trading broker or exchange?", answer: "No. Bash On Air is strictly an educational platform. We do not accept deposits for trading, execute trades on your behalf, or act as a brokerage. We provide signals, mentorship, and courses to help you trade independently.", category: "General" },
    { id: "faq_2", question: "How do I receive the Real-Time VIP Trading Signals?", answer: "Signals are instantly pushed to the Signals section of your Student Dashboard. We also provide a real-time webhook sync to our private VIP Discord and Telegram alerts channels so you never miss an entry.", category: "Signals" },
    { id: "faq_3", question: "What is your refund policy for Course Enrollments & VIP Subscriptions?", answer: "We offer a 14-day money-back guarantee if you haven't watched more than 20% of the course. VIP Signals subscriptions can be cancelled at any time to avoid renewal billing.", category: "Payments" },
    { id: "faq_4", question: "How do live interactive trading classes work?", answer: "Live sessions occur inside the Academy tab. Users can click 'Join Meeting' to open our live embedded broadcast where they can interact directly with mentors in real-time, ask questions, and follow live charts.", category: "Courses" }
  ],
  journalEntries: [
    { id: "j_1", date: "2026-07-10T15:30:00Z", pair: "EUR/USD", direction: "BUY", entry: 1.0820, exit: 1.0865, size: 0.5, profit: 225, notes: "Followed the 15m order block. High probability setup. Managed risk well." },
    { id: "j_2", date: "2026-07-12T10:15:00Z", pair: "BTC/USD", direction: "SELL", entry: 90100, exit: 90600, size: 0.1, profit: -50, notes: "Stop loss swept before reversing. Need to place stop loss above liquidity level next time." }
  ],
  payments: [
    { id: "pay_1", userId: "usr_student", amount: 99, currency: "USD", status: "succeeded", plan: "Complete Forex Beginner's Masterclass", date: "2026-07-10T12:00:00Z", invoiceId: "INV-8927" }
  ],
  notifications: [
    { id: "n_1", title: "New EUR/USD Signal Alert", message: "A new Buy Setup for EUR/USD has been posted with entry 1.0850. Review targets now.", date: "2026-07-13T07:16:00Z", type: "signal", read: false },
    { id: "n_2", title: "Live SMC Trading Webinar", message: "Webinar 'Smart Money Concepts AMA' is starting in 30 minutes. Secure your seat.", date: "2026-07-13T08:00:00Z", type: "live", read: true }
  ],
  tradingNotes: [
    { id: "note_1", title: "SMC Entry Checklist", content: "1. 4H Trend direction check\n2. 15m Liquidity grab\n3. CHoCH structure shift confirmed\n4. Premium/Discount validation\n5. Limit orders set on 50% FVG zone." }
  ]
};

// Database state
let db = { ...initialDB };

// Load persistent DB
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      
      // Merge with initialDB to ensure missing keys are initialized
      db = { ...initialDB, ...parsed };
      
      // Ensure all arrays are present
      for (const key of Object.keys(initialDB) as Array<keyof typeof initialDB>) {
        if (!db[key] || !Array.isArray(db[key])) {
          db[key] = [...initialDB[key]] as any;
        }
      }
      
      console.log("Server: Database loaded and synchronized successfully from file system.");
      saveDB(); // Save back any newly added default collections
    } catch (e) {
      console.error("Server: Error loading database file. Initializing defaults.", e);
      db = { ...initialDB };
      saveDB();
    }
  } else {
    console.log("Server: Database file not found. Initializing with defaults.");
    db = { ...initialDB };
    saveDB();
  }
}

// Save persistent DB
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Server: Failed to persist database:", e);
  }
}

// Initial DB load
loadDB();

// API ROUTES

const getSessionUser = (req: express.Request) => {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/session_user_id=([^;]+)/);
  if (match) {
    const userId = match[1];
    return db.users.find((u) => u.id === userId) || null;
  }
  return null;
};

// AUTH API
app.get("/api/auth/session", (req, res) => {
  const user = getSessionUser(req);
  res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "session_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.json({ success: true });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email is already registered." });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role: role || "student",
    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 10000)}?w=150`,
    bio: "Trading student ready to master forex, crypto and indices.",
    joinedDate: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB();

  res.setHeader("Set-Cookie", `session_user_id=${newUser.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  res.status(201).json({ user: newUser, token: `mock_session_${newUser.id}` });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User with this email does not exist." });
  }

  res.setHeader("Set-Cookie", `session_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  res.json({ user, token: `mock_session_${user.id}` });
});

app.post("/api/auth/profile", (req, res) => {
  const { userId, bio, name } = req.body;
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (bio !== undefined) db.users[userIndex].bio = bio;
  if (name !== undefined) db.users[userIndex].name = name;

  saveDB();
  res.json({ user: db.users[userIndex] });
});

// Switch role endpoint for easy testing of Student/Admin views in the live workspace!
app.post("/api/auth/switch-role", (req, res) => {
  const { userId, role } = req.body;
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[userIndex].role = role;
  saveDB();
  res.json({ user: db.users[userIndex] });
});

// COURSES API
app.get("/api/courses", (req, res) => {
  const { userId } = req.query;
  const coursesWithProgress = db.courses.map((course) => {
    const enrollment = db.enrollments.find(
      (e) => e.userId === userId && e.courseId === course.id
    );
    return {
      ...course,
      progress: enrollment ? enrollment.progress : undefined
    };
  });
  res.json(coursesWithProgress);
});

app.post("/api/courses/enroll", (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ error: "userId and courseId are required." });
  }

  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const existing = db.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId
  );
  if (existing) {
    return res.json({ enrollment: existing, message: "Already enrolled." });
  }

  const newEnrollment = {
    id: `enr_${Date.now()}`,
    userId,
    courseId,
    progress: 0,
    completedLessons: []
  };

  db.enrollments.push(newEnrollment);
  course.enrolledCount += 1;

  // Add a simulation payment record
  const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPayment = {
    id: `pay_${Date.now()}`,
    userId,
    amount: course.price,
    currency: "USD",
    status: "succeeded" as const,
    plan: course.title,
    date: new Date().toISOString(),
    invoiceId
  };
  db.payments.push(newPayment);

  // Add general notification
  db.notifications.push({
    id: `n_${Date.now()}`,
    title: "Course Enrollment Successful!",
    message: `You have enrolled in '${course.title}'. Start watching lessons now.`,
    date: new Date().toISOString(),
    type: "course",
    read: false
  });

  saveDB();
  res.json({ enrollment: newEnrollment, payment: newPayment });
});

app.post("/api/courses/lesson-progress", (req, res) => {
  const { userId, courseId, lessonId, completed } = req.body;
  if (!userId || !courseId || !lessonId) {
    return res.status(400).json({ error: "userId, courseId, and lessonId are required." });
  }

  const enrollment = db.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId
  );

  if (!enrollment) {
    return res.status(404).json({ error: "Enrollment not found." });
  }

  const course = db.courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  // Handle default completed lessons list if missing
  if (!enrollment.completedLessons) {
    enrollment.completedLessons = [];
  }

  if (completed) {
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
  } else {
    enrollment.completedLessons = enrollment.completedLessons.filter((id) => id !== lessonId);
  }

  // Recalculate progress percentage
  const totalLessons = course.lessons.length;
  enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);

  saveDB();
  res.json(enrollment);
});

// SIGNALS API
app.get("/api/signals", (req, res) => {
  res.json(db.signals);
});

app.post("/api/signals/create", (req, res) => {
  const { pair, entry, stopLoss, takeProfit, risk, direction, comment } = req.body;
  if (!pair || !entry || !stopLoss || !takeProfit || !risk || !direction) {
    return res.status(400).json({ error: "Missing required signal parameters." });
  }

  const newSignal = {
    id: `sig_${Date.now()}`,
    pair,
    entry: parseFloat(entry),
    stopLoss: parseFloat(stopLoss),
    takeProfit: parseFloat(takeProfit),
    risk,
    direction,
    status: "ACTIVE" as const,
    winRate: Math.floor(82 + Math.random() * 14),
    timestamp: new Date().toISOString(),
    comment: comment || "Review structural analysis before entry."
  };

  db.signals.unshift(newSignal);

  // Notify students
  db.notifications.push({
    id: `n_${Date.now()}`,
    title: `New Real-Time Signal: ${pair}`,
    message: `${direction} entry at ${entry} with target ${takeProfit}. Manage risk carefully!`,
    date: new Date().toISOString(),
    type: "signal",
    read: false
  });

  saveDB();
  res.status(201).json(newSignal);
});

app.delete("/api/signals/delete", (req, res) => {
  const { id } = req.body;
  db.signals = db.signals.filter((s) => s.id !== id);
  saveDB();
  res.json({ message: "Signal deleted successfully." });
});

app.post("/api/signals/update-status", (req, res) => {
  const { id, status } = req.body;
  const signalIndex = db.signals.findIndex((s) => s.id === id);
  if (signalIndex === -1) {
    return res.status(404).json({ error: "Signal not found" });
  }

  db.signals[signalIndex].status = status;
  saveDB();
  res.json(db.signals[signalIndex]);
});

// MENTORSHIP API
app.get("/api/mentorship/slots", (req, res) => {
  res.json(db.mentorshipSlots);
});

app.post("/api/mentorship/book", (req, res) => {
  const { userId, slotId, topic } = req.body;
  if (!userId || !slotId) {
    return res.status(400).json({ error: "userId and slotId are required." });
  }

  const slotIndex = db.mentorshipSlots.findIndex((s) => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ error: "Slot not found" });
  }

  if (db.mentorshipSlots[slotIndex].status === "booked") {
    return res.status(400).json({ error: "This slot is already booked." });
  }

  db.mentorshipSlots[slotIndex].status = "booked";
  db.mentorshipSlots[slotIndex].topic = topic || "SMC structure coaching";

  // Simulate booking fee payment
  const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  db.payments.push({
    id: `pay_${Date.now()}`,
    userId,
    amount: 150,
    currency: "USD",
    status: "succeeded",
    plan: `1-on-1 Mentorship Session with ${db.mentorshipSlots[slotIndex].mentorName}`,
    date: new Date().toISOString(),
    invoiceId
  });

  db.notifications.push({
    id: `n_${Date.now()}`,
    title: "Mentorship Session Booked!",
    message: `Your session with ${db.mentorshipSlots[slotIndex].mentorName} is confirmed for ${db.mentorshipSlots[slotIndex].date} at ${db.mentorshipSlots[slotIndex].time}.`,
    date: new Date().toISOString(),
    type: "general",
    read: false
  });

  saveDB();
  res.json(db.mentorshipSlots[slotIndex]);
});

// BLOG API
app.get("/api/blog", (req, res) => {
  res.json(db.blogPosts);
});

app.post("/api/blog/comment", (req, res) => {
  const { postId, author, text } = req.body;
  if (!postId || !author || !text) {
    return res.status(400).json({ error: "Missing comment fields." });
  }

  const postIndex = db.blogPosts.findIndex((b) => b.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const newComment = {
    id: `com_${Date.now()}`,
    author,
    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 10000)}?w=100`,
    text,
    date: new Date().toISOString()
  };

  db.blogPosts[postIndex].comments.push(newComment);
  saveDB();
  res.status(201).json(newComment);
});

app.post("/api/blog/like", (req, res) => {
  const { postId } = req.body;
  const postIndex = db.blogPosts.findIndex((b) => b.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  db.blogPosts[postIndex].likes += 1;
  saveDB();
  res.json({ likes: db.blogPosts[postIndex].likes });
});

app.post("/api/blog/create", (req, res) => {
  const { title, excerpt, content, category, author } = req.body;
  if (!title || !excerpt || !content || !category) {
    return res.status(400).json({ error: "Missing blog fields." });
  }

  const newPost = {
    id: `blog_${Date.now()}`,
    title,
    excerpt,
    content,
    author: author || "Coach Bash",
    date: new Date().toISOString(),
    category,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600",
    views: 1,
    likes: 0,
    comments: []
  };

  db.blogPosts.unshift(newPost);
  saveDB();
  res.status(201).json(newPost);
});

// FAQS API
app.get("/api/faqs", (req, res) => {
  res.json(db.faqs);
});

app.post("/api/faqs/create", (req, res) => {
  const { question, answer, category } = req.body;
  if (!question || !answer || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const newItem = {
    id: `faq_${Date.now()}`,
    question,
    answer,
    category
  };
  db.faqs.push(newItem);
  saveDB();
  res.status(201).json(newItem);
});

// JOURNAL API
app.get("/api/journal", (req, res) => {
  res.json(db.journalEntries);
});

app.post("/api/journal/create", (req, res) => {
  const { pair, direction, entry, exit, size, profit, notes } = req.body;
  if (!pair || !direction || !entry || !exit || !size || profit === undefined) {
    return res.status(400).json({ error: "Missing required trade journal fields." });
  }

  const newEntry = {
    id: `j_${Date.now()}`,
    date: new Date().toISOString(),
    pair,
    direction,
    entry: parseFloat(entry),
    exit: parseFloat(exit),
    size: parseFloat(size),
    profit: parseFloat(profit),
    notes: notes || ""
  };

  db.journalEntries.unshift(newEntry);
  saveDB();
  res.status(201).json(newEntry);
});

app.delete("/api/journal/delete", (req, res) => {
  const { id } = req.body;
  db.journalEntries = db.journalEntries.filter((j) => j.id !== id);
  saveDB();
  res.json({ message: "Journal entry deleted successfully." });
});

// NOTES & BOOKMARKS API
app.get("/api/notes", (req, res) => {
  res.json(db.tradingNotes);
});

app.post("/api/notes/save", (req, res) => {
  const { id, title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  if (id) {
    const noteIndex = db.tradingNotes.findIndex((n) => n.id === id);
    if (noteIndex !== -1) {
      db.tradingNotes[noteIndex].title = title;
      db.tradingNotes[noteIndex].content = content;
      saveDB();
      return res.json(db.tradingNotes[noteIndex]);
    }
  }

  const newNote = {
    id: `note_${Date.now()}`,
    title,
    content
  };
  db.tradingNotes.unshift(newNote);
  saveDB();
  res.status(201).json(newNote);
});

app.delete("/api/notes/delete", (req, res) => {
  const { id } = req.body;
  db.tradingNotes = db.tradingNotes.filter((n) => n.id !== id);
  saveDB();
  res.json({ message: "Note deleted." });
});

// PAYMENTS API
app.get("/api/payments/history", (req, res) => {
  const { userId } = req.query;
  const list = userId ? db.payments.filter((p) => p.userId === userId) : db.payments;
  res.json(list);
});

app.post("/api/payments/checkout", (req, res) => {
  const { userId, amount, plan, paymentMethod } = req.body;
  if (!userId || !amount || !plan) {
    return res.status(400).json({ error: "userId, amount, and plan are required." });
  }

  const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPayment = {
    id: `pay_${Date.now()}`,
    userId,
    amount: parseFloat(amount),
    currency: "USD",
    status: "succeeded" as const,
    plan,
    date: new Date().toISOString(),
    invoiceId
  };

  db.payments.unshift(newPayment);

  // If VIP/Pro Signals Membership, adjust user profile context in future if needed
  db.notifications.push({
    id: `n_${Date.now()}`,
    title: "Payment Processed successfully",
    message: `Thank you! Your payment of $${amount} for '${plan}' was processed via ${paymentMethod || "Stripe"}.`,
    date: new Date().toISOString(),
    type: "payment",
    read: false
  });

  saveDB();
  res.json({ success: true, payment: newPayment });
});

// NOTIFICATIONS
app.get("/api/notifications", (req, res) => {
  res.json(db.notifications);
});

app.post("/api/notifications/read-all", (req, res) => {
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
  saveDB();
  res.json({ message: "Marked all as read." });
});

// GEMINI AI MARKET ANALYSIS ENGINE (Server-Side)
app.post("/api/ai/analyze", async (req, res) => {
  const { prompt, context } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required for AI analysis." });
  }

  if (!ai) {
    // Graceful fallback with static simulated highly professional analysis
    return res.json({
      text: `### [MOCK] Bash On Air Chief AI Market Analyst Report
      
The server is currently running in a sandboxed development mode without a live Gemini API key configured. However, looking at the market technical setups for ${context || "general markets"}:

1. **EUR/USD Analysis**: Currently trading in a premium zone above Daily Mean Threshold. The 1H chart shows buy-side liquidity swept at 1.0820, with a bullish structure shift confirming. Targets remain at 1.0955 (Daily order block).
2. **Bitcoin Setup**: Psychological resistance at 90k is extremely strong. Order flow indicates massive profit-taking. We recommend waiting for a liquidity grab on the 4H FVG zone at 86,500 before starting new leverage longs.
3. **Institutional Orderflow Advice**: Never chase high-velocity candle expansion. Allow the retail traders to get trapped at the session highs/lows, then enter alongside institutional blocks on the 15-minute structural confirmation.

*Provide your own GEMINI_API_KEY in Settings > Secrets to unlock full live real-time analysis!*`
    });
  }

  try {
    const systemInstruction = `You are the world-class Chief AI Market Analyst and Trading Coach at "Bash On Air", a premium educational portal. 
Your goal is to provide elite, institutional-grade market advice, technical breakdowns (using Price Action, Liquidity Sweeps, and Smart Money Concepts like Fair Value Gaps, Order Blocks, BOS, and CHoCH), and risk management recommendations.
Keep your tone authoritative, inspiring, professional, and clear. Avoid typical retail trading cliches. Break down topics using clean markdown structure with bullet points and equations where helpful.
Always append a disclaimer that trading involves massive risk and this is strictly educational analysis.`;

    const contents = `Analyze and answer this user trading query: "${prompt}". Context details: ${JSON.stringify(context || {})}`;

    console.log("Server: Calling Gemini API for prompt:", prompt);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.75,
      },
    });

    const reply = response.text || "I was unable to structure the analysis. Please try again shortly.";
    res.json({ text: reply });
  } catch (err: any) {
    console.error("Server: Gemini API Error:", err);
    res.status(500).json({ error: "AI Engine failed to generate analysis.", details: err.message });
  }
});

// ADMIN OVERVIEW STATS
app.get("/api/admin/stats", (req, res) => {
  const totalUsers = db.users.length;
  const totalRevenue = db.payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCourses = db.courses.length;
  const activeSignals = db.signals.filter((s) => s.status === "ACTIVE").length;

  res.json({
    totalUsers,
    totalRevenue,
    totalCourses,
    activeSignals,
    usersList: db.users,
    paymentsList: db.payments
  });
});

// MOUNT VITE DEVELOPMENT MIDDLEWARE OR SERVE STATIC FILES
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR in development to prevent duplicate WebSocket listeners
        watch: {
          usePolling: true,
          interval: 1000,
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      throw new Error(`Production mode requires 'dist' folder. Run 'npm run build' first.`);
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 on port ${PORT}`);
  });
}

startServer();
