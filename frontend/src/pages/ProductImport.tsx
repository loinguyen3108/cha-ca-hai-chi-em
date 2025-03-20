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
} from '@mui/material';

interface Product {
  id: number;
  name: string;
  unit_price: number;
  stock_quantity: number;
}

// Mock data for testing
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Cá Chép",
    unit_price: 120000,
    stock_quantity: 50
  },
  {
    id: 2,
    name: "Cá Trắm",
    unit_price: 150000,
    stock_quantity: 30
  },
  {
    id: 3,
    name: "Cá Rô Phi",
    unit_price: 80000,
    stock_quantity: 100
  },
  {
    id: 4,
    name: "Cá Diêu Hồng",
    unit_price: 95000,
    stock_quantity: 45
  },
  {
    id: 5,
    name: "Cá Lóc",
    unit_price: 180000,
    stock_quantity: 25
  }
];

interface ImportProduct extends Product {
  quantity: number;
  total: number;
}

export default function ProductImport() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [products, setProducts] = useState<ImportProduct[]>([]);
  const [totalImportPrice, setTotalImportPrice] = useState<number>(0);

  useEffect(() => {
    // Fetch products when component mounts
    fetchProducts();
  }, []);

  useEffect(() => {
    // Calculate total import price whenever products or other expenses change
    calculateTotalImportPrice();
  }, [products, otherExpenses]);

  const fetchProducts = async () => {
    try {
      // Using mock data instead of API call
      const importProducts: ImportProduct[] = MOCK_PRODUCTS.map(product => ({
        ...product,
        quantity: 0,
        total: 0
      }));
      setProducts(importProducts);
    } catch (error) {
      console.error('Error setting up mock products:', error);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setProducts(prevProducts => prevProducts.map(product => {
      if (product.id === productId) {
        const total = quantity * product.unit_price;
        return { ...product, quantity, total };
      }
      return product;
    }));
  };

  const calculateTotalImportPrice = () => {
    const productsTotal = products.reduce((sum, product) => sum + product.total, 0);
    setTotalImportPrice(productsTotal + otherExpenses);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!importDate) {
      alert('Please select an import date');
      return;
    }

    const importData = {
      import_date: importDate,
      other_expenses: otherExpenses,
      products: products
        .filter(product => product.quantity > 0)
        .map(product => ({
          id: product.id,
          quantity: product.quantity,
          unit_price: product.unit_price
        }))
    };

    try {
      const response = await fetch('/api/product/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      if (response.ok) {
        alert('Import successful!');
        // Reset form
        setImportDate(new Date().toISOString().split('T')[0]);
        setOtherExpenses(0);
        setProducts(prevProducts => 
          prevProducts.map(product => ({ ...product, quantity: 0, total: 0 }))
        );
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting import:', error);
      alert('Failed to submit import. Please try again.');
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
        Import Products
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
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 }
        }}>
          <TextField
            label="Import Date"
            type="date"
            value={importDate}
            onChange={(e) => setImportDate(e.target.value)}
            fullWidth={isMobile}
            sx={{ 
              width: { xs: '100%', sm: '30%' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Other Expenses"
            type="number"
            value={otherExpenses}
            onChange={(e) => setOtherExpenses(Number(e.target.value))}
            fullWidth={isMobile}
            sx={{ 
              width: { xs: '100%', sm: '30%' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />
        </Box>

        <TableContainer 
          sx={{ 
            mb: 3,
            overflowX: 'auto',
            '& .MuiTable-root': {
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: { xs: '600px', sm: '800px' },
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
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              },
              '& .MuiTableCell-head': {
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: theme.palette.grey[50],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
                }}>Name</TableCell>
                <TableCell align="center" sx={{ 
                  width: { xs: '25%', sm: '20%' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: { xs: '80px', sm: '100px' }
                }}>
                  Price
                </TableCell>
                <TableCell align="center" sx={{ 
                  width: { xs: '20%', sm: '15%' },
                  minWidth: { xs: '60px', sm: '80px' }
                }}>Qty</TableCell>
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
                      {product.unit_price.toLocaleString()}
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
                    <TableCell colSpan={4}>
                      Total: {product.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell 
                  colSpan={isMobile ? 3 : 4} 
                  align="right"
                  sx={{
                    border: 'none',
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                    pt: 2,
                    pr: 2,
                    fontWeight: 'bold',
                  }}
                >
                  Total Import Price:
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{
                    border: 'none',
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                    pt: 2,
                    width: { xs: '20%', sm: '15%' },
                    fontWeight: 'bold',
                  }}
                >
                  {totalImportPrice.toLocaleString()}
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
            Submit Import
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 