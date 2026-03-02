'use client'

import { useEffect, useMemo, useState } from 'react'

import Image from 'next/image'

import { useSession } from 'next-auth/react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type DashboardStats = {
  totalTransactions: number
  totalVolume: number
  todayTransactions: number
  todayVolume: number
  pendingRecharges: number
  successRate: number | string
  walletBalance: number
}

type UserProfile = {
  id: string
  name: string
  email: string
  mobile: string
  role: string
}

type RechargeTxn = {
  id: string
  mobile: string
  operatorName: string
  amount: number
  status: string
  createdAt: string
  responseMessage?: string
}

const formatINR = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0)

const getStatusColor = (status: string) => {
  const normalized = status?.toLowerCase()

  if (normalized === 'success') return 'success'
  if (normalized === 'pending') return 'warning'
  if (normalized === 'failed') return 'error'

  return 'default'
}

const PaisaDashboard = () => {
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageOpen, setImageOpen] = useState(false)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<RechargeTxn[]>([])

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const accessToken = (session as any)?.accessToken

  useEffect(() => {
    const loadDashboard = async () => {
      if (status !== 'authenticated') return

      if (!baseUrl) {
        setError('NEXT_PUBLIC_API_URL is not configured.')
        setLoading(false)
        return
      }

      if (!accessToken) {
        setError('User session token missing. Please login again.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const [statsRes, profileRes, txnsRes] = await Promise.all([
          fetch(`${baseUrl}/reports/dashboard-stats`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          fetch(`${baseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          fetch(`${baseUrl}/recharge/my?limit=8`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ])

        if (!statsRes.ok || !profileRes.ok || !txnsRes.ok) {
          throw new Error('Failed to load dashboard data from backend.')
        }

        const [statsJson, profileJson, txnsJson] = await Promise.all([statsRes.json(), profileRes.json(), txnsRes.json()])

        setStats(statsJson)
        setProfile(profileJson)
        setTransactions(Array.isArray(txnsJson) ? txnsJson : [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load dashboard.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [accessToken, baseUrl, status])

  const pendingAlerts = useMemo(
    () => [
      { label: 'Pending Recharges', value: stats?.pendingRecharges ?? 0 },
      { label: 'Today Transactions', value: stats?.todayTransactions ?? 0 },
      { label: 'Success Rate', value: `${stats?.successRate ?? 0}%` },
      { label: 'Wallet Balance', value: formatINR(stats?.walletBalance) }
    ],
    [stats]
  )

  const totalSales = useMemo(
    () => [
      { label: 'Total Volume', value: formatINR(stats?.totalVolume) },
      { label: 'Today Volume', value: formatINR(stats?.todayVolume) },
      { label: 'Total Transactions', value: stats?.totalTransactions ?? 0 },
      { label: 'Recent Updates', value: transactions.length }
    ],
    [stats, transactions.length]
  )

  if (loading) {
    return <Typography>Loading dashboard...</Typography>
  }

  return (
    <Stack spacing={3}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1.2fr 1fr' }
        }}
      >
        <Card
          sx={{
            color: 'common.white',
            background: 'linear-gradient(135deg, #132f8f 0%, #1f3fb8 50%, #2143c9 100%)'
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Stack direction='row' spacing={1.5} alignItems='center'>
                  <Image src='/images/avatars/1.png' alt='profile' width={54} height={54} style={{ borderRadius: 999 }} />
                  <Box>
                    <Typography variant='h5' color='inherit'>
                      Welcome {profile?.name || 'User'}
                    </Typography>
                    <Typography variant='body2' color='rgba(255,255,255,0.85)'>
                      Role: {profile?.role || '-'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction='row' spacing={1}>
                  <Chip label={`Main ${formatINR(stats?.walletBalance)}`} size='small' sx={{ color: 'common.white' }} />
                  <Chip label={`AEPS ${formatINR(stats?.todayVolume)}`} size='small' sx={{ color: 'common.white' }} />
                </Stack>
              </Stack>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Typography variant='body1'>User: {profile?.name || '-'}</Typography>
                <Typography variant='body1'>Mobile: {profile?.mobile || '-'}</Typography>
                <Typography variant='body1'>Email: {profile?.email || '-'}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h4' color='primary.main'>
                Account Details
              </Typography>
              <Divider />
              <Typography><strong>Account Holder:</strong> {profile?.name || '-'}</Typography>
              <Typography><strong>Email:</strong> {profile?.email || '-'}</Typography>
              <Typography><strong>Mobile:</strong> {profile?.mobile || '-'}</Typography>
              <Typography><strong>Total Transactions:</strong> {stats?.totalTransactions ?? 0}</Typography>
              <Typography><strong>Success Rate:</strong> {stats?.successRate ?? 0}%</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#eef1ff' }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h5' color='primary.main'>
                  Latest Updates
                </Typography>
                <Chip label={transactions.length} color='primary' />
              </Stack>
              <List dense>
                {transactions.slice(0, 4).map(txn => (
                  <ListItem key={txn.id} disableGutters>
                    <ListItemText
                      primary={`${txn.operatorName || 'Recharge'} • ${formatINR(txn.amount)}`}
                      secondary={new Date(txn.createdAt).toLocaleString('en-IN')}
                    />
                  </ListItem>
                ))}
                {transactions.length === 0 ? (
                  <ListItem disableGutters>
                    <ListItemText primary='No updates yet.' />
                  </ListItem>
                ) : null}
              </List>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr 1.1fr' }
        }}
      >
        <Card>
          <CardContent>
            <Typography variant='h5' color='primary.main' sx={{ mb: 2 }}>
              Pending Alerts
            </Typography>
            <List dense>
              {pendingAlerts.map(item => (
                <ListItem key={item.label} disableGutters>
                  <ListItemText primary={item.label} />
                  <Typography color='primary.main' fontWeight={700}>
                    {item.value}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant='h5' color='primary.main' sx={{ mb: 2 }}>
              Total Sale
            </Typography>
            <List dense>
              {totalSales.map(item => (
                <ListItem key={item.label} disableGutters>
                  <ListItemText primary={item.label} />
                  <Typography color='primary.main' fontWeight={700}>
                    {item.value}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card
          sx={{
            color: 'common.white',
            background: 'linear-gradient(140deg, #1d2e95 0%, #2945bb 100%)'
          }}
        >
          <CardContent>
            <Stack spacing={2} alignItems='center' textAlign='center'>
              <Image src='/images/front-pages/landing-page/crm-dashboard.png' alt='promo' width={260} height={140} />
              <Typography color='inherit'>
                Fast recharge operations with real-time transaction tracking and backend-linked status updates.
              </Typography>
              <Button variant='contained' color='secondary' onClick={() => setImageOpen(true)}>
                View Image
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            color: 'common.white',
            background: 'linear-gradient(135deg, #263aaf 0%, #1f2f87 100%)'
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h5' color='inherit'>
                Transaction Feed
              </Typography>
              <List dense>
                {transactions.map(txn => (
                  <ListItem key={txn.id} disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primaryTypographyProps={{ color: 'white' }}
                      secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                      primary={`${txn.mobile} • ${formatINR(txn.amount)}`}
                      secondary={txn.responseMessage || txn.operatorName || '-'}
                    />
                    <Chip
                      label={txn.status}
                      size='small'
                      color={getStatusColor(txn.status) as 'default' | 'success' | 'warning' | 'error'}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={imageOpen} onClose={() => setImageOpen(false)} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 1 }}>
          <Image
            src='/images/front-pages/landing-page/crm-dashboard.png'
            alt='dashboard preview'
            width={1200}
            height={700}
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default PaisaDashboard
