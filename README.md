# UFriends Platform

UFriends is a comprehensive digital services platform designed to streamline verification services (BVN, NIN, CAC), wallet management, and marketer operations. Built with modern web technologies, it provides a robust, secure, and scalable solution for managing digital transactions and utility services.

## 🚀 Key Features

- **Service Automation:** Automated processing for BVN (printouts, validation, modification), NIN (slip retrieval, verification), and CAC registrations.
- **Wallet System:** Integrated wallet for fast payments, supporting multiple funding methods (Monnify, Manual Transfer).
- **User Roles:** Distinct dashboards for **Users**, **Marketers**, and **Administrators**.
- **Security:**
  - **Two-Factor Authentication (2FA):** Enhanced account security using OTP.
  - **Arcjet Integration:** Real-time bot detection and security shield.
  - **JWT Authentication:** Secure API access with token rotation.
  - **XSS Protection:** Built-in sanitization for user-generated content.
- **Admin Suite:** Comprehensive logs, transaction management, provider configuration, and user oversight.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/)
- **Database:** [Prisma ORM](https://www.prisma.io/) with PostgreSQL/MySQL.
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) & [jose](https://github.com/panva/jose).
- **Security:** [Arcjet](https://arcjet.com/), [zod-xss-sanitizer](https://github.com/lewis-back/zod-xss-sanitizer).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/).
- **Validation:** [Zod](https://zod.dev/), [Joi](https://joi.dev/).

## 💻 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm / pnpm / yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone [repository-url]
   cd ufriends-version-1
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on `.env.example`:

   ```env
   DATABASE_URL="your-database-url"
   NEXTAUTH_SECRET="your-secret"
   ARCJET_KEY="your-arcjet-key"
   # Add other required environment variables
   ```

4. **Database Configuration:**

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5070`.

## 📦 Deployment

### Production Build

```bash
npm run build
npm run start
```

### VPS Hosting with PM2

To host this application on a VPS, use the provided `ecosystem.config.js` file.

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Start the application:**

   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Ports:**
   By default, the production app runs on **Port 5070** (excluding 3000, 3001, 3050, 5000, 5001).

## 📁 Project Structure

- `/app`: Next.js App Router (Pages & API Routes).
- `/components`: Reusable UI components.
- `/lib`: Shared utilities, JWT handling, and database client.
- `/prisma`: Database schema and seed scripts.
- `/scripts`: Smoke tests and utility scripts for admin tasks.
- `/public`: Static assets.

## 🛡 Security & Best Practices

- All API routes are protected via NextAuth sessions or Bearer tokens.
- Sensitive environment variables are ignored via `.gitignore`.
- Rate limiting and bot detection are enforced via Arcjet.

## 📄 License

Private Project. All rights reserved.
