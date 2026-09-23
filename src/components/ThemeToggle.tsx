import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';

const TRACK_W = 74;
const TRACK_H = 36;
const PAD = 3;
const INNER = TRACK_W - PAD * 2;
const KNOB_W = INNER / 2;
const KNOB_H = TRACK_H - PAD * 2;

export const ThemeToggle: React.FC = () => {
    const { isDark, setScheme, colors: P } = useTheme();
    const progress = useRef(new Animated.Value(isDark ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(progress, {
            toValue: isDark ? 1 : 0,
            useNativeDriver: true,
            tension: 220,
            friction: 18,
        }).start();
    }, [isDark, progress]);

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, KNOB_W],
    });

    return (
        <Pressable
            onPress={() => setScheme(isDark ? 'light' : 'dark')}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDark }}
            accessibilityLabel="Changer le thème"
            style={[
                styles.track,
                {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22,18,58,0.06)',
                    borderColor: P.goldRim,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.knob,
                    {
                        backgroundColor: isDark ? P.gold : '#16123A',
                        transform: [{ translateX }],
                    },
                ]}
            />
            <View style={styles.row} pointerEvents="none">
                <View style={styles.slot}>
                    <Ionicons name="sunny" size={15} color={isDark ? P.muted : P.gold} />
                </View>
                <View style={styles.slot}>
                    <Ionicons name="moon" size={14} color={isDark ? '#16123A' : P.muted} />
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    track: {
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        borderWidth: 1,
        padding: PAD,
        justifyContent: 'center',
    },
    knob: {
        position: 'absolute',
        left: PAD,
        width: KNOB_W,
        height: KNOB_H,
        borderRadius: KNOB_H / 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    slot: {
        width: KNOB_W,
        height: KNOB_H,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
