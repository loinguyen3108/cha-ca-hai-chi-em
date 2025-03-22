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
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { authAPI } from '../services/api';

interface Product {
  id: number;
  name: string;
  unit_price: number;
  stock_quantity: number;
}


export default function ProductImport() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [importLines, setImportLines] = useState<{ productId: number; quantity: number }[]>([]);
  const [totalImportPrice, setTotalImportPrice] = useState<number>(0);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authAPI.getProducts();
        setProducts(response.data);
        setImportLines(response.data.map(product => ({ productId: product.id, quantity: 0 })));
      } catch (err) {
        setError('Failed to load products');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotalImportPrice();
  }, [importLines, otherExpenses]);

  const calculateTotalImportPrice = () => {
    const total = importLines.reduce((sum, line) => {
      const product = products.find(p => p.id === line.productId);
      return sum + (product ? line.quantity * product.unit_price : 0);
    }, 0);
    setTotalImportPrice(total + otherExpenses);
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setImportLines(prev => 
      prev.map(line => 
        line.productId === productId 
          ? { ...line, quantity } 
          : line
      )
    );
  };

  const getLineTotal = (productId: number): number => {
    const line = importLines.find(l => l.productId === productId);
    const product = products.find(p => p.id === productId);
    return (line?.quantity || 0) * (product?.unit_price || 0);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Validate other expenses
    if (otherExpenses < 0) {
        setSnackbarMessage('Other Expenses cannot be negative');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return; // Exit the function if validation fails
    }

    try {
        const importLinesWithDetails = importLines
            .filter(line => line.quantity > 0)
            .map(line => {
                const product = products.find(p => p.id === line.productId);
                return {
                    productId: line.productId,
                    quantity: line.quantity,
                    unit_price: product?.unit_price || 0,
                    total_line_price: line.quantity * (product?.unit_price || 0),
                };
            });

        const response = await authAPI.importProducts({
            import_lines: importLinesWithDetails,
            import_date: importDate,
            other_expenses: otherExpenses,
        });

        // Show success message
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Reset form
        setImportLines(importLines.map(line => ({ ...line, quantity: 0 })));
        setOtherExpenses(0);
        
    } catch (err: any) {
        setSnackbarMessage(err.response?.data?.message || 'Failed to import products');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
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
        Import Products
      </Typography>

      {error && <Typography color="error">{error}</Typography>}

      <Paper 
        component="form" 
        onSubmit={handleImport}
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
            onChange={(e) => {
                const value = Number(e.target.value);
                setOtherExpenses(value < 0 ? 0 : value); // Prevent negative values
            }}
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
                <TableCell sx={{ width: { xs: '40px', sm: '50px' } }}>ID</TableCell>
                <TableCell sx={{ 
                  width: { xs: '30%', sm: '30%' },
                  textAlign: 'left',
                  minWidth: { xs: '120px', sm: '200px' }
                }}>Name</TableCell>
                <TableCell align="center" sx={{ 
                  width: { xs: '20%', sm: '20%' },
                  minWidth: { xs: '80px', sm: '100px' }
                }}>Price</TableCell>
                <TableCell align="center" sx={{ 
                  width: { xs: '20%', sm: '15%' },
                  minWidth: { xs: '60px', sm: '80px' }
                }}>Quantity</TableCell>
                <TableCell align="center" sx={{ 
                  width: { xs: '20%', sm: '15%' },
                  minWidth: { xs: '80px', sm: '100px' }
                }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell align="center">{product.id}</TableCell>
                  <TableCell sx={{ textAlign: 'left' }}>{product.name}</TableCell>
                  <TableCell align="center">
                    {product.unit_price.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={importLines.find(line => line.productId === product.id)?.quantity || 0}
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
                      sx={{ width: '100%' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {getLineTotal(product.id).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell 
                  colSpan={4} 
                  align="right"
                  sx={{ fontWeight: 'bold' }}
                >
                  Total Import Price:
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{ fontWeight: 'bold' }}
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
            Import Products
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