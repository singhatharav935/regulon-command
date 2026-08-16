import { useState } from 'react';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  useCompanyEmployees,
  useAddEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
  usePayrollRecords,
  useCreatePayroll,
  useUpdatePayroll,
  useGSTFilings,
  useCreateGSTFiling,
  useUpdateGSTFiling,
  useInvoices,
  useAddInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
  useTaxPlans,
  useCreateTaxPlan,
  useUpdateTaxPlan,
  useDeleteTaxPlan,
} from '@/hooks/personas/useInhouseCAOperations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Edit2, DollarSign, Users, FileText, TrendingUp } from 'lucide-react';

type Employee = {
  id?: string;
  company_id?: string;
  employee_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  salary_amount?: number;
  date_of_joining?: string;
  aadhaar_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type Payroll = {
  id?: string;
  employee_id: string;
  payroll_month: string;
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  tax_amount?: number;
  net_salary?: number;
  status?: string;
  processed_date?: string;
  created_at?: string;
  updated_at?: string;
};

type Invoice = {
  id?: string;
  company_id?: string;
  invoice_number: string;
  invoice_date?: string;
  party_name?: string;
  party_gst?: string;
  invoice_amount?: number;
  tax_amount?: number;
  invoice_type?: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

type Expense = {
  id?: string;
  company_id?: string;
  expense_category: string;
  expense_amount: number;
  expense_date: string;
  vendor_name?: string;
  description?: string;
  receipt_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type TaxPlan = {
  id?: string;
  company_id?: string;
  plan_name: string;
  tax_year: string;
  estimated_tax_liability?: number;
  recommended_provisions?: number;
  investment_recommendations?: string;
  created_at?: string;
  updated_at?: string;
};

type GSTFiling = {
  id?: string;
  company_id?: string;
  filing_period: string;
  gstr1_amount?: number;
  gstr2_amount?: number;
  gstr3b_amount?: number;
  tax_payable?: number;
  filing_status?: string;
  filing_date?: string;
  due_date?: string;
  late_fee?: number;
  created_at?: string;
  updated_at?: string;
};

// ===== EMPLOYEE MANAGEMENT =====
function EmployeeManagement({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Employee>({
    employee_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    salary_amount: 0,
    date_of_joining: new Date().toISOString().split('T')[0],
    aadhaar_number: '',
    pan_number: '',
    bank_account_number: '',
    status: 'active',
  });

  const { data: employees = [], isLoading } = useCompanyEmployees(companyId);
  const addMutation = useAddEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      if (!formData.employee_name || !formData.email) {
        toast({
          title: 'Validation Error',
          description: 'Name and email are required',
          variant: 'destructive',
        });
        return;
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          ...formData,
          id: editingId,
          company_id: companyId,
        } as any);
      } else {
        await addMutation.mutateAsync({
          ...formData,
          company_id: companyId,
        } as any);
      }

      setFormData({
        employee_name: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        salary_amount: 0,
        date_of_joining: new Date().toISOString().split('T')[0],
        aadhaar_number: '',
        pan_number: '',
        bank_account_number: '',
        status: 'active',
      });
      setEditingId(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-white">Employee Management</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  employee_name: '',
                  email: '',
                  phone: '',
                  designation: '',
                  department: '',
                  salary_amount: 0,
                  date_of_joining: new Date().toISOString().split('T')[0],
                  aadhaar_number: '',
                  pan_number: '',
                  bank_account_number: '',
                  status: 'active',
                });
              }}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingId ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Employee Name *</Label>
                <Input
                  value={formData.employee_name}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_name: e.target.value })
                  }
                  placeholder="Full name"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    placeholder="Job title"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Department"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Salary (Monthly)</Label>
                  <Input
                    type="number"
                    value={formData.salary_amount || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">PAN</Label>
                  <Input
                    value={formData.pan_number}
                    onChange={(e) =>
                      setFormData({ ...formData, pan_number: e.target.value })
                    }
                    placeholder="PAN number"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Aadhaar</Label>
                  <Input
                    value={formData.aadhaar_number}
                    onChange={(e) =>
                      setFormData({ ...formData, aadhaar_number: e.target.value })
                    }
                    placeholder="Aadhaar number"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Bank Account</Label>
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_account_number: e.target.value })
                  }
                  placeholder="Bank account number"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={addMutation.isPending || updateMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {editingId ? 'Update Employee' : 'Add Employee'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Designation</TableHead>
                <TableHead className="text-gray-300">Salary</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300">{emp.employee_name}</TableCell>
                    <TableCell className="text-gray-300">{emp.email}</TableCell>
                    <TableCell className="text-gray-300">{emp.designation}</TableCell>
                    <TableCell className="text-gray-300">
                      ₹{emp.salary_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          emp.status === 'active'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300 space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(emp);
                          setEditingId(emp.id as string);
                          setIsOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => emp.id && deleteMutation.mutate(emp.id)}
                        className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== PAYROLL MANAGEMENT =====
function PayrollManagement({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Payroll>({
    employee_id: '',
    payroll_month: new Date().toISOString().split('T')[0],
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    tax_amount: 0,
    status: 'draft',
  });

  const { data: employees = [] } = useCompanyEmployees(companyId);
  const { data: payrolls = [], isLoading } = usePayrollRecords(companyId);
  const createMutation = useCreatePayroll();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.employee_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    await createMutation.mutateAsync({
      ...formData,
      employee_id: formData.employee_id,
    } as any);

    setFormData({
      employee_id: '',
      payroll_month: new Date().toISOString().split('T')[0],
      basic_salary: 0,
      allowances: 0,
      deductions: 0,
      tax_amount: 0,
      status: 'draft',
    });
    setIsOpen(false);
  };

  const calculateNetSalary = (record: any) => {
    return (record.basic_salary || 0) + (record.allowances || 0) - (record.deductions || 0) - (record.tax_amount || 0);
  };

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <CardTitle className="text-white">Payroll Management</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Create Payroll Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Employee *</Label>
                <Select value={formData.employee_id} onValueChange={(val) => setFormData({ ...formData, employee_id: val })}>
                  <SelectTrigger className="bg-slate-600 border-gray-500 text-white">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-600 border-gray-500">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id || ''} className="text-white">
                        {emp.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Payroll Month</Label>
                <Input
                  type="date"
                  value={formData.payroll_month}
                  onChange={(e) => setFormData({ ...formData, payroll_month: e.target.value })}
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Basic Salary</Label>
                  <Input
                    type="number"
                    value={formData.basic_salary || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basic_salary: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Allowances</Label>
                  <Input
                    type="number"
                    value={formData.allowances || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowances: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Deductions</Label>
                  <Input
                    type="number"
                    value={formData.deductions || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deductions: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tax Amount</Label>
                  <Input
                    type="number"
                    value={formData.tax_amount || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Create Payroll
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">Month</TableHead>
                <TableHead className="text-gray-300">Basic</TableHead>
                <TableHead className="text-gray-300">Allowances</TableHead>
                <TableHead className="text-gray-300">Deductions</TableHead>
                <TableHead className="text-gray-300">Tax</TableHead>
                <TableHead className="text-gray-300">Net</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    No payroll records found
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((record) => (
                  <TableRow key={record.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300">{record.payroll_month}</TableCell>
                    <TableCell className="text-gray-300">₹{record.basic_salary?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">₹{record.allowances?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">₹{record.deductions?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">₹{record.tax_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      ₹{calculateNetSalary(record).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          record.status === 'processed'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== GST FILING TRACKER =====
function GSTFilingTracker({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    filing_period: new Date().toISOString().split('T')[0],
    gstr1_amount: 0,
    gstr2_amount: 0,
    gstr3b_amount: 0,
    tax_payable: 0,
    filing_status: 'pending',
    due_date: '',
  });

  const { data: filings = [], isLoading } = useGSTFilings(companyId);
  const createMutation = useCreateGSTFiling();

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      ...formData,
      company_id: companyId,
    } as any);
    setFormData({
      filing_period: new Date().toISOString().split('T')[0],
      gstr1_amount: 0,
      gstr2_amount: 0,
      gstr3b_amount: 0,
      tax_payable: 0,
      filing_status: 'pending',
      due_date: '',
    });
    setIsOpen(false);
  };

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <CardTitle className="text-white">GST Filing Tracker</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Filing
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Create GST Filing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Filing Period</Label>
                <Input
                  type="date"
                  value={formData.filing_period}
                  onChange={(e) => setFormData({ ...formData, filing_period: e.target.value })}
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">GSTR-1 Amount</Label>
                  <Input
                    type="number"
                    value={formData.gstr1_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gstr1_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">GSTR-2 Amount</Label>
                  <Input
                    type="number"
                    value={formData.gstr2_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gstr2_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">GSTR-3B Amount</Label>
                  <Input
                    type="number"
                    value={formData.gstr3b_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gstr3b_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tax Payable</Label>
                  <Input
                    type="number"
                    value={formData.tax_payable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_payable: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Create Filing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : filings.length === 0 ? (
            <p className="text-gray-400">No GST filings found</p>
          ) : (
            filings.map((filing) => (
              <div
                key={filing.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded border border-gray-600"
              >
                <div>
                  <p className="text-white font-medium">{filing.filing_period}</p>
                  <p className="text-sm text-gray-400">
                    Tax Payable: ₹{filing.tax_payable?.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    filing.filing_status === 'filed'
                      ? 'bg-green-900 text-green-300'
                      : filing.filing_status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                  }`}
                >
                  {filing.filing_status}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== INVOICE MANAGEMENT =====
function InvoiceManagement({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Invoice>({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    party_name: '',
    party_gst: '',
    invoice_amount: 0,
    tax_amount: 0,
    invoice_type: 'sales',
    payment_status: 'pending',
  });

  const { data: invoices = [], isLoading } = useInvoices(companyId);
  const addMutation = useAddInvoice();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.invoice_number) {
      toast({
        title: 'Validation Error',
        description: 'Invoice number is required',
        variant: 'destructive',
      });
      return;
    }

    await addMutation.mutateAsync({
      ...formData,
      company_id: companyId,
    } as any);

    setFormData({
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      party_name: '',
      party_gst: '',
      invoice_amount: 0,
      tax_amount: 0,
      invoice_type: 'sales',
      payment_status: 'pending',
    });
    setIsOpen(false);
  };

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-400" />
          <CardTitle className="text-white">Invoice Management</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Invoice Number *</Label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_number: e.target.value })
                    }
                    placeholder="INV-001"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Invoice Date</Label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Party Name</Label>
                  <Input
                    value={formData.party_name}
                    onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                    placeholder="Party name"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Party GST</Label>
                  <Input
                    value={formData.party_gst}
                    onChange={(e) => setFormData({ ...formData, party_gst: e.target.value })}
                    placeholder="GST number"
                    className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Invoice Amount</Label>
                  <Input
                    type="number"
                    value={formData.invoice_amount || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tax Amount</Label>
                  <Input
                    type="number"
                    value={formData.tax_amount || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-gray-500 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Invoice Type</Label>
                  <Select value={formData.invoice_type || ''} onValueChange={(val) => setFormData({ ...formData, invoice_type: val })}>
                    <SelectTrigger className="bg-slate-600 border-gray-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-600 border-gray-500">
                      <SelectItem value="sales" className="text-white">Sales</SelectItem>
                      <SelectItem value="purchase" className="text-white">Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Payment Status</Label>
                  <Select value={formData.payment_status || ''} onValueChange={(val) => setFormData({ ...formData, payment_status: val })}>
                    <SelectTrigger className="bg-slate-600 border-gray-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-600 border-gray-500">
                      <SelectItem value="pending" className="text-white">Pending</SelectItem>
                      <SelectItem value="paid" className="text-white">Paid</SelectItem>
                      <SelectItem value="overdue" className="text-white">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={addMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">Invoice #</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Party</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Tax</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300">{inv.invoice_number}</TableCell>
                    <TableCell className="text-gray-300">{inv.invoice_date}</TableCell>
                    <TableCell className="text-gray-300">{inv.party_name}</TableCell>
                    <TableCell className="text-gray-300">₹{inv.invoice_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">₹{inv.tax_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">{inv.invoice_type}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          inv.payment_status === 'paid'
                            ? 'bg-green-900 text-green-300'
                            : inv.payment_status === 'pending'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== EXPENSE TRACKER =====
function ExpenseTracker({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Expense>({
    expense_category: '',
    expense_amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    description: '',
    status: 'pending',
  });

  const { data: expenses = [], isLoading } = useExpenses(companyId);
  const addMutation = useAddExpense();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.expense_category || !formData.expense_amount) {
      toast({
        title: 'Validation Error',
        description: 'Category and amount are required',
        variant: 'destructive',
      });
      return;
    }

    await addMutation.mutateAsync({
      ...formData,
      company_id: companyId,
    } as any);

    setFormData({
      expense_category: '',
      expense_amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      vendor_name: '',
      description: '',
      status: 'pending',
    });
    setIsOpen(false);
  };

  const categories = [
    'Salary & Wages',
    'Office Rent',
    'Utilities',
    'Travel',
    'Meals',
    'Office Supplies',
    'Software Licenses',
    'Maintenance',
    'Other',
  ];

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.expense_amount || 0), 0);

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-red-400" />
          <CardTitle className="text-white">Expense Tracker</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Category *</Label>
                <Select value={formData.expense_category} onValueChange={(val) => setFormData({ ...formData, expense_category: val })}>
                  <SelectTrigger className="bg-slate-600 border-gray-500 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-600 border-gray-500">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Amount *</Label>
                <Input
                  type="number"
                  value={formData.expense_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expense_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Vendor</Label>
                <Input
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="Vendor name"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={addMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-slate-700 rounded border border-gray-600">
          <p className="text-gray-300 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-gray-400">No expenses found</p>
          ) : (
            expenses.slice(0, 10).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2 bg-slate-700 rounded border border-gray-600"
              >
                <div>
                  <p className="text-white text-sm font-medium">{exp.expense_category}</p>
                  <p className="text-xs text-gray-400">{exp.expense_date}</p>
                </div>
                <p className="text-red-400 font-semibold">₹{exp.expense_amount?.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== TAX PLANNER =====
function TaxPlanner({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TaxPlan>({
    plan_name: '',
    tax_year: new Date().getFullYear().toString(),
    estimated_tax_liability: 0,
    recommended_provisions: 0,
    investment_recommendations: '',
  });

  const { data: plans = [], isLoading } = useTaxPlans(companyId);
  const createMutation = useCreateTaxPlan();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.plan_name) {
      toast({
        title: 'Validation Error',
        description: 'Plan name is required',
        variant: 'destructive',
      });
      return;
    }

    await createMutation.mutateAsync({
      ...formData,
      company_id: companyId,
    } as any);

    setFormData({
      plan_name: '',
      tax_year: new Date().getFullYear().toString(),
      estimated_tax_liability: 0,
      recommended_provisions: 0,
      investment_recommendations: '',
    });
    setIsOpen(false);
  };

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <CardTitle className="text-white">Tax Planner</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-700 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Create Tax Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Plan Name *</Label>
                <Input
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  placeholder="e.g., FY 2024-25 Tax Plan"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-300">Tax Year</Label>
                <Input
                  value={formData.tax_year}
                  onChange={(e) => setFormData({ ...formData, tax_year: e.target.value })}
                  placeholder="2024"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="text-gray-300">Estimated Tax Liability</Label>
                <Input
                  type="number"
                  value={formData.estimated_tax_liability || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_tax_liability: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Recommended Provisions</Label>
                <Input
                  type="number"
                  value={formData.recommended_provisions || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recommended_provisions: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-600 border-gray-500 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Investment Recommendations</Label>
                <Input
                  value={formData.investment_recommendations || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      investment_recommendations: e.target.value,
                    })
                  }
                  placeholder="e.g., Invest in Section 80C instruments"
                  className="bg-slate-600 border-gray-500 text-white placeholder-gray-400"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Create Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : plans.length === 0 ? (
          <p className="text-gray-400">No tax plans created yet</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="p-3 bg-slate-700 rounded border border-gray-600">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{plan.plan_name}</p>
                  <p className="text-xs text-gray-400">FY {plan.tax_year}</p>
                </div>
                <p className="text-yellow-400 font-semibold">
                  ₹{plan.estimated_tax_liability?.toLocaleString()}
                </p>
              </div>
              {plan.investment_recommendations && (
                <p className="text-sm text-gray-300 mt-2">{plan.investment_recommendations}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ===== MAIN DASHBOARD =====
export function InhouseCADashboardFull() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">In-house CA Dashboard</h1>
            <p className="text-gray-400 mt-2">Tax, Payroll & Compliance Management - Phase 4</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-white border-gray-500">
            Switch Role
          </Button>
        </div>

        <Card className="bg-slate-800 border-gray-600 mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="p-3 bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Company</p>
                  <p className="text-white font-semibold">{currentUser.companyName}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-4"
              >
                <div className="p-3 bg-green-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Payroll</p>
                  <p className="text-white font-semibold">Ready</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-4"
              >
                <div className="p-3 bg-purple-900 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Compliance</p>
                  <p className="text-white font-semibold">Active</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <EmployeeManagement companyId={currentUser.company_id || ''} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PayrollManagement companyId={currentUser.company_id || ''} />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GSTFilingTracker companyId={currentUser.company_id || ''} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <TaxPlanner companyId={currentUser.company_id || ''} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <InvoiceManagement companyId={currentUser.company_id || ''} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <ExpenseTracker companyId={currentUser.company_id || ''} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
