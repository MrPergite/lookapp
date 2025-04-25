import React from 'react';
import Svg, { Path, Defs, Rect, ClipPath, G } from 'react-native-svg';

const Star = ({ size = 24, fillPercentage = 100 }) => {
  const clipId = `clip-${Math.random()}`;

  const starPath =
    'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke={"currentColor"}
    >
      <Defs>
        <ClipPath id={clipId}>
          <Rect x="0" y="0" width={(fillPercentage / 100) * 24} height="24" />
        </ClipPath>
      </Defs>

      {/* Base star with border */}
      <Path
        d={starPath}
        fill="#ccc"
        stroke="#f1c40f"
        strokeWidth={1}
      />

      {/* Yellow filled portion clipped */}
      <G clipPath={`url(#${clipId})`}>
        <Path
          d={starPath}
          fill="yellow"
          stroke="#f1c40f"
          strokeWidth={1}
        />
      </G>
    </Svg>
  );
};

export default Star;
