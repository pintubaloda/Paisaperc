import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import adminService from '../../services/adminService';
import { FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

const KYCSubmit = () => {
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState('pan');
  const [docNumber, setDocNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try { const res = await adminService.getMyKYC(); setDocs(res.data); } catch {}
    };
    fetchDocs();
  }, []);

  const handleSubmit = async () => {
    if (!docNumber) return;
    setLoading(true);
    try {
      await adminService.submitKYC({ docType, docNumber });
      const res = await adminService.getMyKYC();
      setDocs(res.data);
      setDocNumber('');
    } catch {}
    setLoading(false);
  };

  const statusBadge = (status) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const docLabel = { pan: 'PAN Card', aadhaar: 'Aadhaar Card', gst: 'GST Certificate' };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="kyc-submit-page">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6" /> KYC Verification
      </h1>

      <Card>
        <CardHeader><CardTitle>Submit Document</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <select className="w-full border rounded p-2" value={docType} onChange={e => setDocType(e.target.value)} data-testid="kyc-doc-type">
              <option value="pan">PAN Card</option>
              <option value="aadhaar">Aadhaar Card</option>
              <option value="gst">GST Certificate</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Document Number</Label>
            <Input placeholder="Enter document number" value={docNumber} onChange={e => setDocNumber(e.target.value)} data-testid="kyc-doc-number" />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !docNumber} data-testid="submit-kyc-btn">
            <Upload className="w-4 h-4 mr-1" /> Submit for Verification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Documents</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No documents submitted yet</p>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between border rounded p-3" data-testid={`kyc-doc-${doc.id}`}>
                  <div>
                    <p className="font-medium">{docLabel[doc.docType] || doc.docType}</p>
                    <p className="font-mono text-sm text-muted-foreground">{doc.docNumber}</p>
                    {doc.rejectionReason && <p className="text-xs text-red-500">Reason: {doc.rejectionReason}</p>}
                  </div>
                  {statusBadge(doc.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCSubmit;
