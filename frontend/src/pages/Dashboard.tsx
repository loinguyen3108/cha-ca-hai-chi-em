import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  Button,
  ButtonGroup,
} from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';
import {
  Inventory as InventoryIcon,
  Input as InputIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { subDays } from 'date-fns';

interface StatCardProps {
  icon: React.ReactElement<SvgIconProps>;
  title: string;
  value: string | number;
}

const StatCard = ({ icon, title, value }: StatCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'primary.light',
              borderRadius: '50%',
              width: 48,
              height: 48,
              mr: 2
            }}
          >
            {React.cloneElement(icon, { 
              sx: { color: 'primary.main', fontSize: 24 } 
            })}
          </Box>
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography 
          variant="h3" 
          component="div"
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: 'text.primary'
          }}
        >
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const handleDateRangeSelect = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
  };

  // Mock data for the chart
  const chartData = [
    { date: '2024-03-01', revenue: 4000, profit: 2400 },
    { date: '2024-03-02', revenue: 3000, profit: 1398 },
    { date: '2024-03-03', revenue: 2000, profit: 9800 },
    { date: '2024-03-04', revenue: 2780, profit: 3908 },
    { date: '2024-03-05', revenue: 1890, profit: 4800 },
    { date: '2024-03-06', revenue: 2390, profit: 3800 },
    { date: '2024-03-07', revenue: 3490, profit: 4300 },
  ];

  // Calculate totals from chart data
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = chartData.reduce((sum, item) => sum + item.profit, 0);

  const stats = [
    {
      icon: <InventoryIcon />,
      title: 'Total Products',
      value: 150
    },
    {
      icon: <InputIcon />,
      title: 'Total Imports',
      value: 12
    },
    {
      icon: <ShoppingCartIcon />,
      title: 'Total Orders',
      value: 1234
    }
  ];

  return (
    <Box sx={{ 
      height: '100%',
      p: { xs: 2, sm: 3 },
      backgroundColor: theme.palette.background.default
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          mb: 4,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        Dashboard
      </Typography>
      
      <Grid 
        container 
        spacing={{ xs: 2, sm: 3 }}
        direction={isMobile ? 'column' : 'row'}
      >
        {stats.map((stat, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4} 
            key={index}
            sx={{ width: '100%' }}
          >
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Paper 
        sx={{ 
          mt: 4, 
          p: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              mb: 2,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Revenue & Profit Overview
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={2}>
              <ButtonGroup 
                variant="outlined" 
                size="small"
                sx={{ 
                  flexWrap: 'wrap',
                  '& .MuiButton-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 }
                  }
                }}
              >
                <Button onClick={() => handleDateRangeSelect(7)}>Last Week</Button>
                <Button onClick={() => handleDateRangeSelect(30)}>Last Month</Button>
                <Button onClick={() => handleDateRangeSelect(90)}>Last 3 Months</Button>
                <Button onClick={() => handleDateRangeSelect(180)}>Last 6 Months</Button>
                <Button onClick={() => handleDateRangeSelect(365)}>Last Year</Button>
              </ButtonGroup>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
              >
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  sx={{ width: { xs: '100%', sm: '200px' } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  sx={{ width: { xs: '100%', sm: '200px' } }}
                />
              </Stack>
            </Stack>
          </LocalizationProvider>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(124, 124, 255, 0.1)',
                  }}
                >
                  <MoneyIcon sx={{ color: '#7C7CFF', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    Total Revenue
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#7C7CFF',
                      fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}
                  >
                    ${totalRevenue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(82, 196, 138, 0.1)',
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#52C48A', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    Total Profit
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#52C48A',
                      fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}
                  >
                    ${totalProfit.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
} 