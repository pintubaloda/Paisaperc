import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import adminService from '../../services/adminService';
import { Shield, CheckCircle, XCircle, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState(null);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
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
      setQrCode(res.data.qrCodeUrl);
      setBackupCodes(res.data.backupCodes || []);
      setStatus({ isEnabled: true, isVerified: false });
      toast.success('2FA enabled. Scan the QR code with your authenticator app.');
    } catch {
      toast.error('Failed to enable 2FA');
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await adminService.disable2FA();
      setStatus({ isEnabled: false, isVerified: false });
      setSecret('');
      setQrCode('');
      setBackupCodes([]);
      setVerifyResult(null);
      toast.success('2FA disabled successfully');
    } catch {
      toast.error('Failed to disable 2FA');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code) return;
    try {
      const res = await adminService.verify2FA(code);
      setVerifyResult(res.data.valid);
      if (res.data.valid) {
        toast.success('Code verified! 2FA is now active.');
        setStatus(prev => ({ ...prev, isVerified: true }));
      } else {
        toast.error('Invalid code. Try again.');
      }
    } catch {
      setVerifyResult(false);
      toast.error('Verification failed');
    }
    setCode('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="two-factor-settings">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6" /> Two-Factor Authentication
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            2FA Status
            {status?.isEnabled ? (
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>
            ) : (
              <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!status?.isEnabled ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Protect your account with time-based one-time passwords (TOTP)</p>
              <Button onClick={handleEnable} disabled={loading} data-testid="enable-2fa-btn" size="lg">
                <Shield className="w-4 h-4 mr-2" /> Enable 2FA
              </Button>
            </div>
          ) : (
            <>
              {qrCode && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-6 flex flex-col items-center">
                    <p className="text-sm font-medium mb-3 text-gray-700">Scan this QR code with your authenticator app</p>
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" data-testid="2fa-qr-code" />
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <Label className="text-xs font-medium">Manual Entry Key</Label>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm tracking-wider flex-1 break-all">{secret}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secret)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Verify Code from Authenticator</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    maxLength={8}
                    data-testid="2fa-code-input"
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  />
                  <Button onClick={handleVerify} data-testid="verify-2fa-btn">Verify</Button>
                </div>
                {verifyResult !== null && (
                  <p className={verifyResult ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                    {verifyResult ? 'Code verified successfully!' : 'Invalid code. Try again.'}
                  </p>
                )}
              </div>

              {backupCodes.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-1"><KeyRound className="w-4 h-4" /> Backup Codes</Label>
                  <p className="text-xs text-muted-foreground">Save these codes in a safe place. Each code can only be used once.</p>
                  <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg">
                    {backupCodes.map((bc, i) => (
                      <code key={i} className="font-mono text-sm">{bc}</code>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(backupCodes.join('\n'))}>
                    <Copy className="w-4 h-4 mr-2" /> Copy All Backup Codes
                  </Button>
                </div>
              )}

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
