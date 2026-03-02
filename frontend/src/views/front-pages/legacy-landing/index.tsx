'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

const features = [
  {
    title: 'Mobile Recharge',
    description: 'Instant recharges for all major operators nationwide.'
  },
  {
    title: 'DTH Recharge',
    description: 'Quick DTH top-ups with strong success rate and tracking.'
  },
  {
    title: 'Bill Payments',
    description: 'Electricity, gas and utility bill payments in one place.'
  },
  {
    title: 'Secure Platform',
    description: 'Role-based auth with detailed ledger and audit trail.'
  },
  {
    title: 'High Commissions',
    description: 'Configurable commission rules by role and operator.'
  },
  {
    title: 'Multi-Role System',
    description: 'Admin, retailer, distributor and API user support.'
  }
]

const demoAccounts = [
  { role: 'Admin', email: 'admin@paisape.com', password: 'admin123' },
  { role: 'Retailer', email: 'retailer@demo.com', password: 'retailer123' },
  { role: 'Distributor', email: 'distributor@demo.com', password: 'distributor123' },
  { role: 'API User', email: 'api@demo.com', password: 'apiuser123' }
]

const LegacyLandingPage = () => {
  return (
    <Box className='p-6 md:p-10' sx={{ background: 'linear-gradient(180deg, #f6f8fb 0%, #ffffff 55%)' }}>
      <Box className='mx-auto max-is-[1200px]'>
        <Box className='text-center p-8 md:p-12 rounded-xl bg-[rgb(20,24,33)] text-white'>
          <Typography variant='h3' className='font-bold mbe-3'>
            PaisaPe Legacy Landing
          </Typography>
          <Typography className='mbe-6 text-white/80'>
            Previous landing style is now available alongside the new theme pages.
          </Typography>
          <Box className='flex gap-3 justify-center flex-wrap'>
            <Button component={Link} href='/login' variant='contained'>
              Login
            </Button>
            <Button component={Link} href='/register' color='secondary' variant='contained'>
              Register
            </Button>
            <Button component={Link} href='/front-pages/landing-page' variant='tonal'>
              New Landing
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4} className='mbe-8 mt-1'>
          {features.map(item => (
            <Grid key={item.title} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant='h6' className='mbe-2'>
                    {item.title}
                  </Typography>
                  <Typography color='text.secondary'>{item.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Demo Credentials
            </Typography>
            <Typography className='mbe-4' color='text.secondary'>
              Run <code>npm run seed</code> in backend once, then use these accounts.
            </Typography>
            <Grid container spacing={3}>
              {demoAccounts.map(account => (
                <Grid key={account.email} size={{ xs: 12, md: 6 }}>
                  <Box className='p-4 rounded border border-solid border-[rgba(0,0,0,0.08)]'>
                    <Chip label={account.role} color='primary' size='small' className='mbe-2' />
                    <Typography className='mbe-1'>
                      <b>Email:</b> {account.email}
                    </Typography>
                    <Typography>
                      <b>Password:</b> {account.password}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default LegacyLandingPage
