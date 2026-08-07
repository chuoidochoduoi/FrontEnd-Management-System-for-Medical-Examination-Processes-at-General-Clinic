import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket(topic, queryKeyToInvalidate, onMessage = null) {
    const queryClient = useQueryClient();
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!topic) return;

        const url = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const client = new Client({
            webSocketFactory: () => new SockJS(`${url}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Connected to WebSocket');
            client.subscribe(topic, (message) => {
                console.log('Received WebSocket message:', message.body);
                if (queryKeyToInvalidate) {
                    queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
                }
                if (onMessageRef.current) {
                    onMessageRef.current(message.body);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [topic, queryClient, queryKeyToInvalidate]);
}
