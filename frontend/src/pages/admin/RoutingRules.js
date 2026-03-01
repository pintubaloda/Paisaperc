import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { toast } from 'sonner';
import { Route, Plus, Trash2, Edit, ArrowDown, GripVertical } from 'lucide-react';

const RoutingRules = () => {
  const [rules, setRules] = useState([]);
  const [operators, setOperators] = useState([]);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    role: '',
    operatorId: '',
    apiPriority: [],
    minAmount: 0,
    maxAmount: 999999,
  });
  const [selectedApiToAdd, setSelectedApiToAdd] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, operatorsRes, apisRes] = await Promise.all([
        api.routing.getAll(),
        api.operators.getAll(),
        api.apiConfig.getAll(),
      ]);
      setRules(rulesRes.data);
      setOperators(operatorsRes.data);
      setApis(apisRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.apiPriority.length === 0) {
      toast.error('Add at least one API to the priority list');
      return;
    }
    try {
      const payload = {
        ...form,
        minAmount: parseFloat(form.minAmount),
        maxAmount: parseFloat(form.maxAmount),
      };
      if (!payload.role) delete payload.role;
      if (!payload.operatorId) delete payload.operatorId;
      if (editing) {
        await api.routing.update(editing.id, payload);
        toast.success('Routing rule updated');
      } else {
        await api.routing.create(payload);
        toast.success('Routing rule created');
      }
      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (rule) => {
    setEditing(rule);
    setForm({
      role: rule.role || '',
      operatorId: rule.operatorId || '',
      apiPriority: rule.apiPriority || [],
      minAmount: rule.minAmount || 0,
      maxAmount: rule.maxAmount || 999999,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this routing rule?')) return;
    try {
      await api.routing.delete(id);
      toast.success('Routing rule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addApiToPriority = () => {
    if (!selectedApiToAdd) return;
    if (form.apiPriority.includes(selectedApiToAdd)) {
      toast.error('API already in priority list');
      return;
    }
    setForm({ ...form, apiPriority: [...form.apiPriority, selectedApiToAdd] });
    setSelectedApiToAdd('');
  };

  const removeApiFromPriority = (index) => {
    const updated = [...form.apiPriority];
    updated.splice(index, 1);
    setForm({ ...form, apiPriority: updated });
  };

  const moveApiUp = (index) => {
    if (index === 0) return;
    const updated = [...form.apiPriority];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setForm({ ...form, apiPriority: updated });
  };

  const moveApiDown = (index) => {
    if (index === form.apiPriority.length - 1) return;
    const updated = [...form.apiPriority];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setForm({ ...form, apiPriority: updated });
  };

  const resetForm = () => {
    setForm({ role: '', operatorId: '', apiPriority: [], minAmount: 0, maxAmount: 999999 });
  };

  const getApiName = (id) => apis.find(a => a.id === id)?.name || 'Unknown';
  const getOperatorName = (id) => operators.find(o => o.id === id)?.name || 'All';

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="routing-rules">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Routing Rules</h2>
          <p className="text-muted-foreground">Set API priority for User + Operator combinations with failover</p>
        </div>
        <Button className="bg-accent hover:bg-accent-hover" onClick={() => { setEditing(null); resetForm(); setShowDialog(true); }} data-testid="add-routing-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Routing Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Rules</p><p className="text-2xl font-bold">{rules.length}</p></div><Route className="w-8 h-8 text-accent" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Active APIs</p><p className="text-2xl font-bold">{apis.filter(a => a.isActive).length}</p></div><Route className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Operators</p><p className="text-2xl font-bold">{operators.length}</p></div><Route className="w-8 h-8 text-green-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Routing Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User Type</th>
                  <th className="text-left p-3 font-medium">Operator</th>
                  <th className="text-left p-3 font-medium">API Priority (Failover Order)</th>
                  <th className="text-left p-3 font-medium">Amount Range</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-muted/50" data-testid={`routing-row-${rule.id}`}>
                    <td className="p-3"><Badge variant="outline" className="capitalize">{rule.role ? rule.role.replace('_', ' ') : 'All'}</Badge></td>
                    <td className="p-3 font-medium">{getOperatorName(rule.operatorId)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(rule.apiPriority || []).map((apiId, idx) => (
                          <span key={idx} className="inline-flex items-center space-x-1">
                            <Badge className="bg-accent text-white">{idx + 1}. {getApiName(apiId)}</Badge>
                            {idx < (rule.apiPriority || []).length - 1 && <ArrowDown className="w-3 h-3 text-muted-foreground" />}
                          </span>
                        ))}
                        {(!rule.apiPriority || rule.apiPriority.length === 0) && <span className="text-muted-foreground text-sm">None</span>}
                      </div>
                    </td>
                    <td className="p-3 text-sm">₹{rule.minAmount} - ₹{rule.maxAmount}</td>
                    <td className="p-3">{rule.isActive !== false ? <Badge className="bg-accent">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(rule)} data-testid={`edit-routing-${rule.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)} data-testid={`delete-routing-${rule.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted-foreground py-8">No routing rules configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Routing Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Routing Rule' : 'Add Routing Rule'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>User Type (Optional - leave empty for all)</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="routing-role"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Roles</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="super_distributor">Super Distributor</SelectItem>
                  <SelectItem value="api_user">API User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator (Optional)</Label>
              <Select value={form.operatorId} onValueChange={(v) => setForm({ ...form, operatorId: v })}>
                <SelectTrigger data-testid="routing-operator"><SelectValue placeholder="All operators" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Operators</SelectItem>
                  {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Priority (Failover Order)</Label>
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30 min-h-[60px]">
                {form.apiPriority.map((apiId, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded border p-2">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Badge className="bg-accent text-white">{idx + 1}</Badge>
                      <span className="font-medium text-sm">{getApiName(apiId)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => moveApiUp(idx)} disabled={idx === 0} className="h-7 w-7 p-0">↑</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => moveApiDown(idx)} disabled={idx === form.apiPriority.length - 1} className="h-7 w-7 p-0">↓</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeApiFromPriority(idx)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {form.apiPriority.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Add APIs to set failover priority</p>}
              </div>
              <div className="flex space-x-2">
                <Select value={selectedApiToAdd} onValueChange={setSelectedApiToAdd}>
                  <SelectTrigger className="flex-1" data-testid="routing-api-select"><SelectValue placeholder="Select API to add" /></SelectTrigger>
                  <SelectContent>
                    {apis.filter(a => a.isActive && !form.apiPriority.includes(a.id)).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addApiToPriority} variant="outline" data-testid="routing-add-api-btn">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input type="number" min="0" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} data-testid="routing-min-amount" />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} data-testid="routing-max-amount" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent-hover" data-testid="routing-submit">
              {editing ? 'Update' : 'Create'} Routing Rule
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutingRules;
