import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { toast } from 'sonner';
import { DollarSign, Plus, Trash2, Percent } from 'lucide-react';

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [operators, setOperators] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [showRoutingDialog, setShowRoutingDialog] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    role: 'retailer',
    operatorId: '',
    commissionType: 'percentage',
    commissionValue: 0,
  });
  const [routingForm, setRoutingForm] = useState({
    role: '',
    operatorId: '',
    apiId: '',
    minAmount: 0,
    maxAmount: 999999,
    priority: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commissionsRes, operatorsRes, routingRes, apisRes] = await Promise.all([
        api.commission.getAll(),
        api.operators.getAll(),
        api.routing.getAll(),
        api.apiConfig.getAll(),
      ]);
      setCommissions(commissionsRes.data);
      setOperators(operatorsRes.data);
      setRoutingRules(routingRes.data);
      setApis(apisRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.commission.create(commissionForm);
      toast.success('Commission created successfully');
      setShowCommissionDialog(false);
      setCommissionForm({ role: 'retailer', operatorId: '', commissionType: 'percentage', commissionValue: 0 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create commission');
    }
  };

  const handleRoutingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.routing.create(routingForm);
      toast.success('Routing rule created successfully');
      setShowRoutingDialog(false);
      setRoutingForm({ role: '', operatorId: '', apiId: '', minAmount: 0, maxAmount: 999999, priority: 1 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create routing rule');
    }
  };

  const handleDeleteCommission = async (id) => {
    if (!window.confirm('Delete this commission rule?')) return;
    try {
      await api.commission.delete(id);
      toast.success('Commission deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete commission');
    }
  };

  const handleDeleteRouting = async (id) => {
    if (!window.confirm('Delete this routing rule?')) return;
    try {
      await api.routing.delete(id);
      toast.success('Routing rule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete routing rule');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="commission-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Commission & Routing</h2>
          <p className="text-muted-foreground">Manage commission rules and routing strategies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Commission Rules ({commissions.length})</span>
              </CardTitle>
              <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent hover:bg-accent-hover">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Commission Rule</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCommissionSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>User Role</Label>
                      <Select value={commissionForm.role} onValueChange={(value) => setCommissionForm({ ...commissionForm, role: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="super_distributor">Super Distributor</SelectItem>
                          <SelectItem value="api_user">API User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select value={commissionForm.operatorId} onValueChange={(value) => setCommissionForm({ ...commissionForm, operatorId: value })} required>
                        <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                        <SelectContent>
                          {operators.map(op => (
                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commission Type</Label>
                      <Select value={commissionForm.commissionType} onValueChange={(value) => setCommissionForm({ ...commissionForm, commissionType: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="flat">Flat (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commission Value</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={commissionForm.commissionType === 'percentage' ? 'e.g., 2.5' : 'e.g., 10'}
                        value={commissionForm.commissionValue}
                        onChange={(e) => setCommissionForm({ ...commissionForm, commissionValue: parseFloat(e.target.value) })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {commissionForm.commissionType === 'percentage' ? 'Enter percentage (e.g., 2.5 for 2.5%)' : 'Enter flat amount in rupees'}
                      </p>
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent-hover">
                      Create Commission Rule
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {commissions.map((comm) => {
                const operator = operators.find(o => o.id === comm.operatorId);
                return (
                  <div key={comm.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="capitalize">{comm.role.replace('_', ' ')}</Badge>
                        <Badge>{operator?.name || 'N/A'}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {comm.commissionType === 'percentage' ? (
                          <><Percent className="w-4 h-4 text-accent" /><span className="font-semibold text-accent">{comm.commissionValue}%</span></>
                        ) : (
                          <><DollarSign className="w-4 h-4 text-accent" /><span className="font-semibold text-accent">₹{comm.commissionValue}</span></>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCommission(comm.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
              {commissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No commission rules</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Routing Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Routing Rules ({routingRules.length})</CardTitle>
              <Dialog open={showRoutingDialog} onOpenChange={setShowRoutingDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent hover:bg-accent-hover">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Routing Rule</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRoutingSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>User Role (Optional)</Label>
                      <Select value={routingForm.role} onValueChange={(value) => setRoutingForm({ ...routingForm, role: value })}>
                        <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Roles</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="super_distributor">Super Distributor</SelectItem>
                          <SelectItem value="api_user">API User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Operator (Optional)</Label>
                      <Select value={routingForm.operatorId} onValueChange={(value) => setRoutingForm({ ...routingForm, operatorId: value })}>
                        <SelectTrigger><SelectValue placeholder="All operators" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Operators</SelectItem>
                          {operators.map(op => (
                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>API</Label>
                      <Select value={routingForm.apiId} onValueChange={(value) => setRoutingForm({ ...routingForm, apiId: value })} required>
                        <SelectTrigger><SelectValue placeholder="Select API" /></SelectTrigger>
                        <SelectContent>
                          {apis.filter(a => a.isActive).map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Min Amount</Label>
                        <Input type="number" min="0" value={routingForm.minAmount} onChange={(e) => setRoutingForm({ ...routingForm, minAmount: parseFloat(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Amount</Label>
                        <Input type="number" value={routingForm.maxAmount} onChange={(e) => setRoutingForm({ ...routingForm, maxAmount: parseFloat(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Input type="number" min="1" value={routingForm.priority} onChange={(e) => setRoutingForm({ ...routingForm, priority: parseInt(e.target.value) })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent-hover">
                      Create Routing Rule
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {routingRules.map((rule) => {
                const operator = operators.find(o => o.id === rule.operatorId);
                const apiItem = apis.find(a => a.id === rule.apiId);
                return (
                  <div key={rule.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        {rule.role && <Badge variant="outline" className="capitalize">{rule.role.replace('_', ' ')}</Badge>}
                        {operator && <Badge>{operator.name}</Badge>}
                        <Badge className="bg-accent">{apiItem?.name || 'N/A'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Amount: ₹{rule.minAmount} - ₹{rule.maxAmount} | Priority: {rule.priority}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteRouting(rule.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
              {routingRules.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No routing rules</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommissionManagement;
