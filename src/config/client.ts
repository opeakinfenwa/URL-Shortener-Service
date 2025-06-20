import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('shortlink.created', (data) => {
  console.log('Short link created:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});