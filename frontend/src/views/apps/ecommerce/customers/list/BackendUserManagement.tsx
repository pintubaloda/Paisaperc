'use client'

import { useEffect, useMemo, useState } from 'react'

import { useSession } from 'next-auth/react'

import { alpha, useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
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

type BackendUser = {
  id: string
  name: string
  email: string
  mobile: string
  role: string
  isActive: boolean
  kycStatus: boolean
  kycVerificationStatus?: string
  createdAt: string
}

type WalletRow = {
  userId: string
  balance: number
}

type UserWithWallet = BackendUser & {
  balance: number
}

const formatINR = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value)

const BackendUserManagement = () => {
  const theme = useTheme()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserWithWallet[]>([])
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const accessToken = (session as any)?.accessToken

  useEffect(() => {
    const loadUsers = async () => {
      if (status !== 'authenticated') return

      if (!baseUrl || !accessToken) {
        setError('Missing API configuration or access token.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const headers = { Authorization: `Bearer ${accessToken}` }

        let usersRes = await fetch(`${baseUrl}/users`, { headers })
        let usersJson: BackendUser[] = []

        if (usersRes.ok) {
          usersJson = await usersRes.json()
        } else {
          const meRes = await fetch(`${baseUrl}/users/me`, { headers })
          if (!meRes.ok) throw new Error('Unable to fetch users from backend.')
          const meJson = await meRes.json()
          usersJson = [meJson]
        }

        const walletsRes = await fetch(`${baseUrl}/wallet/all`, { headers })
        const walletsJson: WalletRow[] = walletsRes.ok ? await walletsRes.json() : []
        const walletMap = new Map(walletsJson.map(wallet => [wallet.userId, wallet.balance]))

        const merged = usersJson.map(user => ({
          ...user,
          balance: walletMap.get(user.id) || 0
        }))

        setUsers(merged)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load users.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [accessToken, baseUrl, status])

  const filteredUsers = useMemo(() => {
    const key = query.trim().toLowerCase()
    if (!key) return users

    return users.filter(user =>
      [user.name, user.email, user.mobile, user.role, user.id].join(' ').toLowerCase().includes(key)
    )
  }, [query, users])

  const summary = useMemo(() => {
    const total = users.length
    const approved = users.filter(user => user.kycVerificationStatus === 'approved' || user.kycStatus).length
    const pending = users.filter(user => user.kycVerificationStatus === 'pending' || !user.kycStatus).length
    const rejected = users.filter(user => user.kycVerificationStatus === 'rejected').length

    return { total, approved, pending, rejected }
  }, [users])

  const openMenu = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setSelectedUserId(userId)
    setMenuAnchor(event.currentTarget)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setSelectedUserId('')
  }

  return (
    <Stack spacing={3}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='h4' color='primary.main'>
              User Management
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button variant='contained'>Manage Users</Button>
              <Button variant='tonal'>Search User</Button>
              <Button variant='tonal'>Bulk Users</Button>
              <Button variant='tonal'>KYC Approval Summary</Button>
            </Stack>

            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
              <Typography fontWeight={700}>Total KYC Count ({summary.total}):</Typography>
              <Chip label={`Approved ${summary.approved}`} color='success' size='small' variant='tonal' />
              <Chip label={`Pending ${summary.pending}`} color='warning' size='small' variant='tonal' />
              <Chip label={`Rejected ${summary.rejected}`} color='error' size='small' variant='tonal' />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent='space-between'>
              <Stack direction='row' spacing={1}>
                <Button variant='contained' startIcon={<i className='tabler-plus' />}>
                  Add
                </Button>
                <Button variant='tonal' startIcon={<i className='tabler-filter' />}>
                  Filter
                </Button>
              </Stack>
              <TextField
                size='small'
                placeholder='Search'
                value={query}
                onChange={event => setQuery(event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 280 } }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Sr.No.</TableCell>
                <TableCell>User Details</TableCell>
                <TableCell>Account Details</TableCell>
                <TableCell>User Type</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Registered On</TableCell>
                <TableCell>KYC</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9}>Loading users...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>No users found.</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography fontWeight={600}>{user.mobile || '-'}</Typography>
                        <Typography color='primary.main'>{user.email}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography>{user.name}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {user.id.slice(0, 16)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{user.role.replaceAll('_', ' ')}</TableCell>
                    <TableCell>{formatINR(user.balance)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.kycStatus ? 'Approved' : user.kycVerificationStatus || 'Pending'}
                        color={user.kycStatus ? 'success' : user.kycVerificationStatus === 'rejected' ? 'error' : 'warning'}
                        size='small'
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={user.isActive ? 'Active' : 'Deactive'} color={user.isActive ? 'success' : 'error'} size='small' />
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton size='small' onClick={event => openMenu(event, user.id)}>
                        <i className='tabler-dots-vertical' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu open={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={closeMenu}>
        <MenuItem disabled>{selectedUserId ? `User: ${selectedUserId.slice(0, 10)}` : 'User actions'}</MenuItem>
        <MenuItem onClick={closeMenu}>View User Details</MenuItem>
        <MenuItem onClick={closeMenu}>View Child</MenuItem>
        <MenuItem onClick={closeMenu}>View Parent</MenuItem>
        <MenuItem onClick={closeMenu}>Update KYC</MenuItem>
        <MenuItem onClick={closeMenu}>Cap Balance</MenuItem>
        <MenuItem onClick={closeMenu}>API Credentials</MenuItem>
      </Menu>
    </Stack>
  )
}

export default BackendUserManagement
