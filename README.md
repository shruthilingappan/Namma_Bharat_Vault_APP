# 🇮🇳 Namma Bharat Vault

### Offline-First Financial Safety Assistant

**Namma Bharat Vault** is an offline-first web application designed to help users identify suspicious digital-finance messages, understand potential scam risks, and access simple financial-safety guidance in familiar Indian languages.

> **“Protection should not disappear when the internet does.”**

---

## 🎯 Problem

Digital financial scams such as fake KYC alerts, phishing links, urgent payment requests, OTP requests, and fraudulent loan messages can put users at risk.

For users in areas with limited connectivity, verifying suspicious messages can become more difficult.

Namma Bharat Vault provides a simple safety-checking tool that can continue working even without an active internet connection.

---

## 💡 Solution

Users can paste a suspicious SMS or digital-finance message into the scanner.

The application uses a **local rule-based risk engine** to identify warning signs such as:

* 🔗 Suspicious links
* ⚠️ Urgent or threatening language
* 🪪 Fake KYC requests
* 🔐 OTP requests
* 💳 UPI PIN requests
* 💰 Suspicious payment or fee requests

The scanner then provides:

* Risk score
* Risk level — LOW / MEDIUM / HIGH
* Detected warning signs
* Practical safety guidance

---

## ✨ Features

* 🔍 **Suspicious Message Scanner**
* 📊 **Rule-Based Risk Assessment**
* 🌐 **Multilingual Support**

  * English
  * Tamil
  * Telugu
  * Hindi
  * Malayalam
* 🎤 **Voice Safety Assistant**
* 🤖 **AI-Powered Conversational Assistance**
* 📴 **Offline-First Functionality**
* 📱 **Responsive Web/PWA Interface**
* 🔐 **Secure Server-Side AI Integration**
* 🛡️ **Financial Safety Guidance**

---

## 🏗️ How It Works

```text
User
  ↓
Paste / Speak a Question
  ↓
Message Scanner / Voice Assistant
  ↓
Local Rule-Based Risk Engine
  ↓
Risk Score + Warning Signs + Safety Guidance
  ↓
AI Assistant (when online)
  ↓
Natural-Language Explanation
```

The **local risk engine remains responsible for the actual risk assessment**. AI is used to provide conversational explanations and assistance rather than replacing the scanner.

---

## 📴 Offline-First

The core scanner and safety guidance are stored locally in the browser.

After the application has been loaded and cached, users can continue to:

* Scan suspicious messages
* View risk results
* Access safety guidance
* Use the local assistant fallback

The AI assistant requires an internet connection and is unavailable offline.

---

## 🤖 AI Voice Assistant

The voice assistant allows users to ask natural financial-safety questions such as:

> “OTP ah share pannalama?”

> “What should I do if I lost money in a scam?”

> “UPI PIN yaar kitayum sollalama?”

The assistant is designed to understand multiple Indian languages and provide responses in the user's language whenever possible.

The AI does **not** calculate or modify the scanner's risk score.

---

## 🛠️ Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* Progressive Web App (PWA)
* Service Worker
* Web Speech API

### Risk Detection

* Local rule-based risk engine
* Client-side processing

### AI Backend

* Node.js
* OpenAI API
* Secure environment-variable based API key

---

## 🔐 Security

The AI API key is **never stored in frontend JavaScript**.

The application uses a server-side API endpoint:

```text
POST /api/assistant
```

The API key is stored using:

```text
OPENAI_API_KEY
```

and is kept outside the client-side application.

---

## 🚀 Running Locally

### Prerequisites

* Windows
* Node.js 20.6+
* OpenAI API key for AI functionality

### 1. Clone the repository

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd "Namma Bharat Vault"
```

### 2. Create environment file

```powershell
Copy-Item .env.example .env
```

Open `.env` and add your API key:

```env
OPENAI_API_KEY=your_api_key_here
```

**Never commit `.env` to GitHub.**

### 3. Start the application

```powershell
npm start
```

### 4. Open in browser

```text
http://localhost:8080
```

---

## 📱 Offline Testing

1. Open the application once while online.
2. Allow the service worker to cache the application.
3. Disable internet access.
4. Reload the application.
5. Test the message scanner.

The local scanner should continue working without internet access.

---

## 🎯 Target Users

The project is designed with a focus on:

* Rural women
* Self-Help Groups (SHGs)
* Users with limited digital-finance awareness
* Users experiencing unreliable internet connectivity

The application is intended as a **financial-safety assistance tool**, not as a replacement for banks, payment providers, or official cybercrime authorities.

---

## 🔮 Future Scope

* More Indian language support
* Improved multilingual scam-pattern detection
* Lightweight on-device machine learning
* Updated fraud-pattern databases
* SHG-focused safety tools
* Improved accessibility
* Wider offline capabilities

---

## 👥 Team

### Team Alpha

* **Shruthi** — CSE — Presentation & Communication
* **Kavya Sri** — ECE — Website Development
* **Niviya** — Chemical Engineering — Content & Documentation

### 🎓 FinTech Hackathon 2026

**Project:** Namma Bharat Vault
**Category:** FinTech / Cybersecurity / Financial Inclusion

---

## ⚠️ Disclaimer

Namma Bharat Vault provides general financial-safety guidance and heuristic risk assessment.

It does not guarantee that a message is safe or fraudulent and does not replace official bank support or cybercrime authorities.

If money has already been lost through a suspected financial fraud, users should contact their bank and appropriate official cybercrime support.

---

## ❤️ Vision

**Make digital financial safety simple, accessible and available — even when the internet isn't.**

> **Protection should not disappear when the internet does.**
