import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import api from '../services/api';
import { toast } from 'sonner';
import { Plus, ArrowUpCircle } from 'lucide-react';

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'bank_transfer',
    referenceNumber: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, ledgerRes, requestsRes] = await Promise.all([
        api.wallet.get(),
        api.wallet.getLedger(50),
        api.paymentRequests.getMy(),
      ]);
      setWallet(walletRes.data);
      setLedger(ledgerRes.data);
      setPaymentRequests(requestsRes.data);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRequest = async (e) => {
    e.preventDefault();
    try {
      await api.paymentRequests.create(paymentForm, null);
      toast.success('Payment request submitted successfully');
      setShowPaymentDialog(false);
      setPaymentForm({ amount: '', paymentMode: 'bank_transfer', referenceNumber: '', remarks: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit payment request');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="wallet-page">
      <Card className="bg-gradient-to-br from-accent to-accent-hover text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 mb-2">Available Balance</p>
              <p className="text-4xl font-bold font-heading">₹{wallet?.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-accent hover:bg-white/90"
                  data-testid="add-money-btn"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Money
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Wallet Top-up</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePaymentRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                      data-testid="payment-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Input
                      placeholder="e.g., Bank Transfer, UPI"
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                      required
                      data-testid="payment-mode-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input
                      placeholder="Transaction reference"
                      value={paymentForm.referenceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                      required
                      data-testid="payment-ref-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks (Optional)</Label>
                    <Input
                      placeholder="Additional notes"
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                      data-testid="payment-remarks-input"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent-hover" data-testid="submit-payment-request-btn">
                    Submit Request
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger" data-testid="tab-ledger">Transaction Ledger</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">Payment Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {ledger.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`ledger-entry-${entry.id}`}>
                      <div>
                        <p className="font-medium">{entry.remark}</p>
                        <p className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          entry.type === 'CREDIT' ? 'text-accent' : 'text-destructive'
                        }`}>
                          {entry.type === 'CREDIT' ? '+' : '-'}₹{(entry.credit || entry.debit).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Balance: ₹{entry.balanceAfter.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Payment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payment requests</p>
              ) : (
                <div className="space-y-3">
                  {paymentRequests.map((req) => (
                    <div key={req.id} className="p-4 border rounded-lg" data-testid={`payment-request-${req.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">₹{req.amount}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          req.status === 'approved' ? 'bg-accent/10 text-accent' :
                          req.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{req.paymentMode} - {req.referenceNumber}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                      {req.adminRemarks && (
                        <p className="text-sm mt-2 text-muted-foreground">Admin: {req.adminRemarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletPage;
