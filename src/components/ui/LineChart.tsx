

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
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
  curved?: boolean;
  hideDataPoints?: boolean;
  areaChart?: boolean;
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
  curved = true,
  hideDataPoints = false,
  areaChart = true,
}) => {
  const { colors, isDark } = useTheme();
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

  // Transform data to gifted-charts format
  // Show max 6 labels evenly distributed
  const labelInterval = Math.ceil(data.length / 6);
  
  const chartData = data.map((point, index) => ({
    value: point.value,
    label: index % labelInterval === 0 || index === data.length - 1 
      ? formatXLabel(point.date)
      : '',
    dataPointText: '',
    showDataPoint: showDots && !hideDataPoints,
  }));

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  
  // Add padding to the range
  const yAxisOffset = Math.floor(minValue - valueRange * 0.1);
  const calculatedMaxValue = Math.ceil(maxValue + valueRange * 0.1);

  // Calculate spacing based on available width
  const chartPadding = 50; // left padding for y-axis labels
  const availableWidth = width - chartPadding - 20;
  const spacing = data.length > 1 ? availableWidth / (data.length - 1) : availableWidth;

  return (
    <View style={[styles.container, { width }]}>
      <GiftedLineChart
        data={chartData}
        width={width - chartPadding}
        height={height - 40}
        
        // Line styling
        color={lineColor}
        thickness={2.5}
        curved={curved}
        curvature={0.2}
        
        // Area/Gradient styling
        areaChart={areaChart && showGradient}
        startFillColor={lineColor}
        endFillColor={lineColor}
        startOpacity={0.3}
        endOpacity={0.05}
        
        // Data points styling
        dataPointsColor={lineColor}
        dataPointsRadius={showDots && !hideDataPoints ? 4 : 0}
        hideDataPoints={hideDataPoints || !showDots}
        focusedDataPointColor={lineColor}
        focusedDataPointRadius={6}
        
        // X-axis styling
        xAxisColor={colors.border}
        xAxisThickness={0}
        xAxisLabelTextStyle={{
          color: colors.textSecondary,
          fontSize: 9,
          width: 50,
          textAlign: 'center',
        }}
        rotateLabel={false}
        
        // Y-axis styling
        yAxisColor={colors.border}
        yAxisThickness={0}
        yAxisTextStyle={{
          color: colors.textSecondary,
          fontSize: 10,
        }}
        yAxisOffset={yAxisOffset > 0 ? yAxisOffset : 0}
        maxValue={calculatedMaxValue - (yAxisOffset > 0 ? yAxisOffset : 0)}
        noOfSections={4}
        formatYLabel={(value) => formatYLabel(parseFloat(value) + (yAxisOffset > 0 ? yAxisOffset : 0))}
        
        // Grid styling
        rulesType={showGrid ? 'dashed' : 'solid'}
        rulesColor={colors.border}
        dashWidth={4}
        dashGap={4}
        hideRules={!showGrid}
        
        // Spacing
        spacing={spacing}
        initialSpacing={0}
        endSpacing={0}
        
        // Pointer/tooltip configuration
        pointerConfig={{
          pointerStripHeight: height - 60,
          pointerStripColor: colors.border,
          pointerStripWidth: 1,
          pointerColor: lineColor,
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 30,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any) => {
            const item = items[0];
            if (!item) return null;
            const actualValue = item.value + (yAxisOffset > 0 ? yAxisOffset : 0);
            return (
              <View style={[styles.tooltipContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.tooltipValue, { color: colors.textPrimary }]}>
                  {formatYLabel(actualValue)}
                </Text>
              </View>
            );
          },
        }}
        
        // Animation
        isAnimated
        animationDuration={800}
        animateOnDataChange
      />
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
  tooltipContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LineChart;
