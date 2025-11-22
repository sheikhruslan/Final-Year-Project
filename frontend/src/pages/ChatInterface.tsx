import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, SmartToy as BotIcon, Person as PersonIcon } from '@mui/icons-material';
import { api } from '../services/api';

export default function ChatInterface() {
  const [conversationId] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant for insurance fraud detection. I can help you analyze claims, generate visualizations, and answer questions about fraud patterns. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');

  const sendMutation = useMutation({
    mutationFn: (message: string) => api.sendMessage(message, conversationId),
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    sendMutation.mutate(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        AI Assistant
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Ask questions, generate visualizations, or get insights about fraud patterns
      </Typography>

      <Paper elevation={3} sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1}>
                  {msg.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BotIcon />
                    </Avatar>
                  )}
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                      color: msg.role === 'user' ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body1">{msg.content}</Typography>
                  </Paper>
                  {msg.role === 'user' && (
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </ListItem>
            ))}
            {sendMutation.isPending && (
              <ListItem>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Thinking...
                </Typography>
              </ListItem>
            )}
          </List>
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask a question or request an analysis..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMutation.isPending}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip
              label="Analyze claim CLM12345678"
              size="small"
              onClick={() => setInput('Analyze claim CLM12345678')}
            />
            <Chip
              label="Show fraud trends"
              size="small"
              onClick={() => setInput('Show fraud trends for the last 30 days')}
            />
            <Chip
              label="Top risk factors"
              size="small"
              onClick={() => setInput('What are the top risk factors?')}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
