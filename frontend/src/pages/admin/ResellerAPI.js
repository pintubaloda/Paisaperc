import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import adminService from '../../services/adminService';
import { Key, Globe, Shield, Copy, Plus, Trash2, Code, Send, Eye, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const ResellerAPI = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newIp, setNewIp] = useState('');
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminService.getUsers();
        setUsers(res.data.filter(u => u.role === 'api_user'));
      } catch {}
    };
    fetchUsers();
  }, []);

  const generateApiKey = async (userId) => {
    const key = 'pk_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      await adminService.updateUser(userId, { apiKey: key });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, apiKey: key } : u));
      toast.success('API key generated');
    } catch {}
  };

  const addIp = async (userId) => {
    if (!newIp) return;
    const user = users.find(u => u.id === userId);
    const ips = [...(user.allowedIps || []), newIp];
    try {
      await adminService.updateUser(userId, { allowedIps: ips });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedIps: ips } : u));
      setNewIp('');
      toast.success('IP added');
    } catch {}
  };

  const removeIp = async (userId, ip) => {
    const user = users.find(u => u.id === userId);
    const ips = (user.allowedIps || []).filter(i => i !== ip);
    try {
      await adminService.updateUser(userId, { allowedIps: ips });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedIps: ips } : u));
      toast.success('IP removed');
    } catch {}
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const EndpointBlock = ({ method, path, description, headers, params, body, response, notes }) => {
    const methodColors = {
      POST: 'bg-green-600 text-white',
      GET: 'bg-blue-600 text-white',
    };
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 flex items-center gap-3 border-b">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="font-mono text-sm font-semibold">{path}</code>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div>
            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Headers</h5>
            <div className="bg-slate-950 rounded-md p-3 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">{headers}</pre>
            </div>
          </div>

          {params && (
            <div>
              <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Parameters</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="text-left py-1.5 px-2 font-medium">Parameter</th><th className="text-left py-1.5 px-2 font-medium">Type</th><th className="text-left py-1.5 px-2 font-medium">Required</th><th className="text-left py-1.5 px-2 font-medium">Description</th></tr></thead>
                  <tbody>
                    {params.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 px-2 font-mono text-blue-600">{p.name}</td>
                        <td className="py-1.5 px-2">{p.type}</td>
                        <td className="py-1.5 px-2">{p.required ? <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Yes</Badge> : <Badge variant="outline" className="text-[10px] px-1.5 py-0">No</Badge>}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {body && (
            <div>
              <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Request Body</h5>
              <div className="bg-slate-950 rounded-md p-3 overflow-x-auto relative group">
                <pre className="text-xs text-amber-300 font-mono">{body}</pre>
                <Button variant="ghost" size="sm" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={() => copyText(body)}>
                  <Copy className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Response</h5>
            <div className="bg-slate-950 rounded-md p-3 overflow-x-auto relative group">
              <pre className="text-xs text-cyan-300 font-mono">{response}</pre>
              <Button variant="ghost" size="sm" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={() => copyText(response)}>
                <Copy className="w-3 h-3 text-white" />
              </Button>
            </div>
          </div>

          {notes && <p className="text-xs text-muted-foreground border-l-2 border-yellow-400 pl-3">{notes}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="reseller-api-page">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="reseller-api-title">
          <Globe className="w-6 h-6" /> Reseller API Management
        </h1>
        <p className="text-muted-foreground text-sm">Manage API keys, IP whitelists, and view integration documentation</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="api-users-tab">API Users</TabsTrigger>
          <TabsTrigger value="docs" data-testid="api-docs-tab">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {users.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No API users found. Create a user with role "api_user" first.
            </CardContent></Card>
          )}
          {users.map(user => (
            <Card key={user.id} data-testid={`api-user-card-${user.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{user.name} <Badge variant="outline" className="ml-2">{user.email}</Badge></span>
                  <Badge>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> API Key</Label>
                  <div className="flex gap-2">
                    <Input value={user.apiKey || 'Not generated'} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={() => copyText(user.apiKey)} disabled={!user.apiKey}><Copy className="w-4 h-4" /></Button>
                    <Button size="sm" onClick={() => generateApiKey(user.id)} data-testid={`generate-key-${user.id}`}>Generate</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Shield className="w-3 h-3" /> IP Whitelist</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(user.allowedIps || []).map(ip => (
                      <Badge key={ip} variant="secondary" className="gap-1">
                        {ip} <button onClick={() => removeIp(user.id, ip)}><Trash2 className="w-3 h-3 text-red-500" /></button>
                      </Badge>
                    ))}
                    {(!user.allowedIps || user.allowedIps.length === 0) && (
                      <span className="text-xs text-muted-foreground">No IP restrictions (all IPs allowed)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. 192.168.1.100" value={newIp} onChange={e => setNewIp(e.target.value)} className="max-w-xs" />
                    <Button size="sm" variant="outline" onClick={() => addIp(user.id)} data-testid={`add-ip-${user.id}`}><Plus className="w-4 h-4 mr-1" /> Add IP</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Code className="w-4 h-4" /> Base URL</h3>
              <div className="flex items-center gap-2">
                <code className="bg-slate-950 text-green-400 px-3 py-1.5 rounded text-sm font-mono flex-1">{API_URL}/api/customer-api</code>
                <Button variant="outline" size="sm" onClick={() => copyText(`${API_URL}/api/customer-api`)}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All requests must include the <code className="bg-muted px-1 rounded">x-api-key</code> header for authentication.</p>
            </CardContent>
          </Card>

          <EndpointBlock
            method="POST"
            path="/recharge"
            description="Submit a new mobile/DTH recharge or bill payment request. The wallet will be debited atomically. On success, commission is credited; on failure, amount is refunded."
            headers={`x-api-key: YOUR_API_KEY\nContent-Type: application/json`}
            params={[
              { name: 'mobile', type: 'string', required: true, desc: '10-digit mobile number or subscriber ID' },
              { name: 'operatorId', type: 'string', required: true, desc: 'UUID of the operator (from operator list)' },
              { name: 'amount', type: 'number', required: true, desc: 'Recharge amount in INR (min: 10)' },
              { name: 'circle', type: 'string', required: false, desc: 'Telecom circle/state (e.g. "Delhi", "Maharashtra")' },
              { name: 'memberId', type: 'string', required: false, desc: 'Your internal reference ID for tracking' },
            ]}
            body={`{
  "mobile": "9876543210",
  "operatorId": "uuid-of-jio-operator",
  "amount": 199,
  "circle": "Delhi",
  "memberId": "MY-REF-001"
}`}
            response={`// Success
{
  "status": "success",
  "txnId": "7fae91d6-6d7a-4c2e-b3f1-abc123",
  "providerRef": "SBX1772393969635",
  "mobile": "9876543210",
  "amount": 199,
  "commission": 3.98,
  "responseCode": "00",
  "responseMessage": "Recharge successful"
}

// Pending
{
  "status": "pending",
  "txnId": "7fae91d6-6d7a-4c2e-b3f1-abc123",
  "providerRef": "SBX1772393969635",
  "amount": 199
}

// Failed
{
  "status": "failed",
  "txnId": "7fae91d6-6d7a-4c2e-b3f1-abc123",
  "responseCode": "99",
  "responseMessage": "Insufficient balance"
}`}
            notes="Wallet is debited before API call. On failure, the full amount is refunded. Commission is credited on success."
          />

          <EndpointBlock
            method="GET"
            path="/status/:txnId"
            description="Check the current status of a transaction. Use this to poll for pending transactions."
            headers={`x-api-key: YOUR_API_KEY`}
            params={[
              { name: 'txnId', type: 'string (path)', required: true, desc: 'Transaction ID returned from /recharge' },
            ]}
            response={`{
  "txnId": "7fae91d6-6d7a-4c2e-b3f1-abc123",
  "status": "success",
  "amount": 199,
  "mobile": "9876543210",
  "providerRef": "SBX1772393969635",
  "responseCode": "00",
  "responseMessage": "Recharge successful"
}`}
            notes="Status can be: success, failed, pending, dispute, refunded"
          />

          <EndpointBlock
            method="GET"
            path="/balance"
            description="Check your current wallet balance."
            headers={`x-api-key: YOUR_API_KEY`}
            response={`{
  "balance": 51000.00
}`}
          />

          <Card className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Security Notes</h3>
              <ul className="text-sm space-y-1.5 text-muted-foreground list-disc pl-4">
                <li><strong>Rate Limiting:</strong> 60 requests per minute per API key</li>
                <li><strong>IP Whitelist:</strong> If configured, only whitelisted IPs can access the API</li>
                <li><strong>HTTPS:</strong> All API calls must use HTTPS</li>
                <li><strong>API Key:</strong> Never share your API key. Rotate it regularly from the dashboard</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Error Codes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 px-3">HTTP Code</th><th className="text-left py-2 px-3">Meaning</th></tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-2 px-3 font-mono">200</td><td className="py-2 px-3">Success</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-mono">400</td><td className="py-2 px-3">Bad Request - Invalid parameters</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-mono">401</td><td className="py-2 px-3">Unauthorized - Invalid or missing API key</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-mono">403</td><td className="py-2 px-3">Forbidden - IP not whitelisted</td></tr>
                    <tr className="border-b"><td className="py-2 px-3 font-mono">429</td><td className="py-2 px-3">Too Many Requests - Rate limit exceeded</td></tr>
                    <tr><td className="py-2 px-3 font-mono">500</td><td className="py-2 px-3">Internal Server Error</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Webhook Callback</h3>
              <p className="text-sm text-muted-foreground">For asynchronous status updates, configure your provider to send webhook callbacks to:</p>
              <div className="flex items-center gap-2">
                <code className="bg-slate-950 text-green-400 px-3 py-1.5 rounded text-sm font-mono flex-1">{`POST ${API_URL}/api/webhook/{apiId}/callback`}</code>
                <Button variant="outline" size="sm" onClick={() => copyText(`${API_URL}/api/webhook/{apiId}/callback`)}><Copy className="w-4 h-4" /></Button>
              </div>
              <div className="bg-slate-950 rounded-md p-3">
                <pre className="text-xs text-amber-300 font-mono">{`Headers:
  x-callback-token: YOUR_CALLBACK_TOKEN

Body:
{
  "txnId": "your-transaction-id",
  "status": "Success",        // Success | Failed
  "providerRef": "PROV-REF-123"
}`}</pre>
              </div>
              <p className="text-xs text-muted-foreground">Webhook replay protection: timestamps older than 5 minutes are rejected.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResellerAPI;
