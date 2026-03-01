import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import adminService from '../../services/adminService';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await adminService.get2FAStatus();
        setStatus(res.data);
      } catch {}
    };
    fetchStatus();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await adminService.enable2FA();
      setSecret(res.data.secret);
      setStatus({ enabled: true });
    } catch {}
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await adminService.disable2FA();
      setStatus({ enabled: false });
      setSecret('');
    } catch {}
    setLoading(false);
  };

  const handleVerify = async () => {
    try {
      const res = await adminService.verify2FA(code);
      setVerifyResult(res.data.valid);
    } catch {
      setVerifyResult(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6" data-testid="two-factor-settings">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6" /> Two-Factor Authentication
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            2FA Status
            {status?.enabled ? (
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>
            ) : (
              <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.enabled ? (
            <Button onClick={handleEnable} disabled={loading} data-testid="enable-2fa-btn">
              Enable 2FA
            </Button>
          ) : (
            <>
              {secret && (
                <div className="bg-muted p-4 rounded space-y-2">
                  <Label>Your Secret Key (save this)</Label>
                  <p className="font-mono text-lg tracking-wider">{secret}</p>
                  <p className="text-xs text-muted-foreground">Enter this key in your authenticator app (Google Authenticator, Authy, etc.)</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Verify Code</Label>
                <div className="flex gap-2">
                  <Input placeholder="Enter 6-digit code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} data-testid="2fa-code-input" />
                  <Button onClick={handleVerify} data-testid="verify-2fa-btn">Verify</Button>
                </div>
                {verifyResult !== null && (
                  <p className={verifyResult ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                    {verifyResult ? 'Code verified successfully!' : 'Invalid code. Try again.'}
                  </p>
                )}
              </div>

              <Button variant="destructive" onClick={handleDisable} disabled={loading} data-testid="disable-2fa-btn">
                Disable 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorSettings;
