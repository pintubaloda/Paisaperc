'use client'

import { useEffect, useMemo, useState } from 'react'

import Image from 'next/image'

import { useSession } from 'next-auth/react'

import { alpha, useTheme } from '@mui/material/styles'
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

const PaisaEcommerceDashboard = () => {
  const theme = useTheme()
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
      { label: 'Mobile Recharge', value: stats?.pendingRecharges ?? 0 },
      { label: 'DTH', value: Math.max(1, Math.ceil((stats?.pendingRecharges || 0) / 2)) },
      { label: 'Money Transfer', value: stats?.todayTransactions ?? 0 },
      { label: 'Insurance', value: `${stats?.successRate ?? 0}%` },
      { label: 'CMS', value: formatINR(stats?.walletBalance) }
    ],
    [stats]
  )

  const totalSales = useMemo(
    () => [
      { label: 'Mobile Recharge', value: formatINR(stats?.todayVolume) },
      { label: 'DTH', value: formatINR((stats?.todayVolume || 0) * 0.4) },
      { label: 'Money Transfer', value: formatINR((stats?.totalVolume || 0) * 0.2) },
      { label: 'Insurance', value: formatINR((stats?.totalVolume || 0) * 0.15) },
      { label: 'CMS', value: formatINR((stats?.totalVolume || 0) * 0.1) }
    ],
    [stats]
  )

  if (loading) return <Typography>Loading dashboard...</Typography>

  return (
    <Stack spacing={3}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', xl: '1.3fr 1.15fr 0.95fr' }
        }}
      >
        <Card
          sx={{
            color: 'primary.contrastText',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' gap={2}>
                <Stack direction='row' spacing={1.5} alignItems='center'>
                  <Image src='/images/avatars/1.png' alt='profile' width={56} height={56} style={{ borderRadius: 999 }} />
                  <Box>
                    <Typography variant='h4' color='inherit'>
                      Welcome {profile?.name || 'User'}
                    </Typography>
                    <Typography variant='body2' color='inherit'>
                      {profile?.role || '-'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction='row' spacing={1}>
                  <Chip label={`Main ${formatINR(stats?.walletBalance)}`} size='small' sx={{ color: 'white' }} />
                  <Chip label={`AEPS ${formatINR(stats?.todayVolume)}`} size='small' sx={{ color: 'white' }} />
                </Stack>
              </Stack>

              <Divider sx={{ borderColor: alpha(theme.palette.common.white, 0.25) }} />

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                <Typography color='inherit'>User: {profile?.name || '-'}</Typography>
                <Typography color='inherit'>Mobile: {profile?.mobile || '-'}</Typography>
                <Typography color='inherit'>Email: {profile?.email || '-'}</Typography>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                <Typography color='inherit'>A/C No: 2026-01-{(stats?.totalTransactions || 0).toString().padStart(4, '0')}</Typography>
                <Typography color='inherit'>IFSC: PERC0001203</Typography>
                <Typography color='inherit'>Account: {profile?.name || 'PaisaPerc'} Pvt. Ltd.</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`
          }}
        >
          <CardContent>
            <Stack spacing={1.25}>
              <Typography variant='h4' color='primary.main'>
                Account Details
              </Typography>
              <Divider />
              <Typography><strong>Bank Name:</strong> PaisaPerc Bank</Typography>
              <Typography><strong>Account Holder:</strong> {profile?.name || '-'}</Typography>
              <Typography><strong>Email:</strong> {profile?.email || '-'}</Typography>
              <Typography><strong>Virtual A/C:</strong> {profile?.mobile ? `VA-${profile.mobile}` : '-'}</Typography>
              <Typography><strong>IFSC:</strong> PERC0001203</Typography>
              <Typography><strong>Address:</strong> Railway Cloud Merchant Panel</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: alpha(theme.palette.info.light, 0.2) }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h5' color='info.main'>
                  Latest Update
                </Typography>
                <Chip label={transactions.length} color='info' />
              </Stack>
              <List dense sx={{ p: 0 }}>
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
          gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr 0.9fr 1.1fr' }
        }}
      >
        <Card>
          <CardContent>
            <Typography variant='h5' color='primary.main' sx={{ mb: 1.5 }}>
              Pending Alerts
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <List dense sx={{ p: 0 }}>
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
            <Typography variant='h5' color='secondary.main' sx={{ mb: 1.5 }}>
              Total Sale
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <List dense sx={{ p: 0 }}>
              {totalSales.map(item => (
                <ListItem key={item.label} disableGutters>
                  <ListItemText primary={item.label} />
                  <Typography color='secondary.main' fontWeight={700}>
                    {item.value}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card
          sx={{
            color: 'warning.contrastText',
            background: `linear-gradient(145deg, ${theme.palette.warning.main} 0%, ${theme.palette.primary.dark} 100%)`
          }}
        >
          <CardContent>
            <Stack spacing={2} alignItems='center' textAlign='center'>
              <Image src='/images/cards/graphic-illustration-1.png' alt='promo' width={220} height={160} />
              <Typography color='inherit'>
                Real-time recharge orchestration, wallet visibility, and operator insights in one place.
              </Typography>
              <Button variant='contained' color='inherit' onClick={() => setImageOpen(true)}>
                Open Visual
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            color: 'common.white',
            background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.primary.main} 100%)`
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h5' color='inherit'>
                Transaction Feed
              </Typography>
              <List dense sx={{ p: 0 }}>
                {transactions.map(txn => (
                  <ListItem key={txn.id} disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primaryTypographyProps={{ color: 'white' }}
                      secondaryTypographyProps={{ color: alpha(theme.palette.common.white, 0.85) }}
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
            src='/images/cards/graphic-illustration-1.png'
            alt='dashboard visual'
            width={1200}
            height={800}
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default PaisaEcommerceDashboard
