import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  Tooltip,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import browser from 'webextension-polyfill';
import { init, t } from '../i18n';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
  },
});

function Popup() {
  const [proxyList, setProxyList] = useState([]);
  const [currentProxy, setCurrentProxy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    await init();
    try {
      // 加载代理列表
      const configs = await browser.runtime.sendMessage({ type: 'GET_PROXY_CONFIGS' });
      setProxyList(configs || []);

      // 加载当前代理状态
      const current = await browser.runtime.sendMessage({ type: 'GET_CURRENT_PROXY' });
      setCurrentProxy(current);
    } catch (error) {
      console.error('加载初始状态失败:', error);
      showSnackbar(t('popup.applyError'), 'error');
    }
  };

  const updateIcon = (isActive) => {
    browser.runtime.sendMessage({ type: 'UPDATE_ICON', isActive });
  };

  const handleApplyProxy = async (config) => {
    setIsLoading(true);
    try {
      const response = await browser.runtime.sendMessage({
        type: 'APPLY_PROXY',
        config
      });

      if (response.success) {
        setCurrentProxy(config);
        showSnackbar(t('popup.proxyApplied'), 'success');
      } else {
        throw new Error(response.error || t('popup.applyError'));
      }
    } catch (error) {
      console.error('应用代理失败:', error);
      showSnackbar(error.message || t('popup.applyError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProxy = async () => {
    setIsLoading(true);
    try {
      const response = await browser.runtime.sendMessage({ type: 'CLEAR_PROXY' });
      if (response.success) {
        setCurrentProxy(null);
        showSnackbar(t('popup.proxyCleared'), 'success');
      } else {
        throw new Error(response.error || t('popup.clearError'));
      }
    } catch (error) {
      console.error('清除代理失败:', error);
      showSnackbar(error.message || t('popup.clearError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const getProxyTypeColor = (type) => {
    switch (type) {
      case 'socks4':
        return 'success';
      case 'socks5':
        return 'primary';
      case 'pac_script':
        return 'error';
      case 'http':
        return 'warning';
      default:
        return 'default';
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2, width: 320 }}>
        {/* 代理列表 */}
        <Paper sx={{ mb: 1 }}>
          <List sx={{ p: 0 }}>
            {proxyList.map((proxy, index) => (
              <React.Fragment key={proxy.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => handleApplyProxy(proxy)}
                  selected={currentProxy?.id === proxy.id}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: `${getProxyTypeColor(proxy.type)}.light`,
                      '&:hover': {
                        bgcolor: `${getProxyTypeColor(proxy.type)}.light`,
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {proxy.name}
                        {currentProxy?.id === proxy.id && (
                          <CheckCircleIcon 
                            sx={{ 
                              color: `${getProxyTypeColor(proxy.type)}.main`,
                              fontSize: '16px'
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={t(`proxy.proxyTypes.${proxy.type}`)}
                          size="small"
                          color={getProxyTypeColor(proxy.type)}
                        />
                        {proxy.type !== 'pac_script' && (
                          <Typography variant="body2" color="text.secondary">
                            {proxy.host}:{proxy.port}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
            {proxyList.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={t('proxy.noProxy')}
                  secondary={t('proxy.addProxyHint')}
                />
              </ListItem>
            )}
          </List>
        </Paper>

        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openOptions}
            fullWidth
          >
            {t('common.add')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearProxy}
            disabled={!currentProxy || isLoading}
            startIcon={<RefreshIcon />}
            sx={{ 
              minWidth: 'auto', 
              px: 1,
              '& .MuiButton-startIcon': {
                margin: 0,
                '& > *:first-of-type': {
                  fontSize: '20px'
                }
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={openOptions}
            startIcon={<SettingsIcon />}
            sx={{ 
              minWidth: 'auto', 
              px: 1,
              '& .MuiButton-startIcon': {
                margin: 0,
                '& > *:first-of-type': {
                  fontSize: '20px'
                }
              }
            }}
          />
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Popup />); 