import { Box, keyframes, useTheme, useMediaQuery } from '@mui/material';

const createSwimAnimation = (width: string) => keyframes`
  0% {
    transform: translateX(-50px) scaleX(1) rotate(-5deg);
  }
  25% {
    transform: translateX(calc(${width} * 0.25)) scaleX(1) rotate(5deg);
  }
  45% {
    transform: translateX(calc(${width} * 0.8)) scaleX(1) rotate(-5deg);
  }
  50% {
    transform: translateX(calc(${width} * 0.8)) scaleX(-1) rotate(5deg);
  }
  75% {
    transform: translateX(calc(${width} * 0.25)) scaleX(-1) rotate(-5deg);
  }
  95% {
    transform: translateX(-50px) scaleX(-1) rotate(5deg);
  }
  100% {
    transform: translateX(-50px) scaleX(1) rotate(-5deg);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
`;

const tail = keyframes`
  0%, 100% {
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(0.9);
  }
`;

interface FishIconProps {
  variant: number;
}

const FishIcon = ({ variant }: FishIconProps) => {
  // Different goldfish variations with more orange/gold tones
  const goldVariants = {
    1: {
      filter: 'sepia(100%) saturate(500%) brightness(115%) hue-rotate(300deg)',
      animation: `${tail} 0.8s ease-in-out infinite`,
    },
    2: {
      filter: 'sepia(100%) saturate(600%) brightness(120%) hue-rotate(290deg)',
      animation: `${tail} 0.9s ease-in-out infinite`,
    },
    3: {
      filter: 'sepia(100%) saturate(550%) brightness(125%) hue-rotate(295deg)',
      animation: `${tail} 0.7s ease-in-out infinite`,
    },
    4: {
      filter: 'sepia(100%) saturate(650%) brightness(118%) hue-rotate(285deg)',
      animation: `${tail} 0.85s ease-in-out infinite`,
    },
    5: {
      filter: 'sepia(100%) saturate(580%) brightness(122%) hue-rotate(292deg)',
      animation: `${tail} 0.75s ease-in-out infinite`,
    },
  }[variant];

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: '24px',
        height: '24px',
        position: 'relative',
        '&::before': {
          content: '"🐟"', // Changed to fish emoji
          fontSize: '1.2rem',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          ...goldVariants,
        }
      }}
    />
  );
};

interface FishProps {
  delay: number;
  speed: number;
  size: number;
  variant: number;
  yOffset: number;
}

const SwimmingFish = ({ delay, speed, size, variant, yOffset }: FishProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const swimAnimation = createSwimAnimation(isMobile ? '100vw' : 'calc(100vw - 240px)');

  return (
    <Box
      sx={{
        position: 'absolute',
        top: `calc(50% + ${yOffset}px)`,
        transform: 'translateY(-50%)',
        animation: `${swimAnimation} ${speed}s linear infinite`,
        animationDelay: `${delay}s`,
        '& span': {
          display: 'inline-block',
          animation: `${float} 3s ease-in-out infinite`,
          animationDelay: `${delay * 0.5}s`,
          fontSize: `${size}rem`,
        },
      }}
    >
      <FishIcon variant={variant} />
    </Box>
  );
};

export default function AnimatedFish() {
  const fishes = [
    { delay: 0, speed: 20, size: 1.4, variant: 1, yOffset: -8 },
    { delay: 4, speed: 16, size: 1.6, variant: 2, yOffset: 8 },
    { delay: 2, speed: 22, size: 1.2, variant: 3, yOffset: -4 },
    { delay: 6, speed: 18, size: 1.5, variant: 4, yOffset: 12 },
    { delay: 8, speed: 19, size: 1.3, variant: 5, yOffset: 0 },
  ];

  return (
    <>
      {fishes.map((fish, index) => (
        <SwimmingFish
          key={index}
          delay={fish.delay}
          speed={fish.speed}
          size={fish.size}
          variant={fish.variant}
          yOffset={fish.yOffset}
        />
      ))}
    </>
  );
} 