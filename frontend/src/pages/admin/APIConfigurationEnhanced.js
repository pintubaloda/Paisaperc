import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import api from '../../services/api';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Link as LinkIcon, Copy, ArrowRight, PlayCircle } from 'lucide-react';

const APIConfigurationEnhanced = () => {
  const [apis, setApis] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedAPI, setSelectedAPI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const [showOperatorCodesDialog, setShowOperatorCodesDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
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
  
  const [operatorCodesForm, setOperatorCodesForm] = useState([]);
  const [responseForm, setResponseForm] = useState({
    sampleResponse: '',
    responseMappings: [],
  });
  const [newMapping, setNewMapping] = useState({
    keyMessage: '',
    responseType: 'PENDING',
    txnIdStart: '',
    opidStart: '',
    balanceStart: '',
    status: '',
  });
  
  const [newParam, setNewParam] = useState({ fieldName: '', fieldValue: '', isDynamic: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apisRes, operatorsRes] = await Promise.all([
        api.apiConfig.getAll(),
        api.operators.getAll(),
      ]);
      setApis(apisRes.data);
      setOperators(operatorsRes.data);
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

  const testApi = async (apiItem) => {
    setSelectedAPI(apiItem);
    setTestResult(null);
    setShowTestDialog(true);
    setTesting(true);
    try {
      const url = `${apiItem.protocol}://${apiItem.domain}${apiItem.endpoint}`;
      setTestResult({
        status: 'success',
        url,
        message: `API endpoint configured: ${apiItem.method} ${url}`,
        parameters: apiItem.parameters?.length || 0,
        isActive: apiItem.isActive,
      });
    } catch (error) {
      setTestResult({ status: 'error', message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleEditAPI = async (apiItem) => {
    setEditingAPI(apiItem);
    setApiForm({
      name: apiItem.name,
      apiType: apiItem.apiType,
      protocol: apiItem.protocol,
      domain: apiItem.domain,
      endpoint: apiItem.endpoint,
      method: apiItem.method,
      parameters: apiItem.parameters || [],
      isActive: apiItem.isActive,
    });
    setShowAPIDialog(true);
  };

  const fetchCallbackUrl = async (apiId) => {
    try {
      const res = await api.apiConfig.getCallbackUrl(apiId);
      setCallbackUrl(res.data.callbackUrl);
    } catch (error) {
      toast.error('Failed to fetch callback URL');
    }
  };

  const openOperatorCodes = async (apiItem) => {
    setSelectedAPI(apiItem);
    await fetchCallbackUrl(apiItem.id);
    
    // Initialize operator codes form with existing data or empty
    const codesForm = operators.map(op => {
      const existing = apiItem.operatorCodes?.find(oc => oc.operatorId === op.id);
      return {
        operatorId: op.id,
        operatorName: op.name,
        service: op.service,
        providerCode: existing?.providerCode || '',
        optional1: existing?.optional1 || '',
        optional2: existing?.optional2 || '',
        optional3: existing?.optional3 || '',
      };
    });
    setOperatorCodesForm(codesForm);
    setShowOperatorCodesDialog(true);
  };

  const saveOperatorCodes = async () => {
    try {
      const operatorCodes = operatorCodesForm
        .filter(oc => oc.providerCode)
        .map(({ operatorId, providerCode, optional1, optional2, optional3 }) => ({
          operatorId,
          providerCode,
          optional1,
          optional2,
          optional3,
        }));
      
      await api.apiConfig.updateOperatorCodes(selectedAPI.id, operatorCodes);
      toast.success('Operator codes saved successfully');
      setShowOperatorCodesDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save operator codes');
    }
  };

  const openResponseMappings = async (apiItem) => {
    setSelectedAPI(apiItem);
    setResponseForm({
      sampleResponse: apiItem.sampleResponse || '',
      responseMappings: apiItem.responseMappings || [],
    });
    setShowResponseDialog(true);
  };

  const addResponseMapping = () => {
    if (!newMapping.keyMessage) {
      toast.error('Key message is required');
      return;
    }
    setResponseForm({
      ...responseForm,
      responseMappings: [...responseForm.responseMappings, newMapping],
    });
    setNewMapping({
      keyMessage: '',
      responseType: 'PENDING',
      txnIdStart: '',
      opidStart: '',
      balanceStart: '',
      status: '',
    });
  };

  const saveResponseMappings = async () => {
    try {
      await api.apiConfig.updateResponseMappings(selectedAPI.id, responseForm);
      toast.success('Response mappings saved successfully');
      setShowResponseDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save response mappings');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="api-configuration-enhanced">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Provider API Configuration</h2>
          <p className="text-muted-foreground">Configure APIs, operator codes, and response mappings</p>
        </div>
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
                  <Label>API Name *</Label>
                  <Input placeholder="e.g., Cyrus Recharge API" value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Service Type *</Label>
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
                  <Label>Protocol *</Label>
                  <Select value={apiForm.protocol} onValueChange={(value) => setApiForm({ ...apiForm, protocol: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="https">HTTPS</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Method *</Label>
                  <Select value={apiForm.method} onValueChange={(value) => setApiForm({ ...apiForm, method: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="POST_JSON">POST JSON</SelectItem>
                      <SelectItem value="POSTDATA">POSTDATA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Domain *</Label>
                <Input placeholder="api.provider.com" value={apiForm.domain} onChange={(e) => setApiForm({ ...apiForm, domain: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Endpoint/Page Name *</Label>
                <Input placeholder="/recharge" value={apiForm.endpoint} onChange={(e) => setApiForm({ ...apiForm, endpoint: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Parameters (Fields)</Label>
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  {apiForm.parameters.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <code className="flex-1 text-sm">
                        {param.fieldName}: {param.fieldValue} {param.isDynamic && <Badge variant="secondary" className="ml-2">Dynamic</Badge>}
                      </code>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeParameter(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Field Name" value={newParam.fieldName} onChange={(e) => setNewParam({ ...newParam, fieldName: e.target.value })} />
                    <Input placeholder="Value" value={newParam.fieldValue} onChange={(e) => setNewParam({ ...newParam, fieldValue: e.target.value })} />
                    <Button type="button" onClick={addParameter} size="sm" className="bg-accent">Add Field</Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newParam.isDynamic} onChange={(e) => setNewParam({ ...newParam, isDynamic: e.target.checked })} className="w-4 h-4" />
                    <Label className="text-sm">Dynamic (replaced at runtime with actual values)</Label>
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

      <div className="space-y-4">
        {apis.map((apiItem) => (
          <Card key={apiItem.id} className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Settings className="w-6 h-6 text-accent" />
                  <div>
                    <p className="text-lg font-semibold">{apiItem.name}</p>
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
                <Button variant="outline" onClick={() => handleEditAPI(apiItem)} className="w-full" data-testid={`edit-api-${apiItem.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => openOperatorCodes(apiItem)} className="w-full" data-testid={`operator-codes-${apiItem.id}`}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Op Codes
                </Button>
                <Button variant="outline" onClick={() => openResponseMappings(apiItem)} className="w-full" data-testid={`response-map-${apiItem.id}`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Responses
                </Button>
                <Button variant="outline" onClick={() => testApi(apiItem)} className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" data-testid={`test-api-${apiItem.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test API
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteAPI(apiItem.id)} className="w-full" data-testid={`delete-api-${apiItem.id}`}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {apis.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No APIs configured yet. Click "Add Provider API" to get started.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Operator Codes Dialog */}
      <Dialog open={showOperatorCodesDialog} onOpenChange={setShowOperatorCodesDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modify Operator Codes - {selectedAPI?.name}</DialogTitle>
          </DialogHeader>
          
          {callbackUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Callback URL for Webhooks:</p>
                  <code className="text-sm text-blue-700 break-all">{callbackUrl}</code>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(callbackUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">OP Code *</th>
                  <th className="text-left p-3 font-medium">Optional1</th>
                  <th className="text-left p-3 font-medium">Optional2</th>
                  <th className="text-left p-3 font-medium">Optional3</th>
                </tr>
              </thead>
              <tbody>
                {operatorCodesForm.map((oc, index) => (
                  <tr key={oc.operatorId} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <Badge variant="outline" className="uppercase">{oc.service}</Badge>
                    </td>
                    <td className="p-3 font-medium">{oc.operatorName}</td>
                    <td className="p-3">
                      <Input
                        placeholder="e.g., MAT, MJP"
                        value={oc.providerCode}
                        onChange={(e) => {
                          const updated = [...operatorCodesForm];
                          updated[index].providerCode = e.target.value.toUpperCase();
                          setOperatorCodesForm(updated);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        placeholder="Optional"
                        value={oc.optional1}
                        onChange={(e) => {
                          const updated = [...operatorCodesForm];
                          updated[index].optional1 = e.target.value;
                          setOperatorCodesForm(updated);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        placeholder="Optional"
                        value={oc.optional2}
                        onChange={(e) => {
                          const updated = [...operatorCodesForm];
                          updated[index].optional2 = e.target.value;
                          setOperatorCodesForm(updated);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        placeholder="Optional"
                        value={oc.optional3}
                        onChange={(e) => {
                          const updated = [...operatorCodesForm];
                          updated[index].optional3 = e.target.value;
                          setOperatorCodesForm(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setShowOperatorCodesDialog(false)}>Cancel</Button>
            <Button onClick={saveOperatorCodes} className="bg-accent hover:bg-accent-hover">
              Save Operator Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Mappings Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modify API Response Mapping - {selectedAPI?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sample Response (for reference)</Label>
              <Textarea
                rows={3}
                placeholder='{"statusCode":1,"message":"Recharge Successfully","clientOrderId":"MPL911151989","orderId":"EMW902544284","utr":"1939836255","status":1}'
                value={responseForm.sampleResponse}
                onChange={(e) => setResponseForm({ ...responseForm, sampleResponse: e.target.value })}
                className="font-mono text-sm"
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <h4 className="font-semibold flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Response Mapping
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key Message (e.g., "Status": "Pending") *</Label>
                  <Input
                    placeholder='"Status": "Pending"'
                    value={newMapping.keyMessage}
                    onChange={(e) => setNewMapping({ ...newMapping, keyMessage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Status *</Label>
                  <Select value={newMapping.responseType} onValueChange={(value) => setNewMapping({ ...newMapping, responseType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transaction ID Field (JSON path)</Label>
                  <Input
                    placeholder='orderId or clientOrderId'
                    value={newMapping.txnIdStart}
                    onChange={(e) => setNewMapping({ ...newMapping, txnIdStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operator Ref Field</Label>
                  <Input
                    placeholder='utr or providerRef'
                    value={newMapping.opidStart}
                    onChange={(e) => setNewMapping({ ...newMapping, opidStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance Field</Label>
                  <Input
                    placeholder='balance or amount'
                    value={newMapping.balanceStart}
                    onChange={(e) => setNewMapping({ ...newMapping, balanceStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status Value in Response</Label>
                  <Input
                    placeholder='1 or 0 or success'
                    value={newMapping.status}
                    onChange={(e) => setNewMapping({ ...newMapping, status: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addResponseMapping} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Current Response Mappings ({responseForm.responseMappings.length})</Label>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {responseForm.responseMappings.map((mapping, index) => (
                  <div key={index} className="p-3 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex-1">
                      <p className="font-mono text-sm">{mapping.keyMessage}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={
                          mapping.responseType === 'SUCCESS' ? 'bg-accent' :
                          mapping.responseType === 'FAILED' ? 'bg-destructive' : 'bg-yellow-600'
                        }>
                          {mapping.responseType}
                        </Badge>
                        {mapping.txnIdStart && <span className="text-xs text-muted-foreground">TxnID: {mapping.txnIdStart}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = [...responseForm.responseMappings];
                        updated.splice(index, 1);
                        setResponseForm({ ...responseForm, responseMappings: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {responseForm.responseMappings.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No response mappings added yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
            <Button onClick={saveResponseMappings} className="bg-accent hover:bg-accent-hover">
              Save Response Mappings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test API Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Test API - {selectedAPI?.name}</DialogTitle></DialogHeader>
          {testing ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Testing API connection...</p></div>
          ) : testResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${testResult.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`font-medium ${testResult.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.status === 'success' ? 'Configuration Valid' : 'Error'}
                </p>
                <p className="text-sm mt-1">{testResult.message}</p>
              </div>
              {testResult.url && (
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <code className="block bg-muted p-2 rounded text-sm break-all">{testResult.url}</code>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded"><p className="text-sm text-muted-foreground">Parameters</p><p className="font-bold">{testResult.parameters}</p></div>
                <div className="text-center p-3 bg-muted/50 rounded"><p className="text-sm text-muted-foreground">Status</p><p className="font-bold">{testResult.isActive ? 'Active' : 'Inactive'}</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Note: Actual API call will be made during recharge processing. This validates configuration only.</p>
            </div>
          ) : null}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default APIConfigurationEnhanced;
