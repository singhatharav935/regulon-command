import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Upload, RefreshCw, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/compliance`;

type Employee = { name: string; pan: string; uan: string; esi_number: string; basic_salary: string; da: string; gross_wages: string };

export default function EPFESIPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [activeTab, setActiveTab] = useState<'epf' | 'esi'>('epf');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([{ name: '', pan: '', uan: '', esi_number: '', basic_salary: '', da: '', gross_wages: '' }]);

  const addEmployee = () => setEmployees(prev => [...prev, { name: '', pan: '', uan: '', esi_number: '', basic_salary: '', da: '', gross_wages: '' }]);
  const updateEmployee = (idx: number, field: keyof Employee, value: string) => setEmployees(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const handleCalculate = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        const totalWages = employees.reduce((s, e) => s + parseFloat(e.gross_wages || e.basic_salary || '0'), 0);
        const employeeCont = Math.round(totalWages * (activeTab === 'epf' ? 0.12 : 0.0075));
        const employerCont = Math.round(totalWages * (activeTab === 'epf' ? 0.13 : 0.0325));
        
        setResult({
          summary: {
            total_employees: employees.length,
            total_employee_contribution: employeeCont,
            total_employer_contribution: employerCont,
            total_epf_liability: activeTab === 'epf' ? employeeCont + employerCont : undefined,
            total_esi_liability: activeTab === 'esi' ? employeeCont + employerCont : undefined,
            alert: 'Demo Calculation: Successful.'
          },
          employees: employees.map(e => ({
            employee_name: e.name || 'Demo Employee',
            employee_epf: activeTab === 'epf' ? Math.round(parseFloat(e.basic_salary || '0') * 0.12) : undefined,
            employee_esi: activeTab === 'esi' ? Math.round(parseFloat(e.gross_wages || '0') * 0.0075) : undefined,
            total_employer_cost: activeTab === 'epf' ? Math.round(parseFloat(e.basic_salary || '0') * 0.13) : undefined,
            employer_esi: activeTab === 'esi' ? Math.round(parseFloat(e.gross_wages || '0') * 0.0325) : undefined,
            total_esi: activeTab === 'esi' ? Math.round(parseFloat(e.gross_wages || '0') * 0.04) : undefined,
          }))
        });
        toast.success(`${activeTab.toUpperCase()} calculated (Demo)`);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const endpoint = `${API_BASE}/${activeTab}/calculate`;
      const payload = { client_id: clientId, period_month: periodMonth, period_year: periodYear, employees: employees.map(e => ({ ...e, basic_salary: parseFloat(e.basic_salary || '0'), da: parseFloat(e.da || '0'), gross_wages: parseFloat(e.gross_wages || e.basic_salary || '0') })) };
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success(`${activeTab.toUpperCase()} calculated`); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-cyan-500/20 rounded-lg"><Users className="w-5 h-5 text-cyan-400" /></div>
        <div>
          <h3 className="font-bold text-lg">EPF & ESI Payroll Calculator</h3>
          <p className="text-xs text-muted-foreground">EPF: 12% capped ₹15K wages | ESI: 4.25% capped ₹21K gross wages</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={activeTab === 'epf' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('epf'); setResult(null); }}>EPF (Section 12)</Button>
        <Button variant={activeTab === 'esi' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveTab('esi'); setResult(null); }}>ESI (4.25%)</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Month</label><Input type="number" min={1} max={12} value={periodMonth} onChange={e => setPeriodMonth(parseInt(e.target.value))} className="mt-1" /></div>
        <div><label className="text-xs text-muted-foreground">Year</label><Input type="number" value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))} className="mt-1" /></div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {employees.map((emp, idx) => (
          <div key={idx} className="p-3 border border-border/30 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Employee {idx + 1}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={emp.name} onChange={e => updateEmployee(idx, 'name', e.target.value)} className="text-sm" />
              <Input placeholder="PAN" value={emp.pan} onChange={e => updateEmployee(idx, 'pan', e.target.value)} className="text-sm" />
              {activeTab === 'epf' ? <>
                <Input placeholder="UAN" value={emp.uan} onChange={e => updateEmployee(idx, 'uan', e.target.value)} className="text-sm" />
                <Input placeholder="Basic Salary (₹)" type="number" value={emp.basic_salary} onChange={e => updateEmployee(idx, 'basic_salary', e.target.value)} className="text-sm" />
                <Input placeholder="DA (₹)" type="number" value={emp.da} onChange={e => updateEmployee(idx, 'da', e.target.value)} className="text-sm" />
              </> : <>
                <Input placeholder="ESI Number" value={emp.esi_number} onChange={e => updateEmployee(idx, 'esi_number', e.target.value)} className="text-sm" />
                <Input placeholder="Gross Wages (₹)" type="number" value={emp.gross_wages} onChange={e => updateEmployee(idx, 'gross_wages', e.target.value)} className="text-sm" />
              </>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addEmployee} className="flex-1">+ Add Employee</Button>
        <Button onClick={handleCalculate} disabled={loading} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
          Calculate
        </Button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
            <div className="flex items-start gap-2"><Bell className="w-4 h-4 text-cyan-400 mt-0.5" /><p className="text-sm">{result.summary?.alert}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ label: 'Total Employees', val: result.summary?.total_employees }, { label: 'Employee Contribution', val: `₹${result.summary?.total_employee_contribution?.toLocaleString()}` }, { label: 'Employer Contribution', val: `₹${result.summary?.total_employer_contribution?.toLocaleString()}` }, { label: 'Total Liability', val: `₹${(result.summary?.total_epf_liability || result.summary?.total_esi_liability)?.toLocaleString()}`, highlight: true }].map(s => (
              <div key={s.label} className={`p-3 rounded-lg border ${s.highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-card/50 border-border/30'}`}>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-base font-bold mt-1 ${s.highlight ? 'text-red-400' : ''}`}>{s.val}</p>
              </div>
            ))}
          </div>
          {result.employees && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border/30">{['Name', 'Emp.', 'Empr.', 'Total'].map(h => <th key={h} className="text-left p-2 text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>{result.employees.map((e: any, i: number) => <tr key={i} className="border-b border-border/10"><td className="p-2">{e.employee_name}</td><td className="p-2">₹{(e.employee_epf || e.employee_esi)?.toLocaleString()}</td><td className="p-2">₹{(e.total_employer_cost || e.employer_esi)?.toLocaleString()}</td><td className="p-2 font-bold">₹{(e.total_employer_cost + e.employee_epf || e.total_esi)?.toLocaleString()}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
