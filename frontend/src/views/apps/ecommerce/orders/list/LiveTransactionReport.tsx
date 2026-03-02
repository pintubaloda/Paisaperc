'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useSession } from 'next-auth/react'

import { alpha, useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Txn = {
  id: string
  userName?: string
  userId: string
  operatorName: string
  mobile: string
  amount: number
  status: string
  apiId?: string
  providerRef?: string
  responseMessage?: string
  createdAt: string
}

const formatINR = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value)

const LiveTransactionReport = () => {
  const theme = useTheme()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const firstLoadRef = useRef(true)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const accessToken = (session as any)?.accessToken

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const loadTransactions = async () => {
      if (status !== 'authenticated') return

      if (!baseUrl || !accessToken) {
        setError('Missing API configuration or access token.')
        setLoading(false)
        return
      }

      try {
        if (firstLoadRef.current) setLoading(true)
        setError('')

        const headers = { Authorization: `Bearer ${accessToken}` }
        let res = await fetch(`${baseUrl}/reports/transactions?limit=50`, { headers, cache: 'no-store' })

        if (!res.ok) {
          res = await fetch(`${baseUrl}/recharge/my?limit=50`, { headers, cache: 'no-store' })
        }

        if (!res.ok) throw new Error('Unable to fetch transactions from backend.')

        const json = await res.json()
        setTransactions(Array.isArray(json) ? json : [])
        firstLoadRef.current = false
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transactions.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
    timer = setInterval(loadTransactions, 15000)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [accessToken, baseUrl, status])

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') return transactions
    return transactions.filter(txn => txn.status?.toLowerCase() === statusFilter)
  }, [statusFilter, transactions])

  return (
    <Stack spacing={3}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.info.light, 0.08)} 100%)`
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent='space-between' alignItems='center'>
            <Typography variant='h4' color='primary.main'>
              Live Transaction Report
            </Typography>
            <TextField
              select
              size='small'
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='success'>Success</MenuItem>
              <MenuItem value='failed'>Failed</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Sr.No.</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Txn ID</TableCell>
                <TableCell>Inventory</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>API</TableCell>
                <TableCell>Operator Ref</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12}>Loading live transactions...</TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12}>No transactions found.</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((txn, index) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography>
                        {(txn.userName || txn.userId || '').slice(0, 26)}
                        {txn.userName && txn.userName.length > 26 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color='error.main' fontWeight={600}>
                        {txn.id.slice(0, 12).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>{txn.operatorName || '-'}</TableCell>
                    <TableCell>{txn.mobile || '-'}</TableCell>
                    <TableCell>{formatINR(txn.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={txn.status}
                        size='small'
                        color={
                          txn.status === 'success' ? 'success' : txn.status === 'failed' ? 'error' : txn.status === 'pending' ? 'warning' : 'default'
                        }
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>API</TableCell>
                    <TableCell>{new Date(txn.createdAt).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{txn.apiId || '-'}</TableCell>
                    <TableCell>{txn.providerRef || '-'}</TableCell>
                    <TableCell>{txn.responseMessage || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  )
}

export default LiveTransactionReport
