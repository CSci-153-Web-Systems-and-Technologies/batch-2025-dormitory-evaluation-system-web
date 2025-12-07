# Dormitory Evaluation System

A modern, comprehensive web application designed to streamline the evaluation and management process for dormitory residents. Built with performance, usability, and aesthetics in mind.

---

## ✨ Key Features

- **Secure Authentication**: Robust role-based access control using Supabase Auth.
- **Comprehensive Evaluation**:
  - **Objective Scoring**: Quantifiable metrics and checklist-based assessments.
  - **Subjective Scoring**: Qualitative reviews and feedback from evaluators.
- **Automated Results & Ranking**: Real-time calculation of scores with dynamic ranking tables and visual indicators for top performers.
- **Advanced Search & Filtering**: Easily find dormers by room number, name, or evaluation status.
- **Period Management**: Flexible tools for admins to manage evaluation periods and criteria.
- **Responsive Design**: Fully optimized for desktops, tablets, and mobile devices.
- **User-Centric UI**: Built with Shadcn UI for a polished, accessible, and consistent user experience.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://l-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tabler.io/icons)
- **Forms**: [React Hook Form](https://react-hook-form.com/)

### Backend & Database
- **BaaS**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Data Fetching**: Supabase SSR / Client

### Tools & Utilities
- **Bundler**: Turbopack (via Next.js)
- **Linting**: ESLint
- **Notifications**: Sonner
- **Emails**: SMTP

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/dormitory-evaluation-system.git
    cd dormitory-evaluation-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## � Usage Guide

### For Administrators
1.  **Log In**: Use your admin credentials to access the secure dashboard.
2.  **Manage Periods**: Create new evaluation periods and configure scoring criteria.
3.  **Monitor Progress**: Track ongoing evaluations and ensure timely completion.
4.  **View Analytics**: Access comprehensive reports and real-time rankings of 
dormers.
5.   **Conduct Evaluation**:
      * **Objective**: Complete checklist-based assessments (cleanliness, orderliness, etc.).

### For Evaluators
1.  **Access Assignments**: Log in from the email sent to view the list of dormers or rooms assigned for evaluation.
2.  **Conduct Evaluation**:
    *   **Subjective**: Provide qualitative feedback and rating scores based on observations.
3.  **Submit**: Review and submit evaluations. The system automatically calculates and saves the scores.

---

## �📂 Project Structure

```bash
├── 📁 src
│   ├── 📁 app               # Next.js App Router
│   │   ├── 📁 (auth)        # Authentication routes (login, cancel)
│   │   ├── 📁 (protected)   # Secure admin routes (dashboard, users, periods)
│   │   ├── 📁 api           # Backend API endpoints
│   │   ├── 📁 evaluator     # Evaluator-specific external interfaces
│   │   ├── � globals.css   # Global styles and Tailwind directives
│   │   └── 📄 page.tsx      # Landing page
│   ├── �📁 components        # React components
│   │   ├── 📁 ui            # Reusable UI primitives (Shadcn UI)
│   │   └── ...              # Feature-specific components (forms, nav)
│   ├── 📁 hooks             # Custom React hooks
│   ├── 📁 lib               # Utilities, Supabase clients, and helper functions
│   ├── 📁 types             # TypeScript type definitions
│   └── 📄 middleware.ts     # Edge middleware for auth protection
├── 📄 public                # Static assets (images, icons)
├── 📄 tailwind.config.ts    # Tailwind CSS configuration
└── 📄 package.json          # Dependencies and scripts
```

---

