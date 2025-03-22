import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  TextField,
  Button,
  IconButton,
  useMediaQuery,
  Modal,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format, subDays } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`warehouse-tabpanel-${index}`}
      aria-labelledby={`warehouse-tab-${index}`}
      style={{
        display: value === index ? 'block' : 'none',
      }}
      {...other}
    >
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3 },
          opacity: value === index ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {children}
      </Box>
    </div>
  );
}

// Products Tab Content
const ProductsTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
  const [products, setProducts] = useState<Array<{
    sku: string;
    name: string;
    sale_price: number;
    unit_price: number;
    stock_quantity: number;
  }>>([]);

  React.useEffect(() => {
    // Fetch products data
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/v1/products');
        const data = await response.json();
        
        // Sort products by stock quantity in descending order
        const sortedProducts = data.sort((a: any, b: any) => b.stock_quantity - a.stock_quantity);
        
        setProducts(sortedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <TableContainer 
      sx={{ 
        mb: 3,
        overflowX: isMobile ? 'auto' : 'visible',
        '& .MuiTable-root': {
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: isMobile ? 'max-content' : '100%',
          '& th, & td': {
            border: `1px solid ${theme.palette.grey[300]}`,
          },
        }
      }}
    >
      <Table 
        sx={{
          width: '100%',
          tableLayout: isMobile ? 'auto' : 'fixed',
          '& .MuiTableCell-root': {
            px: { xs: 1, sm: 2 },
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            textAlign: 'center',
            verticalAlign: 'middle',
            whiteSpace: isMobile ? 'nowrap' : 'normal',
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
          '& .MuiTableRow-root': {
            backgroundColor: 'white',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              minWidth: isMobile ? '120px' : 'auto',
            }}>SKU</TableCell>
            <TableCell sx={{ 
              minWidth: isMobile ? '150px' : 'auto',
            }}>Name</TableCell>
            <TableCell sx={{ 
              minWidth: isMobile ? '120px' : 'auto',
            }}>Unit Price</TableCell>
            <TableCell sx={{ 
              minWidth: isMobile ? '120px' : 'auto',
            }}>Sale Price</TableCell>
            <TableCell sx={{ 
              minWidth: isMobile ? '100px' : 'auto',
            }}>Stock Quantity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.sku}>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.unit_price.toLocaleString()}</TableCell>
              <TableCell>{product.sale_price.toLocaleString()}</TableCell>
              <TableCell>{product.stock_quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Product Import History Tab Content
const ProductImportHistoryTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
  const [importHistory, setImportHistory] = useState<Array<{
    id: number;
    imported_at: string;
    total_lines: number;
    other_expenses: number;
  }>>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Add new states for modal
  const [openModal, setOpenModal] = useState(false);
  const [importLines, setImportLines] = useState<Array<{
    id: number;
    product_id: number;
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>>([]);
  const [selectedImporter, setSelectedImporter] = useState<{
    id: number;
    imported_at: string;
    total_lines: number;
    other_expenses: number;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    const lastWeek = subDays(today, 7);
    setStartDate(format(lastWeek, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    // Initial fetch on component mount
    fetchImportHistory(format(lastWeek, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
  }, []);

  const fetchImportHistory = async (start: string, end: string) => {
    try {
      const response = await fetch(`/api/v1/importers?start_date=${start}&end_date=${end}`);
      const data = await response.json();
      if (data.success) {
        setImportHistory(data.importers);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const handleDateRangeSelect = (days: number) => {
    const today = new Date();
    const selectedStartDate = subDays(today, days);
    setStartDate(format(selectedStartDate, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    // Removed API call here - will only fetch when fetch button is clicked
  };

  const handleFetchClick = () => {
    fetchImportHistory(startDate, endDate);
  };

  const handleViewImportLines = async (importerId: number) => {
    try {
      const response = await fetch(`/api/v1/importers/${importerId}/lines`);
      const data = await response.json();
      if (data.success) {
        setImportLines(data.import_lines);
        setSelectedImporter(importHistory.find(imp => imp.id === importerId) || null);
        setOpenModal(true);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch import lines:', error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setImportLines([]);
    setSelectedImporter(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mb: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mr: isMobile ? 0 : 2, mb: isMobile ? 1 : 0, backgroundColor: 'white' }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mr: isMobile ? 0 : 2, mb: isMobile ? 1 : 0, backgroundColor: 'white' }}
        />
        <Button variant="contained" onClick={handleFetchClick}>
          Fetch Import History
        </Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => handleDateRangeSelect(7)}>Last 7 Days</Button>
        <Button variant="outlined" onClick={() => handleDateRangeSelect(30)} sx={{ ml: 1 }}>Last 30 Days</Button>
      </Box>
      <TableContainer 
        sx={{ 
          mb: 3,
          overflowX: isMobile ? 'auto' : 'visible',
          '& .MuiTable-root': {
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: isMobile ? 'max-content' : '100%',
            '& th, & td': {
              border: `1px solid ${theme.palette.grey[300]}`,
            },
          }
        }}
      >
        <Table 
          sx={{
            width: '100%',
            tableLayout: isMobile ? 'auto' : 'fixed',
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textAlign: 'center',
              verticalAlign: 'middle',
              whiteSpace: isMobile ? 'nowrap' : 'normal',
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
            '& .MuiTableRow-root': {
              backgroundColor: 'white',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                minWidth: isMobile ? '120px' : 'auto',
              }}>Import Date</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '100px' : 'auto',
              }}>Total Lines</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '120px' : 'auto',
              }}>Other Expenses</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '80px' : 'auto',
              }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {importHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.imported_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</TableCell>
                <TableCell>{record.total_lines}</TableCell>
                <TableCell>{record.other_expenses.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    onClick={() => handleViewImportLines(record.id)}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <VisibilityIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Modal for Import Lines */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="import-lines-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '80%', md: '70%' },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflow: 'auto',
        }}>
          {selectedImporter && (
            <>
              <Typography variant="h6" component="h2" gutterBottom>
                Import Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Date: {new Date(selectedImporter.imported_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Typography variant="body1">
                  Total Lines: {selectedImporter.total_lines}
                </Typography>
                <Typography variant="body1">
                  Other Expenses: {selectedImporter.other_expenses.toLocaleString()}
                </Typography>
              </Box>
            </>
          )}
          
          <TableContainer 
            sx={{ 
              maxHeight: '60vh',
              overflowX: isMobile ? 'auto' : 'visible',
              '& .MuiTable-root': {
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: isMobile ? 'max-content' : '100%',
                '& th, & td': {
                  border: `1px solid ${theme.palette.grey[300]}`,
                },
              }
            }}
          >
            <Table 
              stickyHeader
              sx={{
                width: '100%',
                tableLayout: isMobile ? 'auto' : 'fixed',
                '& .MuiTableCell-root': {
                  px: { xs: 1, sm: 2 },
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
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
                '& .MuiTableRow-root': {
                  backgroundColor: 'white',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '150px' : 'auto',
                  }}>Product Name</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '100px' : 'auto',
                  }}>Quantity</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '120px' : 'auto',
                  }}>Unit Price</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '120px' : 'auto',
                  }}>Total Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importLines.map((line) => (
                  <TableRow key={line.id} sx={{ backgroundColor: 'white' }}>
                    <TableCell>{line.product_name}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{line.unit_price.toLocaleString()}</TableCell>
                    <TableCell>{line.total_price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseModal} variant="contained">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

// Sales Tracking History Tab Content
const SalesTrackingHistoryTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
  const [salesHistory, setSalesHistory] = useState<Array<{
    id: number;
    order_date: string;
    customer_name: string;
    total_amount: number;
    total_lines: number;
    status: string;
  }>>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Add states for modal
  const [openModal, setOpenModal] = useState(false);
  const [orderLines, setOrderLines] = useState<Array<{
    id: number;
    product_id: number;
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    gross_total_price: number;
    net_total_price: number;
  }>>([]);
  const [selectedOrder, setSelectedOrder] = useState<{
    id: number;
    order_date: string;
    customer_name: string;
    total_amount: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    const lastWeek = subDays(today, 7);
    setStartDate(format(lastWeek, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    // Initial fetch on component mount
    fetchSalesHistory(format(lastWeek, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
  }, []);

  const fetchSalesHistory = async (start: string, end: string) => {
    try {
      const response = await fetch(`/api/v1/orders?start_date=${start}&end_date=${end}`);
      const data = await response.json();
      if (data.success) {
        setSalesHistory(data.orders);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch sales history:', error);
    }
  };

  const handleDateRangeSelect = (days: number) => {
    const today = new Date();
    const selectedStartDate = subDays(today, days);
    setStartDate(format(selectedStartDate, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    // We don't call API here - only when fetch button is clicked
  };

  const handleFetchClick = () => {
    fetchSalesHistory(startDate, endDate);
  };

  const handleViewOrderLines = async (orderId: number) => {
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/lines`);
      const data = await response.json();
      if (data.success) {
        setOrderLines(data.order_lines);
        setSelectedOrder(salesHistory.find(order => order.id === orderId) || null);
        setOpenModal(true);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch order lines:', error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setOrderLines([]);
    setSelectedOrder(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mb: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mr: isMobile ? 0 : 2, mb: isMobile ? 1 : 0, backgroundColor: 'white' }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mr: isMobile ? 0 : 2, mb: isMobile ? 1 : 0, backgroundColor: 'white' }}
        />
        <Button variant="contained" onClick={handleFetchClick}>
          Fetch Sales History
        </Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => handleDateRangeSelect(7)}>Last 7 Days</Button>
        <Button variant="outlined" onClick={() => handleDateRangeSelect(30)} sx={{ ml: 1 }}>Last 30 Days</Button>
      </Box>
      <TableContainer 
        sx={{ 
          mb: 3,
          overflowX: isMobile ? 'auto' : 'visible',
          '& .MuiTable-root': {
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: isMobile ? 'max-content' : '100%',
            '& th, & td': {
              border: `1px solid ${theme.palette.grey[300]}`,
            },
          }
        }}
      >
        <Table 
          sx={{
            width: '100%',
            tableLayout: isMobile ? 'auto' : 'fixed',
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textAlign: 'center',
              verticalAlign: 'middle',
              whiteSpace: isMobile ? 'nowrap' : 'normal',
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
            '& .MuiTableRow-root': {
              backgroundColor: 'white',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                minWidth: isMobile ? '120px' : 'auto',
              }}>Order Date</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '150px' : 'auto',
              }}>Customer</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '100px' : 'auto',
              }}>Total Lines</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '120px' : 'auto',
              }}>Revenue</TableCell>
              <TableCell sx={{ 
                minWidth: isMobile ? '80px' : 'auto',
              }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesHistory.map((sale) => (
              <TableRow key={sale.id} sx={{ backgroundColor: 'white' }}>
                <TableCell>{new Date(sale.order_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</TableCell>
                <TableCell>{sale.customer_name}</TableCell>
                <TableCell>{sale.total_lines}</TableCell>
                <TableCell>{sale.total_amount.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    onClick={() => handleViewOrderLines(sale.id)}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <VisibilityIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Order Lines */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="order-lines-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '80%', md: '70%' },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflow: 'auto',
        }}>
          {selectedOrder && (
            <>
              <Typography variant="h6" component="h2" gutterBottom>
                Order Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Date: {new Date(selectedOrder.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Typography variant="body1">
                  Customer: {selectedOrder.customer_name}
                </Typography>
                <Typography variant="body1">
                  Total Amount: {selectedOrder.total_amount.toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  Status: {selectedOrder.status}
                </Typography>
              </Box>
            </>
          )}
          
          <TableContainer 
            sx={{ 
              maxHeight: '60vh',
              overflowX: isMobile ? 'auto' : 'visible',
              '& .MuiTable-root': {
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: isMobile ? 'max-content' : '100%',
                '& th, & td': {
                  border: `1px solid ${theme.palette.grey[300]}`,
                },
              }
            }}
          >
            <Table 
              stickyHeader
              sx={{
                width: '100%',
                tableLayout: isMobile ? 'auto' : 'fixed',
                '& .MuiTableCell-root': {
                  px: { xs: 1, sm: 2 },
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
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
                '& .MuiTableRow-root': {
                  backgroundColor: 'white',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '150px' : 'auto',
                  }}>Product</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '100px' : 'auto',
                  }}>Quantity</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '120px' : 'auto',
                  }}>Discount</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '120px' : 'auto',
                  }}>Gross Revenue</TableCell>
                  <TableCell sx={{ 
                    minWidth: isMobile ? '120px' : 'auto',
                  }}>Net Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderLines.map((line) => (
                  <TableRow key={line.id} sx={{ backgroundColor: 'white' }}>
                    <TableCell>{line.product_name}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{line.discount.toLocaleString()}</TableCell>
                    <TableCell>{line.gross_total_price.toLocaleString()}</TableCell>
                    <TableCell>{line.net_total_price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseModal} variant="contained">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default function Warehouse() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          display: 'inline-block',
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
        Warehouse Management
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="warehouse tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 56,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab label="Products" />
          <Tab label="Import History" />
          <Tab label="Sales History" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <ProductsTab />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ProductImportHistoryTab />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <SalesTrackingHistoryTab />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
} 