import React, { useEffect, useState } from 'react';
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
import { format, subDays, eachDayOfInterval, parseISO, differenceInMonths, endOfWeek, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { getDashboardMetrics, DashboardMetrics } from '../services/dashboard';
import { authAPI } from '../services/api';

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
  const [stats, setStats] = useState({ totalProducts: 0, totalImports: 0, totalOrders: 0 });
  const [metrics, setMetrics] = useState<DashboardMetrics['metrics'] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDateRangeSelect = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
  };

  // Original stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authAPI.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  // New metrics fetch for revenue and profit
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!startDate || !endDate) return;
      
      try {
        setLoading(true);
        const response = await getDashboardMetrics(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        if (response.success) {
          setMetrics(response.metrics);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [startDate, endDate]);

  // Format chart data with dynamic grouping based on date range
  const chartData = React.useMemo(() => {
    if (!metrics?.sales.order_at_list || !startDate || !endDate) {
      return [];
    }

    const monthsDiff = differenceInMonths(endDate, startDate);
    
    // Create a map of all data points
    const dataMap = new Map(
      metrics.sales.order_at_list.map(item => [
        format(parseISO(item.order_at), 'yyyy-MM-dd'),
        item
      ])
    );

    // Helper function to sum up values for a date range
    const sumValuesForRange = (start: Date, end: Date) => {
      let totalRevenue = 0;
      let totalProfit = 0;
      
      const daysInRange = eachDayOfInterval({ start, end });
      daysInRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const data = dataMap.get(dateStr);
        if (data) {
          totalRevenue += data.total_revenue;
          totalProfit += data.total_profit;
        }
      });

      return {
        revenue: totalRevenue,
        profit: totalProfit
      };
    };

    // Group by days (default for <= 1 month)
    if (monthsDiff <= 1) {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const data = dataMap.get(dateStr);
        return {
          date: dateStr,
          revenue: data?.total_revenue || 0,
          profit: data?.total_profit || 0,
          label: format(date, 'dd/MM')
        };
      });
    }
    
    // Group by weeks (for 1-6 months)
    if (monthsDiff <= 6) {
      return eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 } // Week starts on Monday
      ).map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const values = sumValuesForRange(weekStart, weekEnd);
        return {
          date: format(weekStart, 'yyyy-MM-dd'),
          revenue: values.revenue,
          profit: values.profit,
          label: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`
        };
      });
    }
    
    // Group by months (for > 6 months)
    return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const values = sumValuesForRange(monthStart, monthEnd);
      return {
        date: format(monthStart, 'yyyy-MM-dd'),
        revenue: values.revenue,
        profit: values.profit,
        label: format(monthStart, 'MM/yyyy')
      };
    });
  }, [metrics, startDate, endDate]);

  // Use metrics directly from backend
  const totalRevenue = metrics?.sales.total_revenue || 0;
  const totalProfit = metrics?.sales.total_profit || 0;

  return (
    <Box sx={{ 
      height: '100%',
      p: { xs: 2, sm: 3 },
      backgroundColor: theme.palette.background.default
    }}>
      <Typography 
        variant="h4"
        sx={{ 
          mb: 3,
          fontWeight: 700,
          background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '100%',
            height: '4px',
            background: theme.palette.primary.main,
            borderRadius: '2px',
          },
          textAlign: 'center'
        }}
      >
        Dashboard
      </Typography>
      
      <Grid 
        container 
        spacing={{ xs: 2, sm: 3 }}
        direction={isMobile ? 'column' : 'row'}
      >
        <Grid 
          item 
          xs={12} 
          sm={6} 
          md={4} 
          sx={{ width: '100%' }}
        >
          <StatCard 
            icon={<InventoryIcon />} 
            title="Total Products" 
            value={stats.totalProducts} 
          />
        </Grid>
        <Grid 
          item 
          xs={12} 
          sm={6} 
          md={4} 
          sx={{ width: '100%' }}
        >
          <StatCard 
            icon={<InputIcon />} 
            title="Total Imports" 
            value={stats.totalImports} 
          />
        </Grid>
        <Grid 
          item 
          xs={12} 
          sm={6} 
          md={4} 
          sx={{ width: '100%' }}
        >
          <StatCard 
            icon={<ShoppingCartIcon />} 
            title="Total Orders" 
            value={stats.totalOrders} 
          />
        </Grid>
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
                    {totalRevenue.toLocaleString()} VND
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
                    {totalProfit.toLocaleString()} VND
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ height: 400, width: '100%' }}>
          {chartData.length > 0 ? (
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch', // For smooth scrolling on iOS
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: 4,
                  '&:hover': {
                    backgroundColor: '#555',
                  },
                },
              }}
            >
              <Box sx={{ 
                height: 400,
                // Ensure minimum width for mobile to allow proper data display
                minWidth: {
                  xs: chartData.length <= 7 ? '100%' : `${chartData.length * 50}px`,
                  sm: '100%'
                },
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const item = chartData.find(d => d.date === value);
                        return item?.label || '';
                      }}
                      interval="preserveStartEnd"
                      minTickGap={30}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        try {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } catch (e) {
                          return '0';
                        }
                      }}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '10px',
                        fontSize: isMobile ? 12 : 14,
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} VND`, undefined]}
                      labelFormatter={(label) => {
                        try {
                          return format(parseISO(label), 'dd/MM/yyyy');
                        } catch (e) {
                          return '';
                        }
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{
                        paddingBottom: '20px',
                        fontSize: isMobile ? 12 : 14,
                      }}
                    />
                    <Line
                      name="Revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7C7CFF"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                    />
                    <Line
                      name="Profit"
                      type="monotone"
                      dataKey="profit"
                      stroke="#52C48A"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary'
              }}
            >
              <Typography variant="body1">
                {loading ? 'Loading chart data...' : 'No data available for the selected date range'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 