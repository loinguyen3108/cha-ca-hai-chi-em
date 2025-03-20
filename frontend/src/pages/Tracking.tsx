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
} from '@mui/material';

interface Product {
  id: number;
  name: string;
  sale_price: number;
  stock_quantity: number;
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: 'Nguyen Van A' },
    { id: 2, name: 'Tran Thi B' },
    { id: 3, name: 'Le Van C' },
    { id: 4, name: 'Pham Thi D' },
    { id: 5, name: 'Hoang Van E' },
    { id: 6, name: 'Mai Thi F' },
    { id: 7, name: 'Dang Van G' },
    { id: 8, name: 'Bui Thi H' },
    { id: 9, name: 'Do Van I' },
    { id: 10, name: 'Ngo Thi K' },
  ]);
  const [products, setProducts] = useState<TrackProduct[]>([
    {
      id: 1,
      name: 'Cha Ca Thang Long',
      sale_price: 150000,
      stock_quantity: 100,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 2,
      name: 'Cha Ca La Vong',
      sale_price: 180000,
      stock_quantity: 80,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 3,
      name: 'Cha Ca Truc Bach',
      sale_price: 160000,
      stock_quantity: 90,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 4,
      name: 'Cha Ca Lang',
      sale_price: 140000,
      stock_quantity: 120,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 5,
      name: 'Cha Ca Ha Noi',
      sale_price: 170000,
      stock_quantity: 85,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 6,
      name: 'Cha Ca Pho Co',
      sale_price: 190000,
      stock_quantity: 75,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 7,
      name: 'Cha Ca Ho Tay',
      sale_price: 165000,
      stock_quantity: 95,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 8,
      name: 'Cha Ca Tay Ho',
      sale_price: 175000,
      stock_quantity: 88,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 9,
      name: 'Cha Ca Ba Dinh',
      sale_price: 155000,
      stock_quantity: 110,
      quantity: 0,
      discount: 0,
      total: 0
    },
    {
      id: 10,
      name: 'Cha Ca Dong Da',
      sale_price: 145000,
      stock_quantity: 130,
      quantity: 0,
      discount: 0,
      total: 0
    }
  ]);
  const [totalOrderPrice, setTotalOrderPrice] = useState<number>(0);

  useEffect(() => {
    calculateTotalOrderPrice();
  }, [products]);

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
      alert('Please select an order date');
      return;
    }

    if (!customer) {
      alert('Please select a customer');
      return;
    }

    const orderData = {
      order_date: orderDate,
      customer_id: customer.id,
      products: products
        .filter(product => product.quantity > 0)
        .map(product => ({
          id: product.id,
          quantity: product.quantity,
          discount: product.discount
        }))
    };

    try {
      const response = await fetch('/order/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert('Order submitted successfully!');
        // Reset form
        setOrderDate(new Date().toISOString().split('T')[0]);
        setCustomer(null);
        setProducts(prevProducts => 
          prevProducts.map(product => ({ ...product, quantity: 0, discount: 0, total: 0 }))
        );
      } else {
        const error = await response.json();
        alert(`Order submission failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          mb: { xs: 2, sm: 4 },
          fontSize: { xs: '1.25rem', sm: '2rem' },
          fontWeight: 600,
          color: 'text.primary',
          textAlign: { xs: 'center', sm: 'left' }
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
            getOptionLabel={(option) => option.name}
            value={customer}
            onChange={(_, newValue) => setCustomer(newValue)}
            filterOptions={(options, { inputValue }) => {
              return options.filter(option =>
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                placeholder="Search customer name..."
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                {option.name}
              </li>
            )}
            noOptionsText="No customers found"
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
    </Box>
  );
} 