import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket(topic, queryKeyToInvalidate, onMessage = null, { authenticated = false, onConnect = null } = {}) {
    const queryClient = useQueryClient();
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);

    useEffect(() => {
        onMessageRef.current = onMessage;
        onConnectRef.current = onConnect;
    }, [onMessage, onConnect]);

    useEffect(() => {
        if (!topic) return;

        const url = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const client = new Client({
            webSocketFactory: () => new SockJS(`${url}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.beforeConnect = () => {
            if (authenticated) {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                client.connectHeaders = { Authorization: `Bearer ${token || ''}` };
            }
        };

        client.onConnect = () => {
            client.subscribe(topic, (message) => {
                if (queryKeyToInvalidate) {
                    queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
                }
                if (onMessageRef.current) {
                    onMessageRef.current(message.body);
                }
            });
            // Also refresh after reconnect: changes may have happened while offline.
            onConnectRef.current?.();
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            if (clientRef.current === client) clientRef.current = null;
        };
    }, [topic, queryClient, queryKeyToInvalidate, authenticated]);
}
