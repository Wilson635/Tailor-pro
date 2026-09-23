import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

/** Marque atelier — buste de mannequin (pas des ciseaux). */
export const AtelierIcon: React.FC<Props> = ({ size = 22, color = '#D4AF37' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="3.2" r="1.35" fill={color} />
        <Path
            d="M12 4.55v1.5"
            stroke={color}
            strokeWidth={1.55}
            strokeLinecap="round"
        />
        <Path
            d="M8.2 7.45c.4-1.15 2-1.85 3.8-1.85s3.4.7 3.8 1.85c.4 1.2-.2 2.2-1.1 2.9l.5 3.45c.08.52-.32.95-.85.95H9.65c-.53 0-.93-.43-.85-.95l.5-3.45c-.9-.7-1.5-1.7-1.1-2.9Z"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
        />
        <Path
            d="M10.2 14.75h3.6"
            stroke={color}
            strokeWidth={1.35}
            strokeLinecap="round"
        />
        <Path
            d="M12 16.15v3.2"
            stroke={color}
            strokeWidth={1.55}
            strokeLinecap="round"
        />
        <Path
            d="M8.7 20.9c.75-.5 1.95-.8 3.3-.8s2.55.3 3.3.8"
            stroke={color}
            strokeWidth={1.55}
            strokeLinecap="round"
        />
    </Svg>
);
