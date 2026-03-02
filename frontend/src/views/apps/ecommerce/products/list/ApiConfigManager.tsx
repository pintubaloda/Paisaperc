'use client'

import { useEffect, useMemo, useState } from 'react'

import { useSession } from 'next-auth/react'

import { alpha, useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type ApiConfig = {
  id: string
  name: string
  apiType: string
  protocol: string
  domain: string
  endpoint: string
  method: string
  requestFormat?: string
  isActive: boolean
  isSandbox?: boolean
  successRate?: number
  balance?: number
  parameters?: Array<{ fieldName: string; fieldValue: string; isDynamic: boolean }>
  headers?: Array<{ key: string; value: string }>
}

type FormState = {
  name: string
  apiType: string
  protocol: string
  domain: string
  endpoint: string
  method: string
  requestFormat: string
  authToken: string
  successField: string
  successValue: string
  failedValue: string
  pendingValue: string
  txnIdField: string
  balanceField: string
  messageField: string
  statusCheckEndpoint: string
  statusCheckMethod: string
  callbackToken: string
  sampleRequest: string
  sampleResponse: string
  isActive: boolean
  isSandbox: boolean
  successRate: number
  balance: number
  parametersJson: string
  headersJson: string
  statusCheckParamsJson: string
  operatorCodesJson: string
  responseMappingsJson: string
}

const createDefaultForm = (): FormState => ({
  name: '',
  apiType: 'mobile',
  protocol: 'https',
  domain: '',
  endpoint: '',
  method: 'GET',
  requestFormat: 'query_param',
  authToken: '',
  successField: 'status',
  successValue: 'Success',
  failedValue: 'Failed',
  pendingValue: 'Pending',
  txnIdField: 'txnid',
  balanceField: 'balance',
  messageField: 'status_msg',
  statusCheckEndpoint: '',
  statusCheckMethod: 'GET',
  callbackToken: '',
  sampleRequest: '',
  sampleResponse: '',
  isActive: true,
  isSandbox: false,
  successRate: 100,
  balance: 0,
  parametersJson: '[]',
  headersJson: '[]',
  statusCheckParamsJson: '[]',
  operatorCodesJson: '[]',
  responseMappingsJson: '[]'
})

const ApiConfigManager = () => {
  const theme = useTheme()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(createDefaultForm())
  const [testResult, setTestResult] = useState<any | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const accessToken = (session as any)?.accessToken

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }),
    [accessToken]
  )

  const loadApiConfigs = async () => {
    if (!baseUrl || !accessToken) {
      setError('Missing API base URL or access token.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const res = await fetch(`${baseUrl}/api-config`, {
        headers,
        cache: 'no-store'
      })

      if (!res.ok) {
        throw new Error('Unable to fetch API configs. This endpoint requires admin user.')
      }

      const json = await res.json()
      setApiConfigs(Array.isArray(json) ? json : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API configs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      loadApiConfigs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, baseUrl, accessToken])

  const filteredRows = useMemo(() => {
    const key = query.trim().toLowerCase()
    if (!key) return apiConfigs

    return apiConfigs.filter(item =>
      [item.name, item.apiType, item.domain, item.endpoint, item.method].join(' ').toLowerCase().includes(key)
    )
  }, [apiConfigs, query])

  const openCreate = () => {
    setEditingId(null)
    setTestResult(null)
    setForm(createDefaultForm())
    setDialogOpen(true)
  }

  const openEdit = (item: ApiConfig) => {
    setEditingId(item.id)
    setTestResult(null)
    setForm({
      name: item.name || '',
      apiType: item.apiType || 'mobile',
      protocol: item.protocol || 'https',
      domain: item.domain || '',
      endpoint: item.endpoint || '',
      method: item.method || 'GET',
      requestFormat: item.requestFormat || 'query_param',
      authToken: (item as any).authToken || '',
      successField: (item as any).successField || 'status',
      successValue: (item as any).successValue || 'Success',
      failedValue: (item as any).failedValue || 'Failed',
      pendingValue: (item as any).pendingValue || 'Pending',
      txnIdField: (item as any).txnIdField || 'txnid',
      balanceField: (item as any).balanceField || 'balance',
      messageField: (item as any).messageField || 'status_msg',
      statusCheckEndpoint: (item as any).statusCheckEndpoint || '',
      statusCheckMethod: (item as any).statusCheckMethod || 'GET',
      callbackToken: (item as any).callbackToken || '',
      sampleRequest: (item as any).sampleRequest || '',
      sampleResponse: (item as any).sampleResponse || '',
      isActive: Boolean(item.isActive),
      isSandbox: Boolean(item.isSandbox),
      successRate: item.successRate ?? 100,
      balance: item.balance ?? 0,
      parametersJson: JSON.stringify(item.parameters || [], null, 2),
      headersJson: JSON.stringify(item.headers || [], null, 2),
      statusCheckParamsJson: JSON.stringify((item as any).statusCheckParams || [], null, 2),
      operatorCodesJson: JSON.stringify((item as any).operatorCodes || [], null, 2),
      responseMappingsJson: JSON.stringify((item as any).responseMappings || [], null, 2)
    })
    setDialogOpen(true)
  }

  const saveItem = async () => {
    if (!baseUrl || !accessToken) return

    try {
      setSaving(true)
      setError('')

      const parsedParameters = JSON.parse(form.parametersJson || '[]')
      const parsedHeaders = JSON.parse(form.headersJson || '[]')
      const parsedStatusCheckParams = JSON.parse(form.statusCheckParamsJson || '[]')
      const parsedOperatorCodes = JSON.parse(form.operatorCodesJson || '[]')
      const parsedResponseMappings = JSON.parse(form.responseMappingsJson || '[]')

      const payload = {
        name: form.name.trim(),
        apiType: form.apiType,
        protocol: form.protocol,
        domain: form.domain.trim(),
        endpoint: form.endpoint.trim(),
        method: form.method,
        requestFormat: form.requestFormat,
        authToken: form.authToken || undefined,
        successField: form.successField || undefined,
        successValue: form.successValue || undefined,
        failedValue: form.failedValue || undefined,
        pendingValue: form.pendingValue || undefined,
        txnIdField: form.txnIdField || undefined,
        balanceField: form.balanceField || undefined,
        messageField: form.messageField || undefined,
        statusCheckEndpoint: form.statusCheckEndpoint || undefined,
        statusCheckMethod: form.statusCheckMethod || undefined,
        callbackToken: form.callbackToken || undefined,
        sampleRequest: form.sampleRequest || undefined,
        sampleResponse: form.sampleResponse || undefined,
        isActive: form.isActive,
        isSandbox: form.isSandbox,
        successRate: Number(form.successRate || 0),
        balance: Number(form.balance || 0),
        parameters: Array.isArray(parsedParameters) ? parsedParameters : [],
        headers: Array.isArray(parsedHeaders) ? parsedHeaders : [],
        statusCheckParams: Array.isArray(parsedStatusCheckParams) ? parsedStatusCheckParams : [],
        operatorCodes: Array.isArray(parsedOperatorCodes) ? parsedOperatorCodes : [],
        responseMappings: Array.isArray(parsedResponseMappings) ? parsedResponseMappings : []
      }

      const url = editingId ? `${baseUrl}/api-config/${editingId}` : `${baseUrl}/api-config`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Save failed.')
      }

      setDialogOpen(false)
      await loadApiConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save API config.')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!baseUrl || !accessToken) return
    if (!confirm('Delete this API config?')) return

    try {
      setError('')
      const res = await fetch(`${baseUrl}/api-config/${id}`, {
        method: 'DELETE',
        headers
      })
      if (!res.ok) throw new Error('Delete failed.')

      await loadApiConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete API config.')
    }
  }

  const testApi = async () => {
    if (!editingId || !baseUrl || !accessToken) return

    try {
      setError('')
      const res = await fetch(`${baseUrl}/api-config/${editingId}/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mobile: '9876543210',
          operatorCode: 'AT',
          amount: 10
        })
      })
      if (!res.ok) throw new Error('Test API request failed.')

      const json = await res.json()
      setTestResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to test API config.')
    }
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
              API Config
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent='space-between'>
              <TextField
                size='small'
                placeholder='Search API config'
                value={query}
                onChange={event => setQuery(event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 320 } }}
              />
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openCreate}>
                Add API
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Success Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading API configs...</TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>No API config found.</TableCell>
                </TableRow>
              ) : (
                filteredRows.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{item.apiType}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>{item.domain}</TableCell>
                    <TableCell>{item.endpoint}</TableCell>
                    <TableCell>{item.successRate ?? 0}%</TableCell>
                    <TableCell>
                      <Chip label={item.isActive ? 'Active' : 'Inactive'} color={item.isActive ? 'success' : 'default'} size='small' />
                    </TableCell>
                    <TableCell align='right'>
                      <Stack direction='row' spacing={1} justifyContent='flex-end'>
                        <Button variant='text' size='small' onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <Button variant='text' color='error' size='small' onClick={() => deleteItem(item.id)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editingId ? 'Edit API Config' : 'Add API Config'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Name' value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} fullWidth />
              <TextField select label='API Type' value={form.apiType} onChange={event => setForm(prev => ({ ...prev, apiType: event.target.value }))} fullWidth>
                <MenuItem value='mobile'>Mobile</MenuItem>
                <MenuItem value='dth'>DTH</MenuItem>
                <MenuItem value='bill_payment'>Bill Payment</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label='Protocol' value={form.protocol} onChange={event => setForm(prev => ({ ...prev, protocol: event.target.value }))} fullWidth>
                <MenuItem value='https'>https</MenuItem>
                <MenuItem value='http'>http</MenuItem>
              </TextField>
              <TextField label='Domain' value={form.domain} onChange={event => setForm(prev => ({ ...prev, domain: event.target.value }))} fullWidth />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Endpoint' value={form.endpoint} onChange={event => setForm(prev => ({ ...prev, endpoint: event.target.value }))} fullWidth />
              <TextField select label='Method' value={form.method} onChange={event => setForm(prev => ({ ...prev, method: event.target.value }))} fullWidth>
                <MenuItem value='GET'>GET</MenuItem>
                <MenuItem value='POST'>POST</MenuItem>
                <MenuItem value='POST_JSON'>POST_JSON</MenuItem>
                <MenuItem value='POSTDATA'>POSTDATA</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label='Request Format'
                value={form.requestFormat}
                onChange={event => setForm(prev => ({ ...prev, requestFormat: event.target.value }))}
                fullWidth
              >
                <MenuItem value='query_param'>query_param</MenuItem>
                <MenuItem value='json'>json</MenuItem>
              </TextField>
              <TextField
                label='Success Rate %'
                type='number'
                value={form.successRate}
                onChange={event => setForm(prev => ({ ...prev, successRate: Number(event.target.value) }))}
                fullWidth
              />
              <TextField
                label='Balance'
                type='number'
                value={form.balance}
                onChange={event => setForm(prev => ({ ...prev, balance: Number(event.target.value) }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label='Auth Token'
                value={form.authToken}
                onChange={event => setForm(prev => ({ ...prev, authToken: event.target.value }))}
                fullWidth
              />
              <TextField
                label='Callback Token'
                value={form.callbackToken}
                onChange={event => setForm(prev => ({ ...prev, callbackToken: event.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Success Field' value={form.successField} onChange={event => setForm(prev => ({ ...prev, successField: event.target.value }))} fullWidth />
              <TextField label='Success Value' value={form.successValue} onChange={event => setForm(prev => ({ ...prev, successValue: event.target.value }))} fullWidth />
              <TextField label='Failed Value' value={form.failedValue} onChange={event => setForm(prev => ({ ...prev, failedValue: event.target.value }))} fullWidth />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Pending Value' value={form.pendingValue} onChange={event => setForm(prev => ({ ...prev, pendingValue: event.target.value }))} fullWidth />
              <TextField label='Txn ID Field' value={form.txnIdField} onChange={event => setForm(prev => ({ ...prev, txnIdField: event.target.value }))} fullWidth />
              <TextField label='Balance Field' value={form.balanceField} onChange={event => setForm(prev => ({ ...prev, balanceField: event.target.value }))} fullWidth />
            </Stack>

            <TextField
              label='Message Field'
              value={form.messageField}
              onChange={event => setForm(prev => ({ ...prev, messageField: event.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label='Status Check Endpoint'
                value={form.statusCheckEndpoint}
                onChange={event => setForm(prev => ({ ...prev, statusCheckEndpoint: event.target.value }))}
                fullWidth
              />
              <TextField
                label='Status Check Method'
                value={form.statusCheckMethod}
                onChange={event => setForm(prev => ({ ...prev, statusCheckMethod: event.target.value }))}
                fullWidth
              />
            </Stack>

            <Stack direction='row' spacing={2} alignItems='center'>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography>Active</Typography>
                <Switch checked={form.isActive} onChange={event => setForm(prev => ({ ...prev, isActive: event.target.checked }))} />
              </Stack>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography>Sandbox</Typography>
                <Switch checked={form.isSandbox} onChange={event => setForm(prev => ({ ...prev, isSandbox: event.target.checked }))} />
              </Stack>
            </Stack>

            <TextField
              label='Parameters JSON'
              value={form.parametersJson}
              onChange={event => setForm(prev => ({ ...prev, parametersJson: event.target.value }))}
              multiline
              minRows={5}
            />

            <TextField
              label='Headers JSON'
              value={form.headersJson}
              onChange={event => setForm(prev => ({ ...prev, headersJson: event.target.value }))}
              multiline
              minRows={4}
            />

            <TextField
              label='Status Check Params JSON'
              value={form.statusCheckParamsJson}
              onChange={event => setForm(prev => ({ ...prev, statusCheckParamsJson: event.target.value }))}
              multiline
              minRows={4}
            />

            <TextField
              label='Operator Codes JSON'
              value={form.operatorCodesJson}
              onChange={event => setForm(prev => ({ ...prev, operatorCodesJson: event.target.value }))}
              multiline
              minRows={4}
            />

            <TextField
              label='Response Mappings JSON'
              value={form.responseMappingsJson}
              onChange={event => setForm(prev => ({ ...prev, responseMappingsJson: event.target.value }))}
              multiline
              minRows={4}
            />

            <TextField
              label='Sample Request'
              value={form.sampleRequest}
              onChange={event => setForm(prev => ({ ...prev, sampleRequest: event.target.value }))}
              multiline
              minRows={3}
            />

            <TextField
              label='Sample Response'
              value={form.sampleResponse}
              onChange={event => setForm(prev => ({ ...prev, sampleResponse: event.target.value }))}
              multiline
              minRows={3}
            />

            {testResult ? (
              <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.08) }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Test Result
                </Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(testResult, null, 2)}</pre>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingId ? (
            <Button variant='tonal' onClick={testApi}>
              Test API
            </Button>
          ) : null}
          <Button onClick={() => setDialogOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button variant='contained' onClick={saveItem} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ApiConfigManager
