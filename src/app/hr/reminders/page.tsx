import { redirect } from 'next/navigation';

export default function HrRemindersPage() {
  redirect('/hr/calendar?tab=reminders');
}
