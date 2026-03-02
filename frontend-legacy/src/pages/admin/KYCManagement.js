import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import adminService from '../../services/adminService';
import { FileText, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

const KYCManagement = () => {
  const [kycDocs, setKycDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tab, setTab] = useState('pending');

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, pendRes] = await Promise.all([adminService.getKYCDocuments(), adminService.getPendingKYC()]);
      setKycDocs(allRes.data);
      setPendingDocs(pendRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleVerify = async (status) => {
    if (!selectedDoc) return;
    try {
      await adminService.verifyKYC(selectedDoc.id, { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined });
      setVerifyDialog(false);
      fetchDocs();
    } catch {}
  };

  const openVerify = (doc) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setVerifyDialog(true);
  };

  const statusBadge = (status) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const docTypeLabel = (type) => {
    const map = { pan: 'PAN Card', aadhaar: 'Aadhaar Card', gst: 'GST Certificate' };
    return map[type] || type;
  };

  const currentDocs = tab === 'pending' ? pendingDocs : kycDocs;

  return (
    <div className="space-y-6" data-testid="kyc-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="kyc-management-title">
            <FileText className="w-6 h-6" /> KYC Management
          </h1>
          <p className="text-muted-foreground text-sm">{pendingDocs.length} pending verifications</p>
        </div>
        <Button variant="outline" onClick={fetchDocs} disabled={loading} data-testid="refresh-kyc-btn">
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="kyc-pending-tab">Pending ({pendingDocs.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="kyc-all-tab">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              <table className="w-full" data-testid="kyc-table">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">User ID</th>
                  <th className="text-left p-3 font-medium text-sm">Document Type</th>
                  <th className="text-left p-3 font-medium text-sm">Document Number</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-left p-3 font-medium text-sm">Submitted</th>
                  <th className="text-left p-3 font-medium text-sm">Actions</th>
                </tr></thead>
                <tbody>
                  {currentDocs.map(doc => (
                    <tr key={doc.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{doc.userId?.slice(0, 12)}...</td>
                      <td className="p-3 font-medium">{docTypeLabel(doc.docType)}</td>
                      <td className="p-3 font-mono">{doc.docNumber}</td>
                      <td className="p-3">{statusBadge(doc.status)}</td>
                      <td className="p-3 text-xs">{new Date(doc.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        {doc.status === 'pending' && (
                          <Button size="sm" onClick={() => openVerify(doc)} data-testid={`verify-kyc-${doc.id}`}>
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {currentDocs.length === 0 && (
                    <tr><td colSpan="6" className="text-center text-muted-foreground py-8">No documents found</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verify Dialog */}
      <Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Verify KYC Document</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-4" data-testid="verify-kyc-dialog">
              <div className="bg-muted/50 rounded p-3 space-y-2">
                <p className="text-sm"><strong>Type:</strong> {docTypeLabel(selectedDoc.docType)}</p>
                <p className="text-sm"><strong>Number:</strong> <span className="font-mono">{selectedDoc.docNumber}</span></p>
                <p className="text-sm"><strong>User:</strong> {selectedDoc.userId}</p>
                {selectedDoc.docUrl && <p className="text-sm"><strong>Document:</strong> <a href={selectedDoc.docUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View Document</a></p>}
              </div>
              <div className="space-y-2">
                <Label>Rejection Reason (if rejecting)</Label>
                <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} data-testid="kyc-rejection-reason" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleVerify('approved')} data-testid="approve-kyc-btn">
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleVerify('rejected')} data-testid="reject-kyc-btn">
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCManagement;
