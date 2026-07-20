import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EmployeeForm from '@/components/employees/employee-form';

interface EditEmployeeProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: EditEmployeeProps) {
  const { id } = await params;

  // Fetch employee details
  const employee = await db.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    notFound();
  }

  // Fetch active sites and departments
  const [sites, departments] = await Promise.all([
    db.site.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
    db.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Edit Employee Profile</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Update personal, employment, or bank registry settings for <strong>{employee.fullName}</strong>.
        </p>
      </div>

      <EmployeeForm initialData={employee} sites={sites} departments={departments} />
    </div>
  );
}
