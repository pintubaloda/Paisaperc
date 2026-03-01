import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../services/api';
import { toast } from 'sonner';
import { Smartphone, Tv } from 'lucide-react';

const RechargePage = () => {
  const [operators, setOperators] = useState([]);
  const [formData, setFormData] = useState({ operatorId: '', mobile: '', amount: '', circle: '' });
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('mobile');

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await api.operators.getAll();
      setOperators(res.data);
    } catch (error) {
      toast.error('Failed to fetch operators');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.recharge.create(formData);
      toast.success('Recharge successful!');
      setFormData({ operatorId: '', mobile: '', amount: '', circle: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = operators.filter(op => op.service === serviceType && op.isActive);

  return (
    <div className="max-w-2xl mx-auto" data-testid="recharge-page">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-heading">New Recharge</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={serviceType} onValueChange={setServiceType} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mobile" data-testid="tab-mobile">
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="dth" data-testid="tab-dth">
                <Tv className="w-4 h-4 mr-2" />
                DTH
              </TabsTrigger>
              <TabsTrigger value="bill_payment" data-testid="tab-bill">
                Bill Payment
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={formData.operatorId}
                onValueChange={(value) => setFormData({ ...formData, operatorId: value })}
                required
              >
                <SelectTrigger data-testid="operator-select">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {filteredOperators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile / Account Number</Label>
              <Input
                id="mobile"
                placeholder="Enter number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                data-testid="mobile-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                data-testid="amount-input"
              />
            </div>

            {serviceType === 'mobile' && (
              <div className="space-y-2">
                <Label htmlFor="circle">Circle (Optional)</Label>
                <Input
                  id="circle"
                  placeholder="e.g., Delhi, Mumbai"
                  value={formData.circle}
                  onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                  data-testid="circle-input"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent-hover"
              disabled={loading}
              data-testid="recharge-submit-btn"
            >
              {loading ? 'Processing...' : 'Recharge Now'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RechargePage;
