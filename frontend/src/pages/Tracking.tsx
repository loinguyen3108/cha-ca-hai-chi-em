import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  useTheme,
  useMediaQuery,
  Autocomplete,
  Snackbar,
  Alert,
} from '@mui/material';
import { customerAPI, authAPI } from '../services/api';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  sale_price: number;
}

interface Customer {
  id: number;
  name: string;
}

interface TrackProduct extends Product {
  quantity: number;
  discount: number;
  total: number;
}

export default function Tracking() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<TrackProduct[]>([]);
  const [totalOrderPrice, setTotalOrderPrice] = useState<number>(0);
  const [newCustomerName, setNewCustomerName] = useState<string>('');

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    calculateTotalOrderPrice();
  }, [products]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerAPI.getCustomers();
        setCustomers(response.data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await authAPI.getProducts();
        const trackProducts: TrackProduct[] = ((response.data as unknown) as Product[]).map(product => ({
          ...product,
          quantity: 0,
          discount: 0,
          total: 0
        }));
        setProducts(trackProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchCustomers();
    fetchProducts();
  }, []);

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 0) return;
    setProducts(prevProducts => prevProducts.map(product => {
      if (product.id === productId) {
        const total = (quantity * product.sale_price) - product.discount;
        return { ...product, quantity, total };
      }
      return product;
    }));
  };

  const handleDiscountChange = (productId: number, discount: number) => {
    if (discount < 0) return;
    setProducts(prevProducts => prevProducts.map(product => {
      if (product.id === productId) {
        const total = (product.quantity * product.sale_price) - discount;
        return { ...product, discount, total };
      }
      return product;
    }));
  };

  const calculateTotalOrderPrice = () => {
    const total = products.reduce((sum, product) => sum + product.total, 0);
    setTotalOrderPrice(total);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!orderDate) {
      setSnackbarMessage('Please select an order date');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!selectedCustomer && !newCustomerName) {
      setSnackbarMessage('Please select a customer or enter a new customer name');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const orderLines = products
      .filter(product => product.quantity > 0)
      .map(product => ({
        product_id: product.id,
        quantity: product.quantity,
        sale_price: product.sale_price,
        discount: product.discount,
      }));

    // Check if there are any valid order lines
    if (orderLines.length === 0) {
      setSnackbarMessage('No valid order lines to submit. Please add products with quantity greater than 0.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const orderData = {
      customer: selectedCustomer ? { id: selectedCustomer.id } : { name: newCustomerName },
      ordered_date: orderDate,
      order_lines: orderLines,
    };

    try {
      const response = await axios.post('/api/v1/order', orderData);
      if (response.data.success) {
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity('success');
        // Reset form
        setOrderDate(new Date().toISOString().split('T')[0]);
        setSelectedCustomer(null);
        setNewCustomerName('');
        setProducts(prevProducts =>
          prevProducts.map(product => ({ ...product, quantity: 0, discount: 0, total: 0 }))
        );
      } else {
        setSnackbarMessage(`Order submission failed: ${response.data.message}`);
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setSnackbarMessage('Failed to submit order. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
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
        Track Sales
      </Typography>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 1, sm: 3 },
          mb: 3,
          backgroundColor: 'white',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: { xs: '100%', sm: '30%' }
        }}>
          <TextField
            label="Order Date"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
            InputLabelProps={{ shrink: true }}
          />

          <Autocomplete
            options={customers}
            getOptionLabel={(option: Customer | string) =>
              typeof option === 'string' ? option : option.name
            }
            value={selectedCustomer}
            onChange={(_, newValue: Customer | string | null) => {
              if (typeof newValue === 'string') {
                setNewCustomerName(newValue);
                setSelectedCustomer(null);
              } else {
                setSelectedCustomer(newValue);
                setNewCustomerName('');
              }
            }}
            filterOptions={(options, { inputValue }) => {
              return options.filter((option): option is Customer => {
                return typeof option !== 'string' && option.name.toLowerCase().includes(inputValue.toLowerCase());
              });
            }}
            isOptionEqualToValue={(option: string | Customer, value: string | Customer) => {
              if (typeof option === 'string' || typeof value === 'string') return false;
              return option.id === value.id;
            }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                placeholder="Search or enter new customer name..."
                fullWidth
                onChange={(e) => {
                  if (!selectedCustomer) {
                    setNewCustomerName(e.target.value);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            )}
            renderOption={(props, option: string | Customer) => {
              if (typeof option === 'string') return null;
              return (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              );
            }}
            noOptionsText="No customers found - New customer will be created"
            loadingText="Loading customers..."
            openText="Open"
            closeText="Close"
            clearText="Clear"
          />
        </Box>

        <TableContainer
          sx={{
            mb: 3,
            '& .MuiTable-root': {
              borderCollapse: 'collapse',
              width: '100%',
              '& th, & td': {
                border: `1px solid ${theme.palette.grey[300]}`,
              },
            }
          }}
        >
          <Table
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                px: { xs: 1, sm: 2 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'center',
                verticalAlign: 'middle',
              },
              '& .MuiTableCell-head': {
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: theme.palette.grey[50],
              },
              '& .MuiTableCell-body': {
                borderColor: theme.palette.grey[200],
              },
              '& tr:last-child td': {
                borderBottom: 'none',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: { xs: '40px', sm: '50px' } }}>ID</TableCell>
                <TableCell sx={{
                  width: { xs: '40%', sm: '40%' },
                  textAlign: 'left',
                  minWidth: { xs: '120px', sm: '200px' }
                }}>Product Name</TableCell>
                <TableCell align="center" sx={{
                  width: { xs: '25%', sm: '20%' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: { xs: '80px', sm: '100px' }
                }}>
                  Sale Price
                </TableCell>
                <TableCell align="center" sx={{
                  width: { xs: '20%', sm: '15%' },
                  minWidth: { xs: '60px', sm: '80px' }
                }}>Quantity</TableCell>
                <TableCell align="center" sx={{
                  width: { xs: '20%', sm: '15%' },
                  minWidth: { xs: '60px', sm: '80px' }
                }}>Discount</TableCell>
                <TableCell align="center" sx={{
                  display: { xs: 'none', sm: 'table-cell' },
                  width: { sm: '15%' },
                  minWidth: { sm: '100px' }
                }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow>
                    <TableCell align="center" sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {product.id}
                    </TableCell>
                    <TableCell sx={{
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      textAlign: 'left',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {product.name}
                    </TableCell>
                    <TableCell align="center" sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {product.sale_price.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}
                        inputProps={{
                          min: 0,
                          style: {
                            padding: '4px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            width: '100%'
                          }
                        }}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.15)',
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            py: '4px',
                            px: '2px',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        value={product.discount}
                        onChange={(e) => handleDiscountChange(product.id, Number(e.target.value))}
                        inputProps={{
                          min: 0,
                          style: {
                            padding: '4px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            width: '100%'
                          }
                        }}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.15)',
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            py: '4px',
                            px: '2px',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{
                      display: { xs: 'none', sm: 'table-cell' },
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {product.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{
                    display: { xs: 'table-row', sm: 'none' },
                    backgroundColor: theme.palette.grey[50],
                    '& td': {
                      py: 1,
                      px: 2,
                      border: 'none',
                      fontSize: '0.75rem',
                      textAlign: 'right',
                      fontWeight: 500
                    }
                  }}>
                    <TableCell colSpan={5}>
                      Total: {product.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell
                  colSpan={isMobile ? 4 : 5}
                  align="right"
                  sx={{
                    border: 'none',
                    pt: 2,
                    pr: 2,
                    fontWeight: 'bold',
                  }}
                >
                  Total Order Price:
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    border: 'none',
                    pt: 2,
                    width: { xs: '20%', sm: '15%' },
                    fontWeight: 'bold',
                  }}
                >
                  {totalOrderPrice.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}
          >
            Submit Order
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 