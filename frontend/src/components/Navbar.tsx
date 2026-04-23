import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Operations', path: '/operations' },
    { label: 'Analyze Claim', path: '/upload' },
  ];

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar sx={{ justifyContent: 'flex-start', gap: 1, minHeight: { xs: 56, md: 64 }, px: { xs: 1, md: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 0.5, md: 1 },
            alignItems: 'center',
            width: '100%',
            overflowX: { xs: 'auto', md: 'visible' },
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              variant="text"
              size="small"
              sx={{ px: { xs: 1, md: 1.5 }, minWidth: 'fit-content' }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
