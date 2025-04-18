# Blitzly - AI-Powered Client Report Generator

Blitzly helps marketing agencies, freelancers, and consultants instantly generate professional client performance reports using Groq's ultra-fast AI. No manual writing. Just plug in KPIs — and you're done.

## Features

- 🚀 Instant report generation using Groq's ultra-fast AI
- 📊 Support for multiple metrics (SEO, ads, social media, etc.)
- 🎨 Beautiful, professional report templates
- 🔒 Secure authentication and data protection
- 💳 Subscription-based pricing with Stripe integration
- 📧 Email notifications with Resend
- 🌙 Dark mode support
- 🔄 Real-time updates

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: Groq API
- **Payment Processing**: Stripe
- **Email**: Resend
- **Deployment**: Vercel (Frontend) and Railway (Backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Groq API key
- Stripe account
- Resend account

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blitzly"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Groq AI
GROQ_API_KEY="your-groq-api-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Resend
RESEND_API_KEY="your-resend-api-key"
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/blitzly.git
   cd blitzly
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

### Backend (Railway)

1. Create a new project in Railway
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

## Deployment to Vercel

Follow these steps to deploy Blitzly to Vercel in production mode:

### Prerequisites

1. A Vercel account
2. A PostgreSQL database (can be provisioned through Vercel, Supabase, Neon, etc.)
3. Google OAuth credentials for authentication
4. API keys for other services (Groq AI, Stripe, Resend)

### Deployment Steps

1. **Push your code to GitHub**

2. **Connect to Vercel**

   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select "Next.js" as the framework preset

3. **Configure Environment Variables**
   Set the following environment variables in the Vercel project settings:

   ```
   # Database
   DATABASE_URL=your_postgres_connection_string

   # NextAuth
   NEXTAUTH_URL=https://your-production-url.vercel.app
   NEXTAUTH_SECRET=your_generated_secret

   # OAuth Providers
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Groq AI
   GROQ_API_KEY=your_groq_api_key

   # Stripe (if applicable)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Resend (if applicable)
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Deploy**

   - Click "Deploy"
   - Vercel will automatically build and deploy your application

5. **Set up a Database**

   - If you haven't set up a PostgreSQL database yet, you can use Vercel Postgres, Supabase, or any other PostgreSQL provider
   - Make sure your DATABASE_URL is correctly set in the environment variables

6. **Run Database Migrations**
   - Vercel will automatically run prisma migrations on each deployment (this is configured in our build script)

### Post-Deployment

1. **Update Google OAuth Redirect URI**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Add your production domain as an authorized redirect URI: `https://your-production-url.vercel.app/api/auth/callback/google`

2. **Set up Stripe Webhooks (if applicable)**

   - Create a new webhook endpoint in your Stripe dashboard pointing to: `https://your-production-url.vercel.app/api/webhooks/stripe`
   - Update the STRIPE_WEBHOOK_SECRET environment variable with the new secret

3. **Configure Custom Domain (Optional)**
   - In the Vercel dashboard, go to your project settings
   - Click on "Domains" and add your custom domain

## Development

To run this application locally:

```bash
# Install dependencies
npm install

# Set up your .env file with the necessary variables

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Notes

- All API routes in this application are dynamic and will be server-rendered.
- The warnings about "Dynamic server usage" during build are normal for this type of application.
- Make sure to keep your environment variables secure and never commit them to your repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
