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
    method: 'GET',
    parameters: [],
    headers: [],
    authToken: '',
    requestFormat: 'query_param',
    successField: 'status',
    successValue: 'Success',
    failedValue: 'Failed',
    pendingValue: 'Pending',
    txnIdField: 'txnid',
    balanceField: 'balance',
    messageField: 'status_msg',
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

  const [testForm, setTestForm] = useState({ mobile: '', operatorCode: '', amount: '' });

  const testApi = async (apiItem) => {
    setSelectedAPI(apiItem);
    setTestResult(null);
    setTestForm({ mobile: '', operatorCode: '', amount: '' });
    setShowTestDialog(true);
  };

  const executeTestApi = async () => {
    if (!selectedAPI) return;
    setTesting(true);
    try {
      const res = await api.apiConfig.testApi(selectedAPI.id, {
        mobile: testForm.mobile || '9999999999',
        operatorCode: testForm.operatorCode || 'TEST',
        amount: parseFloat(testForm.amount) || 10,
      });
      setTestResult(res.data);
    } catch (error) {
      setTestResult({ status: 'error', message: error.response?.data?.message || error.message });
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
      headers: apiItem.headers || [],
      authToken: apiItem.authToken || '',
      requestFormat: apiItem.requestFormat || 'query_param',
      successField: apiItem.successField || 'status',
      successValue: apiItem.successValue || 'Success',
      failedValue: apiItem.failedValue || 'Failed',
      pendingValue: apiItem.pendingValue || 'Pending',
      txnIdField: apiItem.txnIdField || 'txnid',
      balanceField: apiItem.balanceField || 'balance',
      messageField: apiItem.messageField || 'status_msg',
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
      method: 'GET',
      parameters: [],
      headers: [],
      authToken: '',
      requestFormat: 'query_param',
      successField: 'status',
      successValue: 'Success',
      failedValue: 'Failed',
      pendingValue: 'Pending',
      txnIdField: 'txnid',
      balanceField: 'balance',
      messageField: 'status_msg',
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
                  <Input placeholder="e.g., StockXchange API" value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} required data-testid="api-name-input" />
                </div>
                <div className="space-y-2">
                  <Label>Service Type *</Label>
                  <Select value={apiForm.apiType} onValueChange={(value) => setApiForm({ ...apiForm, apiType: value })}>
                    <SelectTrigger data-testid="api-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="dth">DTH</SelectItem>
                      <SelectItem value="bill_payment">Bill Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <Label>Method *</Label>
                  <Select value={apiForm.method} onValueChange={(value) => setApiForm({ ...apiForm, method: value })}>
                    <SelectTrigger data-testid="api-method-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET (Query Params)</SelectItem>
                      <SelectItem value="POST">POST (Form Data)</SelectItem>
                      <SelectItem value="POST_JSON">POST (JSON Body)</SelectItem>
                      <SelectItem value="POSTDATA">POSTDATA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Request Format</Label>
                  <Select value={apiForm.requestFormat} onValueChange={(value) => setApiForm({ ...apiForm, requestFormat: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="query_param">Query Parameters</SelectItem>
                      <SelectItem value="json_body">JSON Body</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain *</Label>
                  <Input placeholder="api.stockxchange.in" value={apiForm.domain} onChange={(e) => setApiForm({ ...apiForm, domain: e.target.value })} required data-testid="api-domain-input" />
                </div>
                <div className="space-y-2">
                  <Label>Endpoint *</Label>
                  <Input placeholder="/" value={apiForm.endpoint} onChange={(e) => setApiForm({ ...apiForm, endpoint: e.target.value })} required data-testid="api-endpoint-input" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auth Token (Optional)</Label>
                <Input placeholder="API authentication token" value={apiForm.authToken} onChange={(e) => setApiForm({ ...apiForm, authToken: e.target.value })} data-testid="api-auth-token" />
              </div>

              <div className="border rounded-lg p-3 bg-blue-50/60 border-blue-200" data-testid="dynamic-variables-reference">
                <p className="text-sm font-semibold text-blue-900 mb-2">Available Dynamic Variables</p>
                <p className="text-xs text-blue-700 mb-2">Use these placeholders in Endpoint URL, Parameter values, Header values, and Status Check fields. They are auto-replaced at runtime.</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[number]')}>[number] <span className="text-blue-500">- Mobile No</span></code>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[op_code]')}>[op_code] <span className="text-blue-500">- Operator Code</span></code>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[amount]')}>[amount] <span className="text-blue-500">- Amount</span></code>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[txn_id]')}>[txn_id] <span className="text-blue-500">- Transaction ID</span></code>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[token]')}>[token] <span className="text-blue-500">- Auth Token</span></code>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100" onClick={() => copyToClipboard('[circle]')}>[circle] <span className="text-blue-500">- Circle/State</span></code>
                </div>
                <p className="text-[10px] text-blue-600 mt-2">Example endpoint: <code className="bg-white px-1 rounded">/recharge?token=[token]&number=[number]&amount=[amount]</code>  |  Click any variable to copy</p>
              </div>

              <div className="space-y-2">
                <Label>Parameters</Label>
                <p className="text-xs text-muted-foreground">Add fields sent to the API. Check "Dynamic" and select a system variable for runtime replacement.</p>
                <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  {apiForm.parameters.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border text-sm">
                      <code className="flex-1">{param.fieldName}: <span className={param.isDynamic ? 'text-blue-600 font-semibold' : ''}>{param.fieldValue}</span> {param.isDynamic && <Badge variant="secondary" className="text-[10px]">Dynamic</Badge>}</code>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeParameter(index)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Field Name</Label>
                      <Input placeholder="e.g., token" value={newParam.fieldName} onChange={(e) => setNewParam({ ...newParam, fieldName: e.target.value })} className="text-sm" />
                    </div>
                    <div className="col-span-4">
                      {newParam.isDynamic ? (
                        <div>
                          <Label className="text-xs">System Variable</Label>
                          <Select value={newParam.fieldValue} onValueChange={(v) => setNewParam({ ...newParam, fieldValue: v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Select variable" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="[number]">[number] - Mobile Number</SelectItem>
                              <SelectItem value="[op_code]">[op_code] - Operator Code</SelectItem>
                              <SelectItem value="[amount]">[amount] - Recharge Amount</SelectItem>
                              <SelectItem value="[txn_id]">[txn_id] - Transaction ID</SelectItem>
                              <SelectItem value="[token]">[token] - Auth Token</SelectItem>
                              <SelectItem value="[circle]">[circle] - Circle/State</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">Static Value</Label>
                          <Input placeholder="e.g., mB88Sfu2hz..." value={newParam.fieldValue} onChange={(e) => setNewParam({ ...newParam, fieldValue: e.target.value })} className="text-sm" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center space-x-2 pb-1">
                      <input type="checkbox" checked={newParam.isDynamic} onChange={(e) => setNewParam({ ...newParam, isDynamic: e.target.checked, fieldValue: '' })} className="w-4 h-4" />
                      <Label className="text-xs">Dynamic</Label>
                    </div>
                    <div className="col-span-2">
                      <Button type="button" onClick={addParameter} size="sm" className="bg-accent w-full">Add</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Response Field Mapping</Label>
                <div className="border rounded-lg p-3 bg-muted/30 grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Status Field</Label><Input placeholder="status" value={apiForm.successField} onChange={(e) => setApiForm({ ...apiForm, successField: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Success Value</Label><Input placeholder="Success" value={apiForm.successValue} onChange={(e) => setApiForm({ ...apiForm, successValue: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Failed Value</Label><Input placeholder="Failed" value={apiForm.failedValue} onChange={(e) => setApiForm({ ...apiForm, failedValue: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Pending Value</Label><Input placeholder="Pending" value={apiForm.pendingValue} onChange={(e) => setApiForm({ ...apiForm, pendingValue: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Txn ID Field</Label><Input placeholder="txnid" value={apiForm.txnIdField} onChange={(e) => setApiForm({ ...apiForm, txnIdField: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Balance Field</Label><Input placeholder="balance" value={apiForm.balanceField} onChange={(e) => setApiForm({ ...apiForm, balanceField: e.target.value })} className="text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">Message Field</Label><Input placeholder="status_msg" value={apiForm.messageField} onChange={(e) => setApiForm({ ...apiForm, messageField: e.target.value })} className="text-sm" /></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Check API (Optional)</Label>
                <div className="border rounded-lg p-3 bg-muted/30 grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label className="text-xs">Status Check Endpoint</Label><Input placeholder="/ (same domain)" value={apiForm.statusCheckEndpoint || ''} onChange={(e) => setApiForm({ ...apiForm, statusCheckEndpoint: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Method</Label>
                    <Select value={apiForm.statusCheckMethod || 'GET'} onValueChange={(v) => setApiForm({ ...apiForm, statusCheckMethod: v })}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Format: ?type=STATUS&token=[token]&txn_id=[txn_id]</Label></div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="apiActive" checked={apiForm.isActive} onChange={(e) => setApiForm({ ...apiForm, isActive: e.target.checked })} className="w-4 h-4" />
                <Label htmlFor="apiActive">Active</Label>
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent-hover" data-testid="api-submit-btn">
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Test API - {selectedAPI?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter test parameters to preview the actual API request</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mobile No</Label>
                <Input placeholder="9876543210" value={testForm.mobile} onChange={(e) => setTestForm({...testForm, mobile: e.target.value})} data-testid="test-api-mobile" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Operator Code</Label>
                <Input placeholder="JIO" value={testForm.operatorCode} onChange={(e) => setTestForm({...testForm, operatorCode: e.target.value})} data-testid="test-api-operator" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input type="number" placeholder="199" value={testForm.amount} onChange={(e) => setTestForm({...testForm, amount: e.target.value})} data-testid="test-api-amount" />
              </div>
            </div>
            <Button onClick={executeTestApi} disabled={testing} className="w-full bg-accent hover:bg-accent-hover" data-testid="test-api-execute-btn">
              <PlayCircle className="w-4 h-4 mr-2" />
              {testing ? 'Generating...' : 'Generate Test Request'}
            </Button>

            {testResult && (
              <div className="space-y-3">
                {testResult.status === 'error' ? (
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <p className="text-sm text-red-800">{testResult.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <p className="font-medium text-green-800 text-sm">Request Preview ({testResult.method})</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Full URL</Label>
                      <code className="block bg-muted p-2 rounded text-xs break-all font-mono">{testResult.fullUrl}</code>
                    </div>
                    {testResult.headers?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Headers</Label>
                        <div className="bg-muted p-2 rounded text-xs font-mono">
                          {testResult.headers.map((h, i) => <div key={i}>{h.key}: {h.value}</div>)}
                        </div>
                      </div>
                    )}
                    {testResult.requestBody && Object.keys(testResult.requestBody).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Request Body (JSON)</Label>
                        <pre className="bg-muted p-2 rounded text-xs font-mono overflow-auto">{JSON.stringify(testResult.requestBody, null, 2)}</pre>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs">Parameters ({testResult.parameters?.length || 0})</Label>
                      <div className="bg-muted p-2 rounded text-xs font-mono space-y-1">
                        {testResult.parameters?.map((p, i) => (
                          <div key={i}><span className="text-blue-600">{p.key}</span> = {p.value} {p.isDynamic && <Badge variant="outline" className="text-[9px] px-1 py-0">Dynamic</Badge>}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Response Field Mapping</Label>
                      <div className="bg-muted p-2 rounded text-xs font-mono grid grid-cols-2 gap-1">
                        <div>Success: <span className="text-accent">{testResult.responseMapping?.successField}={testResult.responseMapping?.successValue}</span></div>
                        <div>Failed: <span className="text-destructive">{testResult.responseMapping?.failedValue}</span></div>
                        <div>Pending: <span className="text-yellow-600">{testResult.responseMapping?.pendingValue}</span></div>
                        <div>TxnID: <span className="text-blue-600">{testResult.responseMapping?.txnIdField}</span></div>
                        <div>Balance: <span className="text-blue-600">{testResult.responseMapping?.balanceField}</span></div>
                        <div>Message: <span className="text-blue-600">{testResult.responseMapping?.messageField}</span></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">This previews the actual request. No live call is made to the provider.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default APIConfigurationEnhanced;
