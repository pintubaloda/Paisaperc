import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import adminService from '../../services/adminService';
import { Key, Globe, Shield, Copy, Plus, Trash2 } from 'lucide-react';

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
    } catch {}
  };

  const removeIp = async (userId, ip) => {
    const user = users.find(u => u.id === userId);
    const ips = (user.allowedIps || []).filter(i => i !== ip);
    try {
      await adminService.updateUser(userId, { allowedIps: ips });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedIps: ips } : u));
    } catch {}
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  return (
    <div className="space-y-6" data-testid="reseller-api-page">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="reseller-api-title">
          <Globe className="w-6 h-6" /> Reseller API Management
        </h1>
        <p className="text-muted-foreground text-sm">Manage API keys and IP whitelists for reseller users</p>
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
                    <Button variant="outline" size="sm" onClick={() => copy(user.apiKey)} disabled={!user.apiKey}><Copy className="w-4 h-4" /></Button>
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

        <TabsContent value="docs">
          <Card>
            <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
              <h3 className="text-lg font-bold">API Documentation</h3>
              <p className="text-muted-foreground">Base URL: <code className="bg-muted px-2 py-1 rounded">{API_URL}/api/customer-api</code></p>

              <div className="space-y-4">
                <div className="border rounded p-4">
                  <h4 className="font-semibold text-green-700">POST /recharge</h4>
                  <p className="text-sm text-muted-foreground">Submit a recharge request</p>
                  <pre className="bg-muted p-3 rounded text-xs mt-2">{`Headers:
  x-api-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "mobile": "9876543210",
  "operatorId": "operator-uuid",
  "amount": 199,
  "circle": "Delhi"
}

Response:
{
  "status": "success",
  "txnId": "uuid",
  "providerRef": "REF123",
  "amount": 199,
  "commission": 3.98,
  "responseCode": "00"
}`}</pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold text-blue-700">GET /status/:txnId</h4>
                  <p className="text-sm text-muted-foreground">Check transaction status</p>
                  <pre className="bg-muted p-3 rounded text-xs mt-2">{`Headers:
  x-api-key: YOUR_API_KEY

Response:
{
  "txnId": "uuid",
  "status": "success",
  "amount": 199,
  "mobile": "9876543210",
  "providerRef": "REF123",
  "responseCode": "00"
}`}</pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold text-purple-700">GET /balance</h4>
                  <p className="text-sm text-muted-foreground">Check wallet balance</p>
                  <pre className="bg-muted p-3 rounded text-xs mt-2">{`Headers:
  x-api-key: YOUR_API_KEY

Response:
{
  "balance": 5000
}`}</pre>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-semibold">Webhook Callback</h4>
                  <p className="text-sm text-muted-foreground">Provider sends status updates to:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{API_URL}/api/webhook/:apiId/callback</code>
                  <pre className="bg-muted p-3 rounded text-xs mt-2">{`Headers:
  x-callback-token: CALLBACK_TOKEN

Body:
{
  "txnId": "your-transaction-id",
  "status": "Success",
  "providerRef": "REF123"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResellerAPI;
