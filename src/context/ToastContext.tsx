import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.85,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setToast(null);
        });
    }, [opacity, scale]);

    const showToast = useCallback(({ message, type = 'success', duration = 2600 }: ToastOptions) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setToast({ message, type });

        // Reset des valeurs d'animation
        scale.setValue(0.7);
        opacity.setValue(0);
        iconScale.setValue(0);

        // Entrée : fondu + zoom du fond, puis rebond de l'icône
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 7,
                tension: 90,
            }),
        ]).start();

        Animated.sequence([
            Animated.delay(80),
            Animated.spring(iconScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
                tension: 140,
            }),
        ]).start();

        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [scale, opacity, iconScale, hideToast]);

    const getToastStyle = () => {
        switch (toast?.type) {
            case 'error':
                return {
                    accent: '#EF4444',
                    accentSoft: '#FEE2E2',
                    icon: 'close-circle' as const,
                };
            case 'info':
                return {
                    accent: '#3B82F6',
                    accentSoft: '#DBEAFE',
                    icon: 'information-circle' as const,
                };
            case 'success':
            default:
                return {
                    accent: '#10B981',
                    accentSoft: '#D1FAE5',
                    icon: 'checkmark-circle' as const,
                };
        }
    };

    const config = getToastStyle();

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && (
                <View style={styles.overlayWrap} pointerEvents="box-none">
                    <TouchableWithoutFeedback onPress={hideToast}>
                        <Animated.View style={[styles.backdrop, { opacity }]} />
                    </TouchableWithoutFeedback>

                    <Animated.View
                        style={[
                            styles.card,
                            {
                                opacity,
                                transform: [{ scale }],
                            },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor: config.accentSoft,
                                    transform: [{ scale: iconScale }],
                                },
                            ]}
                        >
                            <Ionicons name={config.icon} size={34} color={config.accent} />
                        </Animated.View>

                        <Text style={styles.message}>{toast.message}</Text>

                        <TouchableOpacity
                            onPress={hideToast}
                            activeOpacity={0.85}
                            style={[styles.closeBtn, { backgroundColor: config.accent }]}
                        >
                            <Text style={styles.closeBtnText}>OK</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast doit être utilisé au sein d’un ToastProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    overlayWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 15, 20, 0.45)',
    },
    card: {
        width: '78%',
        maxWidth: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 22,
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(108,62,184,0.18)',
    },
    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 20,
    },
    closeBtn: {
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 99,
    },
    closeBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
});