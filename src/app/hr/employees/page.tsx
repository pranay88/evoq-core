import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface SearchParams {
  search?: string;
  siteId?: string;
  departmentId?: string;
  status?: string;
  sort?: string;
  page?: string;
}

export default async function EmployeesPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const search = searchParams.search || '';
  const siteId = searchParams.siteId || session?.siteId || '';
  const departmentId = searchParams.departmentId || '';
  const status = searchParams.status || '';
  const sort = searchParams.sort || 'fullName';
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 10;

  // Build filter conditions for Prisma
  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { employeeId: { contains: search } },
      { personalEmail: { contains: search } },
      { officialEmail: { contains: search } },
      { designation: { contains: search } },
      { mobileNumber: { contains: search } },
    ];
  }

  if (siteId) {
    where.siteId = siteId;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (status) {
    where.employmentStatus = status;
  }

  // Determine sort order
  let orderBy: any = {};
  if (sort === 'joiningDate') {
    orderBy = { joiningDate: 'desc' };
  } else if (sort === 'employeeId') {
    orderBy = { employeeId: 'asc' };
  } else {
    orderBy = { fullName: 'asc' };
  }

  // Fetch count and paginated list
  const [employees, totalCount] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        department: true,
        site: true,
      },
    }),
    db.employee.count({ where }),
  ]);

  // Fetch sites and departments for dropdown filters
  const [sites, departments] = await Promise.all([
    db.site.findMany({ where: { status: 'ACTIVE' } }),
    db.department.findMany({ where: { status: 'ACTIVE' } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Status badge colors helper
  const getStatusBadgeClass = (empStatus: string) => {
    switch (empStatus) {
      case 'ACTIVE':
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'PROBATION':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'NOTICE_PERIOD':
      case 'NOTICE':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      case 'LEAVE':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Manage employee files, onboarding verification, and organizational designations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/hr/reports?type=employees"
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground text-sm font-sans rounded-md transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Export Directory
          </Link>
          <Link
            href="/hr/employees/add"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-sans font-medium rounded-md shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-5 bg-card border border-border rounded-lg shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by name, ID, designation..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans"
            />
          </div>

          {/* Site Filter */}
          <div>
            <select
              name="siteId"
              defaultValue={siteId}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans text-muted-foreground"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              name="departmentId"
              defaultValue={departmentId}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans text-muted-foreground"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              defaultValue={status}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans text-muted-foreground"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="LEAVE">On Leave</option>
              <option value="NOTICE">Notice Period</option>
              <option value="INACTIVE">Inactive / Resigned</option>
            </select>
          </div>

          {/* Hidden sorting parameter to preserve sort choice */}
          <input type="hidden" name="sort" value={sort} />
          
          <div className="lg:col-span-5 flex justify-end gap-2 mt-2">
            <Link
              href="/hr/employees"
              className="px-4 py-2 border border-border bg-card hover:bg-secondary text-sm font-sans rounded-md transition-colors"
            >
              Clear Filters
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-secondary text-foreground hover:bg-accent border border-border font-sans font-medium text-sm rounded-md transition-colors"
            >
              Apply filters
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Department
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Designation
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Site Location
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Joining Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground font-sans">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground font-sans">
                      {emp.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/hr/employees/${emp.id}`} className="group block select-none">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-sans font-semibold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground font-sans group-hover:text-primary group-hover:underline transition-all">
                              {emp.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground font-sans">{emp.personalEmail}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-sans">
                      {emp.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-sans">
                      {emp.designation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-sans">
                      {emp.site?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeClass(emp.employmentStatus)}`}>
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-sans">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-primary transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-sans">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records
            </span>
            <div className="flex gap-2">
              <Link
                href={{
                  query: { ...searchParams, page: Math.max(1, page - 1).toString() },
                }}
                className={`p-1.5 border border-border rounded-md bg-card text-muted-foreground hover:text-foreground transition-colors ${
                  page === 1 ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={{
                  query: { ...searchParams, page: Math.min(totalPages, page + 1).toString() },
                }}
                className={`p-1.5 border border-border rounded-md bg-card text-muted-foreground hover:text-foreground transition-colors ${
                  page === totalPages ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
