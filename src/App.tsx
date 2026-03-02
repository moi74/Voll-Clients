/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  X,
  Trash2,
  Edit2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  created_at: string;
}

interface ServiceRequest {
  id: number;
  scheduled_at: string;
  status: string;
  created_at: string;
  student_id: number;
  student?: Student;
}

interface FinancialMovement {
  id: number;
  description: string;
  amount: number;
  movement_type: 'income' | 'expense';
  movement_date: string;
  created_at: string;
}

type View = 'dashboard' | 'students' | 'agenda' | 'finance';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [financialMovements, setFinancialMovements] = useState<FinancialMovement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [financeFilter, setFinanceFilter] = useState<string>('all');
  const [agendaSort, setAgendaSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'scheduled_at',
    direction: 'asc'
  });
  const [agendaFilter, setAgendaFilter] = useState<string>('all');
  
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'Mensal',
    status: 'Ativo'
  });

  const [newServiceRequest, setNewServiceRequest] = useState({
    student_id: '',
    scheduled_at: '',
    status: 'pending'
  });

  const [newFinancialMovement, setNewFinancialMovement] = useState({
    description: '',
    amount: '',
    movement_type: 'income' as 'income' | 'expense',
    movement_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStudents();
    fetchServiceRequests();
    fetchFinancialMovements();
  }, []);

  const fetchFinancialMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_movements')
        .select('*')
        .order('movement_date', { ascending: false });

      if (error) throw error;
      setFinancialMovements(data || []);
    } catch (error) {
      console.error('Error fetching financial movements:', error);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, student:students(*)')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setServiceRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinancialMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('financial_movements')
        .insert([{ 
          ...newFinancialMovement, 
          amount: parseFloat(newFinancialMovement.amount) 
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setFinancialMovements([data, ...financialMovements]);
        setIsFinanceModalOpen(false);
        setNewFinancialMovement({
          description: '',
          amount: '',
          movement_type: 'income',
          movement_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error adding financial movement:', error);
    }
  };

  const handleDeleteFinancialMovement = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este lançamento?')) return;
    try {
      const { error } = await supabase
        .from('financial_movements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFinancialMovements(financialMovements.filter(fm => fm.id !== id));
    } catch (error) {
      console.error('Error deleting financial movement:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{ ...newStudent }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setStudents([data, ...students]);
        setIsModalOpen(false);
        setNewStudent({ name: '', email: '', phone: '', plan: 'Mensal', status: 'Ativo' });
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleAddServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .insert([{ 
          student_id: parseInt(newServiceRequest.student_id),
          scheduled_at: newServiceRequest.scheduled_at,
          status: newServiceRequest.status
        }])
        .select('*, student:students(*)')
        .single();

      if (error) throw error;
      if (data) {
        setServiceRequests([...serviceRequests, data]);
        setIsAgendaModalOpen(false);
        setNewServiceRequest({ student_id: '', scheduled_at: '', status: 'pending' });
      }
    } catch (error) {
      console.error('Error adding service request:', error);
    }
  };

  const handleDeleteServiceRequest = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este agendamento?')) return;
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServiceRequests(serviceRequests.filter(sr => sr.id !== id));
    } catch (error) {
      console.error('Error deleting service request:', error);
    }
  };

  const handleUpdateServiceRequestStatus = async (id: number, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', id)
        .select('*, student:students(*)')
        .single();

      if (error) throw error;
      if (data) {
        setServiceRequests(serviceRequests.map(sr => sr.id === id ? data : sr));
        setIsEditStatusModalOpen(false);
        setEditingRequest(null);
      }
    } catch (error) {
      console.error('Error updating service request status:', error);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este aluno?')) return;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStudents(students.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const filteredServiceRequests = useMemo(() => {
    let items = [...serviceRequests];
    
    if (agendaFilter !== 'all') {
      if (agendaFilter === 'today') {
        const today = new Date().toDateString();
        items = items.filter(sr => new Date(sr.scheduled_at).toDateString() === today);
      } else {
        items = items.filter(sr => sr.status === agendaFilter);
      }
    }

    if (agendaSort.key !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (agendaSort.key === 'student') {
          aValue = a.student?.name || '';
          bValue = b.student?.name || '';
        } else {
          aValue = (a as any)[agendaSort.key];
          bValue = (b as any)[agendaSort.key];
        }

        if (aValue < bValue) {
          return agendaSort.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return agendaSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [serviceRequests, agendaSort, agendaFilter]);

  const handleAgendaSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (agendaSort.key === key && agendaSort.direction === 'asc') {
      direction = 'desc';
    }
    setAgendaSort({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (agendaSort.key !== column) return <Filter size={12} className="opacity-20" />;
    return agendaSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'Todos' || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [students, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === 'Ativo').length,
    trial: students.filter(s => s.status === 'Experimental').length,
    inactive: students.filter(s => s.status === 'Inativo').length,
  }), [students]);

  // Chart Data - Real growth based on registration dates
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      
      // Count students registered up to the end of this month
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = students.filter(s => new Date(s.created_at) <= endOfMonth).length;
      
      last6Months.push({
        name: monthName,
        alunos: count,
        fullDate: `${monthName}/${year}`
      });
    }
    return last6Months;
  }, [students]);

  const planData = useMemo(() => {
    const counts = students.reduce((acc: any, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">VOLL Candidate</h1>
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Alunos" 
              active={currentView === 'students'} 
              onClick={() => setCurrentView('students')}
            />
            <NavItem 
              icon={<Calendar size={20} />} 
              label="Agenda" 
              active={currentView === 'agenda'} 
              onClick={() => setCurrentView('agenda')}
            />
            <NavItem 
              icon={<TrendingUp size={20} />} 
              label="Financeiro" 
              active={currentView === 'finance'} 
              onClick={() => setCurrentView('finance')}
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100">
          <NavItem icon={<Settings size={20} />} label="Configurações" />
          <NavItem icon={<LogOut size={20} />} label="Sair" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar alunos..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (currentView === 'agenda') {
                  setIsAgendaModalOpen(true);
                } else if (currentView === 'finance') {
                  setIsFinanceModalOpen(true);
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              {currentView === 'agenda' ? (
                <>
                  <Calendar size={18} />
                  Novo Agendamento
                </>
              ) : currentView === 'finance' ? (
                <>
                  <Plus size={18} />
                  Novo Lançamento
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Novo Aluno
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">Visão Geral</h2>
                  <p className="text-slate-500 text-sm">Acompanhe o desempenho do seu studio em tempo real.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard 
                    label="Total de Alunos" 
                    value={stats.total} 
                    icon={<Users className="text-blue-600" />} 
                    trend="+12%"
                    trendUp={true}
                  />
                  <StatCard 
                    label="Alunos Ativos" 
                    value={stats.active} 
                    icon={<CheckCircle2 className="text-emerald-600" />} 
                    trend="94%"
                    trendUp={true}
                  />
                  <StatCard 
                    label="Experimentais" 
                    value={stats.trial} 
                    icon={<Clock className="text-amber-600" />} 
                    trend="3 pendentes"
                    trendUp={false}
                  />
                  <StatCard 
                    label="Receita Estimada" 
                    value={`R$ ${(stats.active * 250).toLocaleString('pt-BR')}`} 
                    icon={<TrendingUp className="text-indigo-600" />} 
                    trend="+8%"
                    trendUp={true}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Growth Chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800">Crescimento de Alunos</h3>
                      <select className="text-xs bg-slate-50 border-none rounded-lg px-2 py-1 focus:ring-0">
                        <option>Últimos 6 meses</option>
                        <option>Este ano</option>
                      </select>
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="alunos" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorAlunos)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Plans Distribution */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Distribuição de Planos</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={planData.length > 0 ? planData : [{name: 'Nenhum', value: 1}]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {planData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {planData.map((plan, i) => (
                        <div key={plan.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-600">{plan.name}</span>
                          </div>
                          <span className="font-bold text-slate-800">{plan.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : currentView === 'agenda' ? (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Agenda de Serviços</h2>
                    <p className="text-slate-500 text-sm">Gerencie os agendamentos e horários dos alunos.</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Próximos Agendamentos</h3>
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'today', label: 'Hoje' },
                        { id: 'pending', label: 'Agendados' },
                        { id: 'completed', label: 'Realizados' },
                        { id: 'canceled', label: 'Cancelados' }
                      ].map(filter => (
                        <button 
                          key={filter.id}
                          onClick={() => setAgendaFilter(filter.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            agendaFilter === filter.id 
                              ? 'bg-emerald-600 text-white' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                          <th 
                            className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleAgendaSort('student')}
                          >
                            <div className="flex items-center gap-2">
                              Aluno <SortIcon column="student" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleAgendaSort('scheduled_at')}
                          >
                            <div className="flex items-center gap-2">
                              Data e Hora <SortIcon column="scheduled_at" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleAgendaSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              Status <SortIcon column="status" />
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredServiceRequests.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum agendamento encontrado.</td>
                          </tr>
                        ) : (
                          filteredServiceRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    {request.student?.name.charAt(0) || '?'}
                                  </div>
                                  <p className="font-semibold text-slate-800">{request.student?.name || 'Aluno Removido'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-800">
                                    {new Date(request.scheduled_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(request.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={request.status} />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingRequest(request);
                                      setIsEditStatusModalOpen(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="Editar Status"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteServiceRequest(request.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remover Agendamento"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : currentView === 'finance' ? (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Financeiro</h2>
                    <p className="text-slate-500 text-sm">Controle de entradas e saídas do studio.</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Movimentações Financeiras</h3>
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'income', label: 'Entradas' },
                        { id: 'expense', label: 'Saídas' }
                      ].map(filter => (
                        <button 
                          key={filter.id}
                          onClick={() => setFinanceFilter(filter.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            financeFilter === filter.id 
                              ? 'bg-emerald-600 text-white' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Descrição</th>
                          <th className="px-6 py-4 font-semibold">Tipo</th>
                          <th className="px-6 py-4 font-semibold">Valor</th>
                          <th className="px-6 py-4 font-semibold">Data</th>
                          <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financialMovements
                          .filter(fm => financeFilter === 'all' || fm.movement_type === financeFilter)
                          .length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhuma movimentação encontrada.</td>
                          </tr>
                        ) : (
                          financialMovements
                            .filter(fm => financeFilter === 'all' || fm.movement_type === financeFilter)
                            .map((movement) => (
                            <tr key={movement.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-800">{movement.description}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  movement.movement_type === 'income' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {movement.movement_type === 'income' ? 'Entrada' : 'Saída'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-bold ${
                                  movement.movement_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {movement.movement_type === 'income' ? '+' : '-'} 
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(movement.amount)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">
                                  {new Date(movement.movement_date).toLocaleDateString('pt-BR')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleDeleteFinancialMovement(movement.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remover Lançamento"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Gestão de Alunos</h2>
                    <p className="text-slate-500 text-sm">Visualize e gerencie todos os alunos cadastrados.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all">
                      <Filter size={20} />
                    </button>
                  </div>
                </div>

                {/* Student List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Lista de Alunos</h3>
                    <div className="flex gap-2">
                      {['Todos', 'Ativo', 'Experimental', 'Inativo'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            filterStatus === status 
                              ? 'bg-emerald-600 text-white' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Aluno</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Plano</th>
                          <th className="px-6 py-4 font-semibold">Contato</th>
                          <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Carregando alunos...</td>
                          </tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum aluno encontrado.</td>
                          </tr>
                        ) : (
                          filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                    <p className="text-xs text-slate-500">Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={student.status} />
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">{student.plan}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Phone size={12} /> {student.phone}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Mail size={12} /> {student.email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remover Aluno"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                    <MoreVertical size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Novo Aluno</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: João Silva"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="joao@email.com"
                      value={newStudent.email}
                      onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="(11) 99999-9999"
                      value={newStudent.phone}
                      onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plano</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newStudent.plan}
                    onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                  >
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Inicial</label>
                  <div className="flex gap-2">
                    {['Ativo', 'Experimental'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewStudent({...newStudent, status})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                           newStudent.status === status 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Cadastrar Aluno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Agenda Modal */}
      <AnimatePresence>
        {isAgendaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAgendaModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Novo Agendamento</h3>
                <button onClick={() => setIsAgendaModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddServiceRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aluno</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newServiceRequest.student_id}
                    onChange={e => setNewServiceRequest({...newServiceRequest, student_id: e.target.value})}
                  >
                    <option value="">Selecione um aluno</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data e Hora</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newServiceRequest.scheduled_at}
                    onChange={e => setNewServiceRequest({...newServiceRequest, scheduled_at: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'pending', label: 'Agendado' },
                      { id: 'completed', label: 'Realizado' },
                      { id: 'canceled', label: 'Cancelado' }
                    ].map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setNewServiceRequest({...newServiceRequest, status: status.id})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          newServiceRequest.status === status.id 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Agendar Serviço
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Service Request Status Modal */}
      <AnimatePresence>
        {isEditStatusModalOpen && editingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditStatusModalOpen(false);
                setEditingRequest(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Editar Status</h3>
                  <p className="text-xs text-slate-500">Agendamento de {editingRequest.student?.name}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsEditStatusModalOpen(false);
                    setEditingRequest(null);
                  }} 
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Selecione o novo status</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'pending', label: 'Agendado', color: 'blue' },
                      { id: 'completed', label: 'Realizado', color: 'emerald' },
                      { id: 'canceled', label: 'Cancelado', color: 'red' }
                    ].map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => handleUpdateServiceRequestStatus(editingRequest.id, status.id)}
                        className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-between px-6 border-2 ${
                          editingRequest.status === status.id 
                            ? `border-${status.color}-600 bg-${status.color}-50 text-${status.color}-700 shadow-sm` 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{status.label}</span>
                        {editingRequest.status === status.id && <CheckCircle2 size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setIsEditStatusModalOpen(false);
                      setEditingRequest(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Financial Movement Modal */}
      <AnimatePresence>
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Novo Lançamento</h3>
                <button onClick={() => setIsFinanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddFinancialMovement} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: Mensalidade Aluno X"
                    value={newFinancialMovement.description}
                    onChange={e => setNewFinancialMovement({...newFinancialMovement, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="0,00"
                      value={newFinancialMovement.amount}
                      onChange={e => setNewFinancialMovement({...newFinancialMovement, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={newFinancialMovement.movement_date}
                      onChange={e => setNewFinancialMovement({...newFinancialMovement, movement_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Movimentação</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'income', label: 'Entrada' },
                      { id: 'expense', label: 'Saída' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewFinancialMovement({...newFinancialMovement, movement_type: type.id as 'income' | 'expense'})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          newFinancialMovement.movement_type === type.id 
                            ? (type.id === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'bg-red-600 text-white shadow-md')
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200"
                  >
                    Salvar Lançamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, disabled = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all group
        ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {active && <ChevronRight size={14} />}
      {disabled && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Em breve</span>}
    </div>
  );
}

function StatCard({ label, value, icon, trend, trendUp }: { label: string, value: string | number, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
        }`}>
          {trendUp ? <ArrowUpRight size={12} /> : <Clock size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'Ativo': 'bg-emerald-100 text-emerald-700',
    'Experimental': 'bg-amber-100 text-amber-700',
    'Inativo': 'bg-slate-100 text-slate-700',
    'pending': 'bg-blue-100 text-blue-700',
    'completed': 'bg-emerald-100 text-emerald-700',
    'canceled': 'bg-red-100 text-red-700',
  }[status] || 'bg-slate-100 text-slate-700';

  const labels: Record<string, string> = {
    'pending': 'Agendado',
    'completed': 'Realizado',
    'canceled': 'Cancelado'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {labels[status] || status}
    </span>
  );
}
