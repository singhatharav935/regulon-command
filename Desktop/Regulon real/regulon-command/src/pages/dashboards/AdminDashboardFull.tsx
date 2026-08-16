// Admin Dashboard - Full Implementation
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { usePersonaAuth } from "@/lib/persona-auth-context";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Edit, Trash2, Eye, DownloadIcon, AlertTriangle } from "lucide-react";
import {
  useAdminUsers,
  useAddAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useCompanyRegistry,
  useAddCompany,
  useUpdateCompany,
  useUserRoles,
  useAssignUserRole,
  useRemoveUserRole,
  useAuditLogs,
  useSystemSettings,
  useUpdateSystemSetting,
  useSystemHealth,
} from "@/hooks/personas/useAdminData";
import { useToast } from "@/hooks/use-toast";

// ============ USER MANAGEMENT SECTION ============

function UserManagement() {
  const { data: users = [], isLoading, error } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) return <div className="text-center py-8">Loading users...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading users</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Admin Users</CardTitle>
        <AddUserForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-gray-500 text-white"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px] bg-slate-700 border-gray-500 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Last Login</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300">{user.email}</TableCell>
                    <TableCell className="text-gray-300">{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <EditUserDialog user={user} />
                      <DeleteUserDialog userId={user.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-gray-400 text-sm">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "admin" as const,
  });
  const addUserMutation = useAddAdminUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(
      {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        status: "active",
        permissions: [],
      },
      {
        onSuccess: () => {
          setFormData({ email: "", full_name: "", role: "admin" });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Create Admin User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Role</label>
            <Select
              value={formData.role}
              onValueChange={(value: any) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-gray-500 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={addUserMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700 w-full"
          >
            {addUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    role: user.role,
    status: user.status,
  });
  const updateUserMutation = useUpdateAdminUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(
      { id: user.id, updates: formData },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-gray-500">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Admin User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Role</label>
            <Select
              value={formData.role}
              onValueChange={(value: any) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-gray-500 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-gray-300 text-sm">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-gray-500 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={updateUserMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700 w-full"
          >
            {updateUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ userId }: { userId: string }) {
  const deleteUserMutation = useDeleteAdminUser();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-600 text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-800 border-gray-600">
        <AlertDialogTitle className="text-white">Delete Admin User</AlertDialogTitle>
        <AlertDialogDescription className="text-gray-300">
          Are you sure you want to delete this user? This action cannot be undone.
        </AlertDialogDescription>
        <div className="flex gap-4">
          <AlertDialogCancel className="bg-slate-700 text-gray-300 border-gray-600">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteUserMutation.mutate(userId)}
            disabled={deleteUserMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============ COMPANY MANAGEMENT SECTION ============

function CompanyManagement() {
  const { data: companies = [], isLoading, error } = useCompanyRegistry();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="text-center py-8">Loading companies...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading companies</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Company Registry</CardTitle>
        <AddCompanyForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by company name or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-gray-500 text-white"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-slate-700 border-gray-500 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Company Name</TableHead>
                  <TableHead className="text-gray-300">Reg. Number</TableHead>
                  <TableHead className="text-gray-300">Industry</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Employees</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300 font-medium">
                      {company.company_name}
                    </TableCell>
                    <TableCell className="text-gray-400">{company.registration_number}</TableCell>
                    <TableCell className="text-gray-400">{company.industry}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          company.status === "active" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{company.contact_email}</TableCell>
                    <TableCell className="text-gray-400">{company.employees_count}</TableCell>
                    <TableCell className="space-x-2">
                      <EditCompanyDialog company={company} />
                      <ViewCompanyDetails company={company} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-gray-400 text-sm">
            Showing {filteredCompanies.length} of {companies.length} companies
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCompanyForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    registration_number: "",
    cin: "",
    tan: "",
    industry: "",
    employees_count: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  });
  const addCompanyMutation = useAddCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addCompanyMutation.mutate(
      {
        company_name: formData.company_name,
        registration_number: formData.registration_number,
        cin: formData.cin || undefined,
        tan: formData.tan || undefined,
        industry: formData.industry,
        employees_count: parseInt(formData.employees_count),
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        status: "active",
        registered_date: new Date().toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          setFormData({
            company_name: "",
            registration_number: "",
            cin: "",
            tan: "",
            industry: "",
            employees_count: "",
            contact_email: "",
            contact_phone: "",
            address: "",
          });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Register Company
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Register New Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm">Company Name *</label>
              <Input
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Registration Number *</label>
              <Input
                value={formData.registration_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_number: e.target.value,
                  })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">CIN</label>
              <Input
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                className="bg-slate-700 border-gray-500 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">TAN</label>
              <Input
                value={formData.tan}
                onChange={(e) => setFormData({ ...formData, tan: e.target.value })}
                className="bg-slate-700 border-gray-500 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Industry *</label>
              <Input
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Employee Count *</label>
              <Input
                type="number"
                value={formData.employees_count}
                onChange={(e) =>
                  setFormData({ ...formData, employees_count: e.target.value })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Contact Email *</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Contact Phone *</label>
              <Input
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                className="bg-slate-700 border-gray-500 text-white mt-1"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm">Address *</label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={addCompanyMutation.isPending}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            {addCompanyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Register Company
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({ company }: { company: any }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: company.status,
    contact_email: company.contact_email,
    contact_phone: company.contact_phone,
    employees_count: company.employees_count.toString(),
  });
  const updateCompanyMutation = useUpdateCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate(
      {
        id: company.id,
        updates: {
          status: formData.status as any,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          employees_count: parseInt(formData.employees_count),
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-gray-500">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-gray-500 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-gray-300 text-sm">Contact Email</label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Contact Phone</label>
            <Input
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Employee Count</label>
            <Input
              type="number"
              value={formData.employees_count}
              onChange={(e) =>
                setFormData({ ...formData, employees_count: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
            />
          </div>
          <Button
            type="submit"
            disabled={updateCompanyMutation.isPending}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            {updateCompanyMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Update Company
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewCompanyDetails({ company }: { company: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-gray-500">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">{company.company_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Registration Number</p>
              <p className="font-mono">{company.registration_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <Badge className="capitalize">{company.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400">CIN</p>
              <p className="font-mono">{company.cin || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">TAN</p>
              <p className="font-mono">{company.tan || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Industry</p>
              <p>{company.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Employees</p>
              <p>{company.employees_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Contact Email</p>
              <p>{company.contact_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Contact Phone</p>
              <p>{company.contact_phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-400">Address</p>
              <p>{company.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Registered Date</p>
              <p>{new Date(company.registered_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last Updated</p>
              <p>{new Date(company.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ ROLE ASSIGNMENT SECTION ============

function RoleAssignment() {
  const { data: roles = [], isLoading, error } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter(
    (role) =>
      role.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="text-center py-8">Loading roles...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading roles</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Role Assignments</CardTitle>
        <AssignRoleForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search by user ID or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 border-gray-500 text-white"
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">User ID</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Assigned By</TableHead>
                  <TableHead className="text-gray-300">Assigned At</TableHead>
                  <TableHead className="text-gray-300">Expires At</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((assignment) => (
                  <TableRow key={assignment.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {assignment.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {assignment.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{assignment.assigned_by}</TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {assignment.expires_at
                        ? new Date(assignment.expires_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <RemoveRoleDialog roleId={assignment.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-gray-400 text-sm">
            Showing {filteredRoles.length} of {roles.length} assignments
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignRoleForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    role: "user" as const,
  });
  const assignRoleMutation = useAssignUserRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    assignRoleMutation.mutate(
      {
        user_id: formData.user_id,
        role: formData.role,
        assigned_by: "admin",
      },
      {
        onSuccess: () => {
          setFormData({ user_id: "", role: "user" });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Assign Role
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Role to User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">User ID *</label>
            <Input
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Role *</label>
            <Select
              value={formData.role}
              onValueChange={(value: any) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-gray-500 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={assignRoleMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 w-full"
          >
            {assignRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Assign Role
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveRoleDialog({ roleId }: { roleId: string }) {
  const removeRoleMutation = useRemoveUserRole();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-600 text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-800 border-gray-600">
        <AlertDialogTitle className="text-white">Remove Role</AlertDialogTitle>
        <AlertDialogDescription className="text-gray-300">
          Are you sure you want to remove this role assignment?
        </AlertDialogDescription>
        <div className="flex gap-4">
          <AlertDialogCancel className="bg-slate-700 text-gray-300 border-gray-600">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeRoleMutation.mutate(roleId)}
            disabled={removeRoleMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {removeRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Remove
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============ AUDIT LOG SECTION ============

function AuditLog() {
  const [filters, setFilters] = useState({
    resourceType: "",
    status: undefined as "success" | "failure" | undefined,
  });

  const { data: logs = [], isLoading, error } = useAuditLogs({
    resourceType: filters.resourceType || undefined,
    status: filters.status,
  });

  if (isLoading) return <div className="text-center py-8">Loading audit logs...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading audit logs</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white">System Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Filter by resource type..."
              value={filters.resourceType}
              onChange={(e) =>
                setFilters({ ...filters, resourceType: e.target.value })
              }
              className="bg-slate-700 border-gray-500 text-white"
            />
            <Select
              value={filters.status || ""}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: (value as "success" | "failure") || undefined,
                })
              }
            >
              <SelectTrigger className="w-[200px] bg-slate-700 border-gray-500 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Timestamp</TableHead>
                  <TableHead className="text-gray-300">Action</TableHead>
                  <TableHead className="text-gray-300">Resource Type</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 50).map((log) => (
                  <TableRow key={log.id} className="border-gray-600 hover:bg-slate-700">
                    <TableCell className="text-gray-400 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-gray-400">{log.resource_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "success" ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-sm">
                      {log.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {log.error_message && (
                        <span className="text-red-400 text-sm">{log.error_message}</span>
                      )}
                      {!log.error_message && <span className="text-green-400">OK</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-gray-400 text-sm">
            Showing latest {Math.min(50, logs.length)} of {logs.length} logs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ SYSTEM SETTINGS SECTION ============

function SystemSettings() {
  const { data: settings = [], isLoading, error } = useSystemSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateSettingMutation = useUpdateSystemSetting();

  const handleSave = (id: string) => {
    updateSettingMutation.mutate(
      {
        id,
        updates: { value: editValue },
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      }
    );
  };

  if (isLoading) return <div className="text-center py-8">Loading settings...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading settings</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white">System Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-3 bg-slate-700 rounded border border-gray-600"
            >
              <div className="flex-1">
                <p className="text-gray-300 font-mono text-sm">{setting.key}</p>
                <p className="text-gray-400 text-xs mt-1">{setting.description}</p>
              </div>
              {editingId === setting.id ? (
                <div className="flex gap-2 ml-4">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-slate-600 border-gray-500 text-white w-32"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.id)}
                    disabled={updateSettingMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-gray-300 font-mono bg-slate-600 px-2 py-1 rounded text-sm">
                    {setting.value}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(setting.id);
                      setEditValue(setting.value);
                    }}
                    className="border-gray-500"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ HEALTH MONITOR SECTION ============

function HealthMonitor() {
  const { data: metrics = [], isLoading, error } = useSystemHealth();

  if (isLoading) return <div className="text-center py-8">Loading health metrics...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading metrics</div>;

  return (
    <Card className="bg-slate-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white">System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="p-4 bg-slate-700 rounded border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 font-semibold text-sm">{metric.metric_name}</h3>
                <Badge
                  variant={
                    metric.status === "healthy"
                      ? "default"
                      : metric.status === "warning"
                      ? "secondary"
                      : "destructive"
                  }
                  className="capitalize"
                >
                  {metric.status}
                </Badge>
              </div>
              <div className="mb-2">
                <p className="text-2xl font-bold text-cyan-400">
                  {metric.metric_value.toFixed(2)}
                </p>
                <p className="text-gray-400 text-xs">{metric.unit}</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>⚠️ Warning: {metric.threshold_warning}</p>
                <p>🔴 Critical: {metric.threshold_critical}</p>
                <p>📊 Last: {new Date(metric.measured_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ MAIN DASHBOARD COMPONENT ============

export function AdminDashboardFull() {
  const { currentUser } = usePersonaAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!currentUser || currentUser.persona !== "admin") {
    navigate("/");
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">System Administration & Control Panel</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "👥", label: "Admin Users", value: "∞" },
            { icon: "🏢", label: "Companies", value: "∞" },
            { icon: "📝", label: "Audit Logs", value: "∞" },
            { icon: "⚙️", label: "Settings", value: "∞" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-800 border-gray-600">
                <CardContent className="pt-6">
                  <p className="text-3xl mb-2">{stat.icon}</p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-slate-800 border-gray-600 w-full grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <CompanyManagement />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <RoleAssignment />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLog />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <SystemSettings />
              <HealthMonitor />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
