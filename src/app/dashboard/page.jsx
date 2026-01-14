import { redirect } from '@/lib/next-polyfills';

export default function DashboardRedirect() {
  redirect('/');
}
