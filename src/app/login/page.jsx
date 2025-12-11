import { getUser } from '@/engine/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect('/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-lg bg-primary mx-auto mb-4 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p className="font-mono">admin@example.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Login',
};
