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
import { Zap, Plus, Edit, Trash2 } from 'lucide-react';

const OperatorsManagement = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    service: 'mobile',
    opCode: '',
    stateCode: '',
    isActive: true,
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await api.operators.getAll();
      setOperators(res.data);
    } catch (error) {
      toast.error('Failed to fetch operators');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOperator) {
        await api.operators.update(editingOperator.id, formData);
        toast.success('Operator updated successfully');
      } else {
        await api.operators.create(formData);
        toast.success('Operator created successfully');
      }
      setShowDialog(false);
      setEditingOperator(null);
      setFormData({ name: '', service: 'mobile', opCode: '', stateCode: '', isActive: true });
      fetchOperators();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name,
      service: operator.service,
      opCode: operator.opCode,
      stateCode: operator.stateCode || '',
      isActive: operator.isActive,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;
    try {
      await api.operators.delete(id);
      toast.success('Operator deleted successfully');
      fetchOperators();
    } catch (error) {
      toast.error('Failed to delete operator');
    }
  };

  const serviceColors = {
    mobile: 'bg-blue-100 text-blue-700',
    dth: 'bg-purple-100 text-purple-700',
    bill_payment: 'bg-green-100 text-green-700',
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="operators-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Operators Management</h2>
          <p className="text-muted-foreground">Manage mobile, DTH, and bill payment operators</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-hover" onClick={() => { setEditingOperator(null); setFormData({ name: '', service: 'mobile', opCode: '', stateCode: '', isActive: true }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOperator ? 'Edit Operator' : 'Add New Operator'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Operator Name</Label>
                <Input
                  placeholder="e.g., Jio, Airtel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile Recharge</SelectItem>
                    <SelectItem value="dth">DTH Recharge</SelectItem>
                    <SelectItem value="bill_payment">Bill Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operator Code</Label>
                <Input
                  placeholder="e.g., JIO, AIRTEL"
                  value={formData.opCode}
                  onChange={(e) => setFormData({ ...formData, opCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State/Circle (Optional)</Label>
                <Input
                  placeholder="e.g., Delhi, Mumbai"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent-hover">
                {editingOperator ? 'Update Operator' : 'Create Operator'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Operators</p>
                <p className="text-2xl font-bold">{operators.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-bold">{operators.filter(o => o.isActive).length}</p>
              </div>
              <Zap className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                <p className="text-2xl font-bold">{operators.filter(o => !o.isActive).length}</p>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">State/Circle</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((operator) => (
                  <tr key={operator.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{operator.name}</td>
                    <td className="p-3">
                      <Badge className={serviceColors[operator.service]}>
                        {operator.service.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{operator.opCode}</code>
                    </td>
                    <td className="p-3">{operator.stateCode || '-'}</td>
                    <td className="p-3">
                      {operator.isActive ? (
                        <Badge className="bg-accent">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(operator)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(operator.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorsManagement;
