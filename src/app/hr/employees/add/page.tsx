import { db } from '@/lib/db';
import EmployeeForm from '@/components/employees/employee-form';

export default async function AddEmployeePage() {
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
        <h1 className="text-3xl font-serif text-foreground">Add New Employee</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Create a new employee profile. Fill in personal, employment, and banking details.
        </p>
      </div>

      <EmployeeForm sites={sites} departments={departments} />
    </div>
  );
}
