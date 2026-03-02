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
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
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
  authToken?: string
  successField?: string
  successValue?: string
  failedValue?: string
  pendingValue?: string
  txnIdField?: string
  balanceField?: string
  messageField?: string
  statusCheckEndpoint?: string
  statusCheckMethod?: string
  callbackToken?: string
  sampleRequest?: string
  sampleResponse?: string
  isActive: boolean
  isSandbox?: boolean
  successRate?: number
  balance?: number
  parameters?: Array<{ fieldName: string; fieldValue: string; isDynamic: boolean }>
  headers?: Array<{ key: string; value: string }>
  statusCheckParams?: any[]
  operatorCodes?: any[]
  responseMappings?: any[]
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

const DYNAMIC_VARIABLES = [
  { key: '[number]', label: 'Mobile Number' },
  { key: '[op_code]', label: 'Operator Code' },
  { key: '[amount]', label: 'Amount' },
  { key: '[txn_id]', label: 'Transaction ID' },
  { key: '[token]', label: 'Auth Token' },
  { key: '[circle]', label: 'Circle/State' },
  { key: '[provider_ref]', label: 'Provider Ref' }
]

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

const parseArray = (value: string) => {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

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

  const [parameterFieldName, setParameterFieldName] = useState('')
  const [parameterValue, setParameterValue] = useState('')
  const [parameterSystemVar, setParameterSystemVar] = useState('[number]')
  const [parameterDynamic, setParameterDynamic] = useState(true)

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

      const res = await fetch(`${baseUrl}/api-config`, { headers, cache: 'no-store' })

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
    if (status === 'authenticated') loadApiConfigs()
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
    setForm(createDefaultForm())
    setTestResult(null)
    setParameterFieldName('')
    setParameterValue('')
    setParameterSystemVar('[number]')
    setParameterDynamic(true)
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
      authToken: item.authToken || '',
      successField: item.successField || 'status',
      successValue: item.successValue || 'Success',
      failedValue: item.failedValue || 'Failed',
      pendingValue: item.pendingValue || 'Pending',
      txnIdField: item.txnIdField || 'txnid',
      balanceField: item.balanceField || 'balance',
      messageField: item.messageField || 'status_msg',
      statusCheckEndpoint: item.statusCheckEndpoint || '',
      statusCheckMethod: item.statusCheckMethod || 'GET',
      callbackToken: item.callbackToken || '',
      sampleRequest: item.sampleRequest || '',
      sampleResponse: item.sampleResponse || '',
      isActive: Boolean(item.isActive),
      isSandbox: Boolean(item.isSandbox),
      successRate: item.successRate ?? 100,
      balance: item.balance ?? 0,
      parametersJson: JSON.stringify(item.parameters || [], null, 2),
      headersJson: JSON.stringify(item.headers || [], null, 2),
      statusCheckParamsJson: JSON.stringify(item.statusCheckParams || [], null, 2),
      operatorCodesJson: JSON.stringify(item.operatorCodes || [], null, 2),
      responseMappingsJson: JSON.stringify(item.responseMappings || [], null, 2)
    })
    setDialogOpen(true)
  }

  const addParameter = () => {
    if (!parameterFieldName.trim()) return

    const rows = parseArray(form.parametersJson)

    rows.push({
      fieldName: parameterFieldName.trim(),
      fieldValue: parameterDynamic ? parameterSystemVar : parameterValue,
      isDynamic: parameterDynamic
    })

    setForm(prev => ({ ...prev, parametersJson: JSON.stringify(rows, null, 2) }))
    setParameterFieldName('')
    setParameterValue('')
    setParameterSystemVar('[number]')
    setParameterDynamic(true)
  }

  const removeParameter = (index: number) => {
    const rows = parseArray(form.parametersJson).filter((_: any, i: number) => i !== index)
    setForm(prev => ({ ...prev, parametersJson: JSON.stringify(rows, null, 2) }))
  }

  const buildPayload = () => ({
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
    parameters: parseArray(form.parametersJson),
    headers: parseArray(form.headersJson),
    statusCheckParams: parseArray(form.statusCheckParamsJson),
    operatorCodes: parseArray(form.operatorCodesJson),
    responseMappings: parseArray(form.responseMappingsJson)
  })

  const saveItem = async () => {
    if (!baseUrl || !accessToken) return

    try {
      setSaving(true)
      setError('')

      const url = editingId ? `${baseUrl}/api-config/${editingId}` : `${baseUrl}/api-config`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(buildPayload())
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

  const runTest = async (id: string) => {
    if (!baseUrl || !accessToken) return

    try {
      setError('')
      const res = await fetch(`${baseUrl}/api-config/${id}/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mobile: '9876543210', operatorCode: 'AT', amount: 10 })
      })

      if (!res.ok) throw new Error('Test API request failed.')
      setTestResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to test API config.')
    }
  }

  const deleteItem = async (id: string) => {
    if (!baseUrl || !accessToken) return
    if (!confirm('Delete this API config?')) return

    try {
      setError('')
      const res = await fetch(`${baseUrl}/api-config/${id}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('Delete failed.')
      await loadApiConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete API config.')
    }
  }

  const parameterRows = parseArray(form.parametersJson)

  return (
    <Stack spacing={3}>
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}` }}>
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
                <TableCell>API</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading API configs...</TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No API config found.</TableCell>
                </TableRow>
              ) : (
                filteredRows.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{item.name}</Typography>
                      <Typography variant='body2' color='text.secondary'>{`${item.protocol}://${item.domain}${item.endpoint}`}</Typography>
                    </TableCell>
                    <TableCell><Chip label={item.apiType} size='small' /></TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>
                      <Chip label={item.isActive ? 'Active' : 'Inactive'} color={item.isActive ? 'success' : 'default'} size='small' />
                    </TableCell>
                    <TableCell align='right'>
                      <Stack direction='row' spacing={1} justifyContent='flex-end' flexWrap='wrap' useFlexGap>
                        <Button variant='outlined' size='small' onClick={() => openEdit(item)}>Edit</Button>
                        <Button variant='outlined' size='small' onClick={() => openEdit(item)}>Op Codes</Button>
                        <Button variant='outlined' size='small' onClick={() => openEdit(item)}>Responses</Button>
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={async () => {
                            openEdit(item)
                            await runTest(item.id)
                          }}
                        >
                          Test API
                        </Button>
                        <Button variant='contained' color='error' size='small' onClick={() => deleteItem(item.id)}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>{editingId ? 'Edit API' : 'Add API'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='API Name *' value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} fullWidth />
              <TextField select label='Service Type *' value={form.apiType} onChange={event => setForm(prev => ({ ...prev, apiType: event.target.value }))} fullWidth>
                <MenuItem value='mobile'>Mobile</MenuItem>
                <MenuItem value='dth'>DTH</MenuItem>
                <MenuItem value='bill_payment'>Bill Payment</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label='Protocol' value={form.protocol} onChange={event => setForm(prev => ({ ...prev, protocol: event.target.value }))} fullWidth>
                <MenuItem value='https'>HTTPS</MenuItem>
                <MenuItem value='http'>HTTP</MenuItem>
              </TextField>
              <TextField select label='Method *' value={form.method} onChange={event => setForm(prev => ({ ...prev, method: event.target.value }))} fullWidth>
                <MenuItem value='GET'>GET (Query Params)</MenuItem>
                <MenuItem value='POST'>POST</MenuItem>
                <MenuItem value='POST_JSON'>POST (JSON)</MenuItem>
                <MenuItem value='POSTDATA'>POST (Form Data)</MenuItem>
              </TextField>
              <TextField select label='Request Format' value={form.requestFormat} onChange={event => setForm(prev => ({ ...prev, requestFormat: event.target.value }))} fullWidth>
                <MenuItem value='query_param'>Query Parameters</MenuItem>
                <MenuItem value='json'>JSON Body</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Domain *' value={form.domain} onChange={event => setForm(prev => ({ ...prev, domain: event.target.value }))} fullWidth />
              <TextField label='Endpoint *' value={form.endpoint} onChange={event => setForm(prev => ({ ...prev, endpoint: event.target.value }))} fullWidth />
            </Stack>

            <TextField label='Auth Token (Optional)' value={form.authToken} onChange={event => setForm(prev => ({ ...prev, authToken: event.target.value }))} fullWidth />

            <Box sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant='h6' sx={{ mb: 1 }}>Available Dynamic Variables</Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {DYNAMIC_VARIABLES.map(v => (
                  <Chip
                    key={v.key}
                    label={`${v.key} - ${v.label}`}
                    variant='outlined'
                    color='primary'
                    onClick={() => navigator.clipboard?.writeText(v.key).catch(() => {})}
                  />
                ))}
              </Stack>
              <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
                Example endpoint: /recharge?token=[token]&number=[number]&amount=[amount]
              </Typography>
            </Box>

            <Typography variant='h6'>Parameters</Typography>
            <Typography variant='body2' color='text.secondary'>
              Add fields sent to API. Select dynamic variable for runtime replacement.
            </Typography>

            {parameterRows.map((param: any, index: number) => (
              <Box
                key={`${param.fieldName}-${index}`}
                sx={{ p: 1.5, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography>{`${param.fieldName}: ${param.fieldValue}`}</Typography>
                <IconButton color='error' onClick={() => removeParameter(index)}>
                  <i className='tabler-trash' />
                </IconButton>
              </Box>
            ))}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Field Name' placeholder='e.g., token' value={parameterFieldName} onChange={event => setParameterFieldName(event.target.value)} fullWidth />
              <TextField select label='System Variable' value={parameterSystemVar} onChange={event => setParameterSystemVar(event.target.value)} fullWidth>
                {DYNAMIC_VARIABLES.map(v => (
                  <MenuItem key={v.key} value={v.key}>{`${v.key} - ${v.label}`}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <TextField
                label='Static Value'
                value={parameterValue}
                onChange={event => setParameterValue(event.target.value)}
                fullWidth
                disabled={parameterDynamic}
              />
              <Stack direction='row' spacing={1} alignItems='center' sx={{ minWidth: 120 }}>
                <Switch checked={parameterDynamic} onChange={event => setParameterDynamic(event.target.checked)} />
                <Typography>Dynamic</Typography>
              </Stack>
              <Button variant='contained' color='success' onClick={addParameter} sx={{ minWidth: 110 }}>
                Add
              </Button>
            </Stack>

            <Divider />
            <Typography variant='h6'>Response Field Mapping</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Status Field' value={form.successField} onChange={event => setForm(prev => ({ ...prev, successField: event.target.value }))} fullWidth />
              <TextField label='Success Value' value={form.successValue} onChange={event => setForm(prev => ({ ...prev, successValue: event.target.value }))} fullWidth />
              <TextField label='Failed Value' value={form.failedValue} onChange={event => setForm(prev => ({ ...prev, failedValue: event.target.value }))} fullWidth />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Pending Value' value={form.pendingValue} onChange={event => setForm(prev => ({ ...prev, pendingValue: event.target.value }))} fullWidth />
              <TextField label='Txn ID Field' value={form.txnIdField} onChange={event => setForm(prev => ({ ...prev, txnIdField: event.target.value }))} fullWidth />
              <TextField label='Balance Field' value={form.balanceField} onChange={event => setForm(prev => ({ ...prev, balanceField: event.target.value }))} fullWidth />
            </Stack>

            <TextField label='Message Field' value={form.messageField} onChange={event => setForm(prev => ({ ...prev, messageField: event.target.value }))} fullWidth />

            <Typography variant='h6'>Status Check API (Optional)</Typography>
            <Typography variant='body2' color='text.secondary'>
              Configure endpoint to check transaction status. Use [txn_id], [token], [number], [provider_ref].
            </Typography>

            <TextField label='Status Check Endpoint' value={form.statusCheckEndpoint} onChange={event => setForm(prev => ({ ...prev, statusCheckEndpoint: event.target.value }))} fullWidth />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Method' value={form.statusCheckMethod} onChange={event => setForm(prev => ({ ...prev, statusCheckMethod: event.target.value }))} fullWidth />
              <TextField label='Callback Token' value={form.callbackToken} onChange={event => setForm(prev => ({ ...prev, callbackToken: event.target.value }))} fullWidth />
            </Stack>

            <Divider />
            <Typography variant='h6'>Advanced JSON</Typography>
            <TextField label='Headers JSON' value={form.headersJson} onChange={event => setForm(prev => ({ ...prev, headersJson: event.target.value }))} multiline minRows={3} />
            <TextField label='Status Check Params JSON' value={form.statusCheckParamsJson} onChange={event => setForm(prev => ({ ...prev, statusCheckParamsJson: event.target.value }))} multiline minRows={3} />
            <TextField label='Operator Codes JSON' value={form.operatorCodesJson} onChange={event => setForm(prev => ({ ...prev, operatorCodesJson: event.target.value }))} multiline minRows={3} />
            <TextField label='Response Mappings JSON' value={form.responseMappingsJson} onChange={event => setForm(prev => ({ ...prev, responseMappingsJson: event.target.value }))} multiline minRows={3} />
            <TextField label='Sample Request' value={form.sampleRequest} onChange={event => setForm(prev => ({ ...prev, sampleRequest: event.target.value }))} multiline minRows={2} />
            <TextField label='Sample Response' value={form.sampleResponse} onChange={event => setForm(prev => ({ ...prev, sampleResponse: event.target.value }))} multiline minRows={2} />

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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label='Success Rate %' type='number' value={form.successRate} onChange={event => setForm(prev => ({ ...prev, successRate: Number(event.target.value) }))} fullWidth />
              <TextField label='Balance' type='number' value={form.balance} onChange={event => setForm(prev => ({ ...prev, balance: Number(event.target.value) }))} fullWidth />
            </Stack>

            {testResult ? (
              <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.08) }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>Test Result</Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(testResult, null, 2)}</pre>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingId ? (
            <Button variant='tonal' onClick={() => runTest(editingId)}>
              Test API
            </Button>
          ) : null}
          <Button onClick={() => setDialogOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button variant='contained' onClick={saveItem} disabled={saving || !form.name.trim() || !form.domain.trim() || !form.endpoint.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ApiConfigManager
