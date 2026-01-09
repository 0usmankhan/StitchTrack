
'use client';
import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/app-context';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, FileDown, Settings2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Order, Customer, Invoice, InventoryItem, TimesheetEntry } from '@/lib/types';
import { DateRange } from 'react-day-picker';

type ReportType = 'sales' | 'inventory' | 'customers' | 'timesheet';

const reportOptions = {
  sales: {
    label: 'Sales Report',
    columns: [
      { id: 'date', label: 'Date' },
      { id: 'invoiceId', label: 'Invoice ID' },
      { id: 'customerName', label: 'Customer' },
      { id: 'status', label: 'Status' },
      { id: 'total', label: 'Total Amount' },
      { id: 'amountDue', label: 'Amount Due' },
    ],
  },
  inventory: {
    label: 'Inventory Report',
    columns: [
      { id: 'name', label: 'Item Name' },
      { id: 'category', label: 'Category' },
      { id: 'supplier', label: 'Supplier' },
      { id: 'stock', label: 'Stock' },
      { id: 'reorderLevel', label: 'Reorder Level' },
      { id: 'costPrice', label: 'Cost Price' },
      { id: 'retailPrice', label: 'Retail Price' },
    ],
  },
  customers: {
    label: 'Customer Report',
    columns: [
      { id: 'name', label: 'Name' },
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Phone' },
    ],
  },
  timesheet: {
      label: 'Timesheet Report',
      columns: [
          { id: 'date', label: 'Date' },
          { id: 'startTime', label: 'Start Time' },
          { id: 'endTime', label: 'End Time' },
          { id: 'duration', label: 'Duration' },
          { id: 'notes', label: 'Notes' },
      ],
  },
};

export default function ReportsPage() {
  const { invoices, inventory, customers, timesheetEntries } = useApp();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    reportOptions.sales.columns.map((c) => c.id)
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setSelectedColumns(reportOptions[type].columns.map((c) => c.id));
    setIsReportGenerated(false);
  };

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const generateReport = useCallback(() => {
    let data: any[] = [];
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to;

    switch (reportType) {
      case 'sales':
        data = invoices.filter(i => {
            if (!fromDate || !toDate) return true;
            try {
                const invoiceDate = parseISO(i.date);
                return invoiceDate >= fromDate && invoiceDate <= toDate;
            } catch { return false; }
        }).map(i => ({
          date: format(parseISO(i.date), 'PPP'),
          invoiceId: i.maskedId,
          customerName: i.customer.name,
          status: i.status,
          total: formatCurrency(i.total),
          amountDue: formatCurrency(i.amountDue ?? 0),
        }));
        break;
      
      case 'inventory':
        data = inventory.map(item => ({
            ...item,
            costPrice: formatCurrency(item.costPrice),
            retailPrice: formatCurrency(item.retailPrice),
        }));
        break;
      
      case 'customers':
        data = customers.map(c => ({ name: c.name, email: c.email, phone: c.phone || '-' }));
        break;
      
      case 'timesheet':
         data = timesheetEntries.filter(entry => {
            if (!fromDate || !toDate) return true;
            const entryDate = entry.startTime.toDate();
            return entryDate >= fromDate && entryDate <= toDate;
         }).map(entry => ({
            date: format(entry.startTime.toDate(), 'PPP'),
            startTime: format(entry.startTime.toDate(), 'p'),
            endTime: entry.endTime ? format(entry.endTime.toDate(), 'p') : 'In Progress',
            duration: entry.duration || '-',
            notes: entry.notes || '-',
         }));
         break;
    }

    setReportData(data);
    setIsReportGenerated(true);
  }, [reportType, dateRange, invoices, inventory, customers, timesheetEntries]);
  
  const downloadCSV = () => {
    const headers = selectedColumns.map(colId => reportOptions[reportType].columns.find(c => c.id === colId)?.label).join(',');
    const rows = reportData.map(row => selectedColumns.map(colId => {
        let val = row[colId];
        if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`;
        }
        return val;
    }).join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Dynamic Reports
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Report Builder</CardTitle>
            <CardDescription>
              Configure and generate your custom report.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => handleReportTypeChange(value as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportOptions).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(reportType === 'sales' || reportType === 'timesheet') && (
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
                <Label>Columns</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                           <Settings2 className="mr-2 h-4 w-4"/>
                           Select columns
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                        <div className="space-y-2">
                            {reportOptions[reportType].columns.map(col => (
                                <div key={col.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`col-${col.id}`}
                                        checked={selectedColumns.includes(col.id)}
                                        onCheckedChange={() => handleColumnToggle(col.id)}
                                    />
                                    <Label htmlFor={`col-${col.id}`} className="font-normal">{col.label}</Label>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateReport}>Generate Report</Button>
          </CardFooter>
        </Card>

        {isReportGenerated && (
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <div>
                    <CardTitle>Report Results</CardTitle>
                    <CardDescription>
                        {reportOptions[reportType].label}
                        {dateRange?.from && ` from ${format(dateRange.from, 'PPP')}`}
                        {dateRange?.to && ` to ${format(dateRange.to, 'PPP')}`}
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={downloadCSV}>
                    <FileDown className="mr-2 h-4 w-4"/>
                    Download CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedColumns.map((colId) => (
                        <TableHead key={colId}>
                          {reportOptions[reportType].columns.find(
                            (c) => c.id === colId
                          )?.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.length > 0 ? (
                      reportData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {selectedColumns.map((colId) => (
                            <TableCell key={colId}>{row[colId]}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={selectedColumns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No data found for the selected criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
