import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'HR' && session.role !== 'ADMIN')) {
      return new NextResponse('Unauthorized. Only HR or Admin can export reports.', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // employees, inventory, assets, visitors
    const siteId = searchParams.get('siteId') || undefined;

    if (!type) {
      return new NextResponse('Missing report type query parameter.', { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    let filename = `evoq_report_${type}.xlsx`;

    // Apply header styles helper
    const applyHeaderStyles = (ws: ExcelJS.Worksheet, cols: string[]) => {
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      const row = ws.addRow(cols);
      row.height = 24;
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1C1C1C' }, // Charcoal brand color
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'C5A880' } }, // Gold/Bronze highlight line
        };
      });
    };

    // Auto-fit column widths helper
    const autoFitColumns = (ws: ExcelJS.Worksheet) => {
      ws.columns.forEach((column: any) => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell.value ? String(cell.value) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        column.width = Math.max(maxLen + 4, 12);
      });
    };

    // 1. Employees Report
    if (type === 'employees') {
      const records = await db.employee.findMany({
        where: { siteId },
        include: { department: true, site: true },
        orderBy: { employeeId: 'asc' },
      });

      applyHeaderStyles(worksheet, [
        'Employee ID',
        'Full Name',
        'Personal Email',
        'Mobile Number',
        'Office Site',
        'Department',
        'Designation',
        'Joining Date',
        'Employment Type',
        'Status',
      ]);

      records.forEach((emp) => {
        worksheet.addRow([
          emp.employeeId,
          emp.fullName,
          emp.personalEmail,
          emp.mobileNumber,
          emp.site?.name || '-',
          emp.department?.name || '-',
          emp.designation,
          emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '-',
          emp.employmentType,
          emp.employmentStatus,
        ]);
      });

      autoFitColumns(worksheet);
      filename = `evoq_employees_${siteId || 'all_sites'}.xlsx`;
    }

    // 2. Inventory Report
    else if (type === 'inventory') {
      const records = await db.inventoryItem.findMany({
        where: { siteId },
        include: { category: true, site: true },
        orderBy: { itemCode: 'asc' },
      });

      applyHeaderStyles(worksheet, [
        'Item Code',
        'Item Name',
        'Category',
        'Site Location',
        'Current Stock',
        'Minimum Alert Level',
        'Unit Type',
        'Purchase Rate (INR)',
        'Supplier',
        'Last Restocked',
      ]);

      records.forEach((item) => {
        worksheet.addRow([
          item.itemCode,
          item.name,
          item.category?.name || '-',
          item.site?.name || '-',
          item.currentStock,
          item.minimumStockLevel,
          item.unit,
          item.purchaseRate || 0,
          item.supplier || '-',
          item.lastPurchaseDate ? item.lastPurchaseDate.toISOString().split('T')[0] : '-',
        ]);
      });

      autoFitColumns(worksheet);
      filename = `evoq_inventory_${siteId || 'all_sites'}.xlsx`;
    }

    // 3. Issued Assets Report
    else if (type === 'assets') {
      const records = await db.issuedAsset.findMany({
        where: { siteId },
        include: { item: true, employee: true },
        orderBy: { issueDate: 'desc' },
      });

      applyHeaderStyles(worksheet, [
        'Asset Code',
        'Item Name',
        'Serial Number',
        'Issued Employee Name',
        'Employee ID',
        'Issue Date',
        'Expected Return Date',
        'Condition at Issue',
        'Status',
      ]);

      records.forEach((asset) => {
        worksheet.addRow([
          asset.assetCode,
          asset.item?.name || '-',
          asset.serialNumber || '-',
          asset.employee?.fullName || '-',
          asset.employee?.employeeId || '-',
          asset.issueDate ? asset.issueDate.toISOString().split('T')[0] : '-',
          asset.expectedReturnDate ? asset.expectedReturnDate.toISOString().split('T')[0] : '-',
          asset.conditionAtIssue,
          asset.status,
        ]);
      });

      autoFitColumns(worksheet);
      filename = `evoq_assets_${siteId || 'all_sites'}.xlsx`;
    }

    // 4. Visitors Report
    else if (type === 'visitors') {
      const records = await db.visitor.findMany({
        where: { siteId },
        include: { site: true },
        orderBy: { entryTime: 'desc' },
      });

      applyHeaderStyles(worksheet, [
        'Visitor Name',
        'Phone Number',
        'Company',
        'Category',
        'Purpose of Visit',
        'Host Name (Person Met)',
        'Site Location',
        'Check-In Time',
        'Check-Out Time',
        'Visitor Type',
      ]);

      records.forEach((v) => {
        worksheet.addRow([
          v.name,
          v.phone,
          v.company || '-',
          v.category,
          v.purpose,
          v.personToMeet,
          v.site?.name || '-',
          v.entryTime ? v.entryTime.toISOString().replace('T', ' ').substring(0, 19) : '-',
          v.exitTime ? v.exitTime.toISOString().replace('T', ' ').substring(0, 19) : 'Still Inside',
          v.isExisting ? 'Returning' : 'New',
        ]);
      });

      autoFitColumns(worksheet);
      filename = `evoq_visitors_${siteId || 'all_sites'}.xlsx`;
    }

    // Fallback error
    else {
      return new NextResponse('Invalid report type requested.', { status: 400 });
    }

    // Write file to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('API Report export error:', error);
    return new NextResponse(error.message || 'Report generation failed.', { status: 500 });
  }
}
