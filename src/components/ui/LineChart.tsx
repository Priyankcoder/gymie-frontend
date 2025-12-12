
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGradient?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (date: string) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 320,
  height = 180,
  color,
  showGradient = true,
  showDots = true,
  showGrid = true,
  formatYLabel = (v) => v.toFixed(0),
  formatXLabel = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
}) => {
  const { colors } = useTheme();
  const lineColor = color || colors.accentBlue;
  
  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }

  const padding = { top: 20, right: 16, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  
  // Add 10% padding to the range
  const paddedMin = minValue - valueRange * 0.1;
  const paddedMax = maxValue + valueRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight;

  // Create smooth path using cubic bezier curves
  const createSmoothPath = () => {
    if (data.length < 2) {
      const x = getX(0);
      const y = getY(data[0].value);
      return `M ${x} ${y}`;
    }

    let path = `M ${getX(0)} ${getY(data[0].value)}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i].value);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1].value);
      
      const cpx1 = x0 + (x1 - x0) / 3;
      const cpy1 = y0;
      const cpx2 = x1 - (x1 - x0) / 3;
      const cpy2 = y1;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x1} ${y1}`;
    }
    
    return path;
  };

  // Create area path for gradient fill
  const createAreaPath = () => {
    const linePath = createSmoothPath();
    const lastX = getX(data.length - 1);
    const baseY = padding.top + chartHeight;
    return `${linePath} L ${lastX} ${baseY} L ${padding.left} ${baseY} Z`;
  };

  // Generate Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = paddedMin + (paddedRange * (4 - i)) / 4;
    return { value, y: padding.top + (chartHeight * i) / 4 };
  });

  // Generate X-axis labels (show max 5)
  const xLabelIndices = data.length <= 5 
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(3 * data.length / 4), data.length - 1];

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid && yLabels.map((label, i) => (
          <Line
            key={`grid-${i}`}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Gradient area */}
        {showGradient && data.length > 1 && (
          <Path
            d={createAreaPath()}
            fill="url(#areaGradient)"
          />
        )}

        {/* Line */}
        <Path
          d={createSmoothPath()}
          stroke={lineColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showDots && data.map((point, i) => (
          <Circle
            key={`dot-${i}`}
            cx={getX(i)}
            cy={getY(point.value)}
            r={i === data.length - 1 ? 5 : 3}
            fill={i === data.length - 1 ? lineColor : colors.card}
            stroke={lineColor}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Y-axis labels */}
      {yLabels.map((label, i) => (
        <Text
          key={`y-label-${i}`}
          style={[
            styles.yLabel,
            { 
              color: colors.textSecondary,
              top: label.y - 8,
              left: 0,
            }
          ]}
        >
          {formatYLabel(label.value)}
        </Text>
      ))}

      {/* X-axis labels */}
      {xLabelIndices.map((index) => (
        <Text
          key={`x-label-${index}`}
          style={[
            styles.xLabel,
            {
              color: colors.textSecondary,
              left: getX(index) - 25,
              bottom: 4,
            }
          ]}
        >
          {formatXLabel(data[index].date)}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 14,
  },
  yLabel: {
    position: 'absolute',
    fontSize: 10,
    width: 40,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    width: 50,
    textAlign: 'center',
  },
});

export default LineChart;
