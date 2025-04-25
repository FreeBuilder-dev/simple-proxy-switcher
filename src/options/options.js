import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import browser from 'webextension-polyfill';
import { init, setLocale, getLocale, t } from '../i18n';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#2e7d32',
    },
  },
});

function Options() {
  const [proxyList, setProxyList] = useState([]);
  const [editingProxy, setEditingProxy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('zh-CN');
  const [formData, setFormData] = useState({
    name: '',
    type: 'socks5',
    host: '',
    port: '',
    username: '',
    password: '',
    pacScript: '',
    bypassList: '127.0.0.1\n::1\nlocalhost'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    await init();
    setCurrentLocale(getLocale());
    loadProxyList();
  };

  const handleLocaleChange = async (event) => {
    const newLocale = event.target.value;
    if (await setLocale(newLocale)) {
      setCurrentLocale(newLocale);
      showSnackbar(t('common.success'), 'success');
    }
  };

  const loadProxyList = async () => {
    try {
      const configs = await browser.runtime.sendMessage({ type: 'GET_PROXY_CONFIGS' });
      setProxyList(configs || []);
    } catch (error) {
      console.error('Failed to load proxy list:', error);
      showSnackbar('加载代理列表失败', 'error');
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const config = {
        ...formData,
        id: editingProxy?.id || Date.now().toString(),
        bypassList: formData.bypassList.split('\n').filter(line => line.trim())
      };

      const response = await browser.runtime.sendMessage({
        type: editingProxy ? 'UPDATE_PROXY_CONFIG' : 'ADD_PROXY_CONFIG',
        id: editingProxy?.id,
        config
      });

      if (response.success) {
        showSnackbar(`${editingProxy ? '更新' : '添加'}代理成功`, 'success');
        if (editingProxy) {
          setProxyList(prevList => 
            prevList.map(item => item.id === editingProxy.id ? config : item)
          );
        } else {
          setProxyList(prevList => [...prevList, config]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save proxy config:', error);
      showSnackbar(`${editingProxy ? '更新' : '添加'}代理失败`, 'error');
    }
  };

  const handleEdit = (proxy) => {
    setEditingProxy(proxy);
    setFormData({
      ...proxy,
      bypassList: (proxy.bypassList || []).join('\n')
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个代理配置吗？')) {
      return;
    }

    try {
      const response = await browser.runtime.sendMessage({
        type: 'DELETE_PROXY_CONFIG',
        id
      });

      if (response.success) {
        showSnackbar('删除代理成功', 'success');
        setProxyList(prevList => prevList.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete proxy config:', error);
      showSnackbar('删除代理失败', 'error');
    }
  };

  const resetForm = () => {
    setEditingProxy(null);
    setFormData({
      name: '',
      type: 'socks5',
      host: '',
      port: '',
      username: '',
      password: '',
      pacScript: '',
      bypassList: '127.0.0.1\n::1\nlocalhost'
    });
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const configs = JSON.parse(event.target.result);
          const response = await browser.runtime.sendMessage({
            type: 'IMPORT_PROXY_CONFIGS',
            configs
          });
          if (response.success) {
            showSnackbar('导入代理配置成功', 'success');
            setProxyList(configs);
          }
        } catch (error) {
          console.error('Failed to import proxy configs:', error);
          showSnackbar('导入代理配置失败', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      const configs = await browser.runtime.sendMessage({ type: 'GET_PROXY_CONFIGS' });
      const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'proxy-configs.json';
      a.click();
      URL.revokeObjectURL(url);
      showSnackbar('导出代理配置成功', 'success');
    } catch (error) {
      console.error('Failed to export proxy configs:', error);
      showSnackbar('导出代理配置失败', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('popup.title')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={currentLocale}
              onChange={handleLocaleChange}
              startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="zh-CN">中文</MenuItem>
              <MenuItem value="en-US">English</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* 左侧代理列表 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{t('proxy.proxyList')}</Typography>
                <Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={resetForm}
                    sx={{ mr: 1 }}
                  >
                    {t('common.add')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleImport}
                    sx={{ mr: 1 }}
                  >
                    {t('common.import')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleExport}
                  >
                    {t('common.export')}
                  </Button>
                </Box>
              </Box>
              <List>
                {proxyList.map((proxy) => (
                  <React.Fragment key={proxy.id}>
                    <ListItem
                      button
                      selected={editingProxy?.id === proxy.id}
                      onClick={() => handleEdit(proxy)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                          '& .MuiListItemText-primary': {
                            color: 'primary.main',
                            fontWeight: 'bold',
                          },
                          '& .MuiListItemText-secondary': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={proxy.name}
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
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDelete(proxy.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
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
          </Grid>

          {/* 右侧代理配置表单 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {editingProxy ? t('proxy.editProxy') : t('proxy.addProxy')}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('proxy.name')}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('proxy.type')}</InputLabel>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        label={t('proxy.type')}
                      >
                        <MenuItem value="socks4">{t('proxy.proxyTypes.socks4')}</MenuItem>
                        <MenuItem value="socks5">{t('proxy.proxyTypes.socks5')}</MenuItem>
                        <MenuItem value="http">{t('proxy.proxyTypes.http')}</MenuItem>
                        <MenuItem value="pac_script">{t('proxy.proxyTypes.pac_script')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {formData.type !== 'pac_script' && (
                    <>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label={t('proxy.host')}
                          name="host"
                          value={formData.host}
                          onChange={handleInputChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={t('proxy.port')}
                          name="port"
                          type="number"
                          value={formData.port}
                          onChange={handleInputChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('proxy.username')}
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('proxy.password')}
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                      </Grid>
                    </>
                  )}
                  {formData.type === 'pac_script' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('proxy.pacScript')}
                        name="pacScript"
                        multiline
                        rows={4}
                        value={formData.pacScript}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('proxy.bypassList')}
                      name="bypassList"
                      multiline
                      rows={10}
                      value={formData.bypassList}
                      onChange={handleInputChange}
                      helperText={t('proxy.bypassList')}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          lineHeight: '1.5',
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {editingProxy && (
                        <Button
                          variant="outlined"
                          onClick={resetForm}
                        >
                          {t('common.cancel')}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                      >
                        {editingProxy ? t('common.save') : t('common.add')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>
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

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<Options />); 