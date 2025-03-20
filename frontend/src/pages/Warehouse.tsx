import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  image_url: string;
  unit_price: number;
  sale_price: number;
  stock_quantity: number;
}

export default function Warehouse() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [inventory] = useState<InventoryItem[]>([
    {
      id: '1',
      sku: 'SKU001',
      name: 'Cha Ca Thang Long',
      image_url: 'http://learnanything318.ddns.net:10000/chaca2chiem-public/image-prod/chaca_icon.png',
      unit_price: 150000,
      sale_price: 180000,
      stock_quantity: 150,
    },
    // Add more mock data as needed
  ]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Warehouse Inventory</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
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
                    <TableCell sx={{ 
                      width: { xs: '70px', sm: '80px' },
                      minWidth: { xs: '70px', sm: '80px' }
                    }}>SKU</TableCell>
                    <TableCell sx={{ 
                      width: { xs: '28%', sm: '28%' },
                      minWidth: { xs: '180px', sm: '220px' }
                    }}>Name</TableCell>
                    <TableCell sx={{ 
                      width: { xs: '15%', sm: '15%' },
                      minWidth: { xs: '100px', sm: '150px' }
                    }}>Image</TableCell>
                    <TableCell sx={{ 
                      width: { xs: '20%', sm: '20%' },
                      minWidth: { xs: '120px', sm: '150px' }
                    }}>Unit Price</TableCell>
                    <TableCell sx={{ 
                      width: { xs: '20%', sm: '20%' },
                      minWidth: { xs: '120px', sm: '150px' }
                    }}>Sale Price</TableCell>
                    <TableCell sx={{ 
                      width: { xs: '20%', sm: '20%' },
                      minWidth: { xs: '100px', sm: '120px' }
                    }}>Stock Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{item.sku}</TableCell>
                        <TableCell sx={{ 
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{item.name}</TableCell>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          <Box
                            component="img"
                            src={item.image_url}
                            alt={item.name}
                            sx={{
                              width: '35%',
                              height: 'auto',
                              maxWidth: '120px',
                              objectFit: 'contain'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{item.sale_price.toLocaleString()}</TableCell>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{item.stock_quantity}</TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 