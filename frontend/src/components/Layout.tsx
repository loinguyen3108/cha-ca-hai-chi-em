import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  Warehouse as WarehouseIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AnimatedFish from './AnimatedFish';

// Responsive breakpoints
const DRAWER_WIDTH = {
  xs: '100%',    // Full width on extra small devices
  sm: '240px',   // Standard width on small devices and up
  lg: '280px',   // Slightly wider on large devices
};

const COLLAPSED_WIDTH = {
  xs: '0px',     // Hidden on extra small devices
  sm: '64px',    // Icon-only width on small devices and up
};

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Product Import', icon: <InventoryIcon />, path: '/product-import' },
  { text: 'Tracking', icon: <LocalShippingIcon />, path: '/tracking' },
  { text: 'Warehouse', icon: <WarehouseIcon />, path: '/warehouse' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const isDrawerOpen = isMobile ? mobileOpen : open;

  const drawer = (
    <Box sx={{ 
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {!isMobile && (
        <Toolbar 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            px: 1,
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      )}
      <List sx={{ 
        flexGrow: 1,
        pt: isMobile ? 8 : 0,  // Increased top padding in mobile mode to account for AppBar
        mt: isMobile ? 0 : 0,
      }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            sx={{ 
              mb: 0.5,
              px: { xs: 1, sm: 1.5 },
              display: 'block',  // Ensure item is always displayed
            }}
          >
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                minHeight: { xs: 48, sm: 48, md: 56 },
                justifyContent: (!isMobile && open) || isMobile ? 'initial' : 'center',
                px: 2.5,
                borderRadius: '8px',
                display: 'flex',  // Ensure button content is properly displayed
                alignItems: 'center',
                '&.Mui-selected': {
                  backgroundColor: '#fce4ec',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: '#f8bbd0',
                  }
                },
                '&:hover': {
                  backgroundColor: '#fff1f4',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: (!isMobile && open) || isMobile ? 3 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: (!isMobile && open) || isMobile ? 1 : 0,
                  display: (!isMobile && open) || isMobile ? 'block' : 'none',
                  '& .MuiTypography-root': {
                    fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItem 
          disablePadding 
          sx={{ 
            px: { xs: 1, sm: 1.5 } 
          }}
        >
          <ListItemButton
            onClick={() => {
              logout();
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              minHeight: { xs: 48, sm: 48, md: 56 },
              justifyContent: (!isMobile && open) || isMobile ? 'initial' : 'center',
              px: 2.5,
              borderRadius: '8px',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: (!isMobile && open) || isMobile ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              sx={{ 
                opacity: (!isMobile && open) || isMobile ? 1 : 0,
                '& .MuiTypography-root': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                }
              }} 
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      position: 'relative',
      width: '100%',
      overflow: 'auto'
    }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${isDrawerOpen ? DRAWER_WIDTH.sm : 0}px)` },
          ml: { sm: isDrawerOpen ? DRAWER_WIDTH.sm : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Cha Ca Hai Chi Em
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
            <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>
              {user?.username}
            </Typography>
          </Box>
          <AnimatedFish />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: isDrawerOpen ? DRAWER_WIDTH.sm : 0 },
          flexShrink: { sm: 0 },
          display: { xs: isDrawerOpen ? 'block' : 'none', sm: 'block' },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={isDrawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH.sm,
              backgroundColor: theme.palette.background.default,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            sm: `calc(100% - ${isDrawerOpen ? DRAWER_WIDTH.sm : 0}px)`
          },
          marginLeft: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 