import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const role = session.role;

  if (role === 'HR') {
    redirect('/hr/dashboard');
  } else if (role === 'ADMIN') {
    redirect('/admin/dashboard');
  } else if (role === 'FRONT_DESK') {
    redirect('/frontdesk/dashboard');
  }

  redirect('/login');
}
