import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../services/api';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react';

const APIConfiguration = () => {
  const [apis, setApis] = useState([]);
  const [operators, setOperators] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingAPI, setEditingAPI] = useState(null);
  const [apiForm, setApiForm] = useState({
    name: '',
    apiType: 'mobile',
    protocol: 'https',
    domain: '',
    endpoint: '',
    method: 'POST_JSON',
    parameters: [],
    isActive: true,
  });
  const [mappingForm, setMappingForm] = useState({
    operatorId: '',
    apiId: '',
    priority: 1,
    minAmount: 0,
    maxAmount: 999999,
    isActive: true,
  });
  const [newParam, setNewParam] = useState({ fieldName: '', fieldValue: '', isDynamic: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apisRes, operatorsRes, mappingsRes] = await Promise.all([
        api.apiConfig.getAll(),
        api.operators.getAll(),
        api.operatorApiMapping.getAll(),
      ]);
      setApis(apisRes.data);
      setOperators(operatorsRes.data);
      setMappings(mappingsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAPISubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAPI) {
        await api.apiConfig.update(editingAPI.id, apiForm);
        toast.success('API updated successfully');
      } else {
        await api.apiConfig.create(apiForm);
        toast.success('API created successfully');
      }
      setShowAPIDialog(false);
      setEditingAPI(null);
      resetAPIForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.operatorApiMapping.create(mappingForm);
      toast.success('Mapping created successfully');
      setShowMappingDialog(false);
      setMappingForm({ operatorId: '', apiId: '', priority: 1, minAmount: 0, maxAmount: 999999, isActive: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mapping failed');
    }
  };

  const addParameter = () => {
    if (!newParam.fieldName || !newParam.fieldValue) {
      toast.error('Please fill parameter details');
      return;
    }
    setApiForm({
      ...apiForm,
      parameters: [...apiForm.parameters, newParam],
    });
    setNewParam({ fieldName: '', fieldValue: '', isDynamic: false });
  };

  const removeParameter = (index) => {
    setApiForm({
      ...apiForm,
      parameters: apiForm.parameters.filter((_, i) => i !== index),
    });
  };

  const resetAPIForm = () => {
    setApiForm({
      name: '',
      apiType: 'mobile',
      protocol: 'https',
      domain: '',
      endpoint: '',
      method: 'POST_JSON',
      parameters: [],
      isActive: true,
    });
  };

  const handleDeleteAPI = async (id) => {
    if (!window.confirm('Are you sure? This will affect related mappings.')) return;
    try {
      await api.apiConfig.delete(id);
      toast.success('API deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete API');
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm('Delete this mapping?')) return;
    try {
      await api.operatorApiMapping.delete(id);
      toast.success('Mapping deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="api-configuration">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">API Configuration</h2>
          <p className="text-muted-foreground">Configure provider APIs and operator mappings</p>
        </div>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apis">Provider APIs</TabsTrigger>
          <TabsTrigger value="mappings">Operator-API Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showAPIDialog} onOpenChange={setShowAPIDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent-hover" onClick={() => { setEditingAPI(null); resetAPIForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Provider API
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAPI ? 'Edit API' : 'Add New Provider API'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAPISubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Name</Label>
                      <Input placeholder="e.g., Cyrus Recharge API" value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Service Type</Label>
                      <Select value={apiForm.apiType} onValueChange={(value) => setApiForm({ ...apiForm, apiType: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="dth">DTH</SelectItem>
                          <SelectItem value="bill_payment">Bill Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Protocol</Label>
                      <Select value={apiForm.protocol} onValueChange={(value) => setApiForm({ ...apiForm, protocol: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="https">HTTPS</SelectItem>
                          <SelectItem value="http">HTTP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={apiForm.method} onValueChange={(value) => setApiForm({ ...apiForm, method: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="POST_JSON">POST JSON</SelectItem>
                          <SelectItem value="POSTDATA">POST DATA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input placeholder="api.provider.com" value={apiForm.domain} onChange={(e) => setApiForm({ ...apiForm, domain: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input placeholder="/recharge" value={apiForm.endpoint} onChange={(e) => setApiForm({ ...apiForm, endpoint: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Parameters</Label>
                    <div className="border rounded-lg p-4 space-y-3">
                      {apiForm.parameters.map((param, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <code className="flex-1 text-sm">
                            {param.fieldName}: {param.fieldValue} {param.isDynamic && '(Dynamic)'}
                          </code>
                          <Button type="button" size="sm" variant="destructive" onClick={() => removeParameter(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Field Name" value={newParam.fieldName} onChange={(e) => setNewParam({ ...newParam, fieldName: e.target.value })} />
                        <Input placeholder="Value" value={newParam.fieldValue} onChange={(e) => setNewParam({ ...newParam, fieldValue: e.target.value })} />
                        <Button type="button" onClick={addParameter} size="sm">Add</Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={newParam.isDynamic} onChange={(e) => setNewParam({ ...newParam, isDynamic: e.target.checked })} className="w-4 h-4" />
                        <Label className="text-sm">Dynamic (replaced at runtime)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="apiActive" checked={apiForm.isActive} onChange={(e) => setApiForm({ ...apiForm, isActive: e.target.checked })} className="w-4 h-4" />
                    <Label htmlFor="apiActive">Active</Label>
                  </div>

                  <Button type="submit" className="w-full bg-accent hover:bg-accent-hover">
                    {editingAPI ? 'Update API' : 'Create API'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configured APIs ({apis.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apis.map((apiItem) => (
                  <div key={apiItem.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Settings className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-semibold">{apiItem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {apiItem.protocol}://{apiItem.domain}{apiItem.endpoint}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge>{apiItem.apiType}</Badge>
                        <Badge variant="outline">{apiItem.method}</Badge>
                        {apiItem.isActive ? (
                          <Badge className="bg-accent">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAPI(apiItem.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {apiItem.parameters.length > 0 && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Parameters:</p>
                        <div className="flex flex-wrap gap-2">
                          {apiItem.parameters.map((param, idx) => (
                            <code key={idx} className="bg-muted px-2 py-1 rounded text-xs">
                              {param.fieldName}: {param.fieldValue}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {apis.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No APIs configured yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent-hover">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Create Mapping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Map Operator to API</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMappingSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select value={mappingForm.operatorId} onValueChange={(value) => setMappingForm({ ...mappingForm, operatorId: value })} required>
                      <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.id} value={op.id}>{op.name} ({op.service})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>API</Label>
                    <Select value={mappingForm.apiId} onValueChange={(value) => setMappingForm({ ...mappingForm, apiId: value })} required>
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
                      <Label>Priority</Label>
                      <Input type="number" min="1" value={mappingForm.priority} onChange={(e) => setMappingForm({ ...mappingForm, priority: parseInt(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Amount</Label>
                      <Input type="number" min="0" value={mappingForm.minAmount} onChange={(e) => setMappingForm({ ...mappingForm, minAmount: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Amount</Label>
                      <Input type="number" value={mappingForm.maxAmount} onChange={(e) => setMappingForm({ ...mappingForm, maxAmount: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent-hover">Create Mapping</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Operator-API Mappings ({mappings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Operator</th>
                      <th className="text-left p-3 font-medium">API</th>
                      <th className="text-left p-3 font-medium">Priority</th>
                      <th className="text-left p-3 font-medium">Amount Range</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping) => {
                      const operator = operators.find(o => o.id === mapping.operatorId);
                      const apiItem = apis.find(a => a.id === mapping.apiId);
                      return (
                        <tr key={mapping.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{operator?.name || 'N/A'}</td>
                          <td className="p-3">{apiItem?.name || 'N/A'}</td>
                          <td className="p-3"><Badge>{mapping.priority}</Badge></td>
                          <td className="p-3">₹{mapping.minAmount} - ₹{mapping.maxAmount}</td>
                          <td className="p-3">
                            {mapping.isActive ? (
                              <Badge className="bg-accent">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMapping(mapping.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {mappings.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No mappings configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIConfiguration;
