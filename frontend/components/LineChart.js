import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 180;
const padding = 10;
const graphHeight = chartHeight - 30; // Reduced space for labels

export default function LineChart({ data, title = "Waste Contribution Trend" }) {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start animation when component mounts
    Animated.timing(animation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Dynamic Y-axis based on data max
  const dataMax = Math.max(...data.map(d => d.value));
  const maxValue = Math.max(20, dataMax * 1.1); // 10% padding
  const minValue = 0;
  const yRange = maxValue - minValue;
  const ySteps = 5;
  const stepValue = yRange / ySteps;
  const yAxisLabels = Array.from({length: ySteps + 1}, (_, i) => Math.round((ySteps - i) * stepValue));

  // Bar width with spacing - dynamic for better fit
  const barSpacing = 10;
  const barWidth = Math.min(25, (chartWidth - 70) / data.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {yAxisLabels.map((label, i) => (
              <Text key={i} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>

          {/* Grid lines */}
          <View style={styles.gridContainer}>
            {yAxisLabels.map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          {/* Bars container - grow from bottom */}
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              const normalized = Math.max(0, Math.min(1, (item.value - minValue) / yRange));
              const targetHeight = normalized * graphHeight;
              const animatedHeight = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetHeight],
              });

              return (
                <View key={index} style={styles.barItem}>
                  <Animated.View
                    style={[
                      styles.bar,
                      {
                        height: animatedHeight,
                        backgroundColor: '#4CAF50', // Green for waste theme
                        width: barWidth,
                      },
                    ]}
                  >
                    <Animated.Text
                      style={[
                        styles.barValue,
                        {
                          opacity: animation,
                        },
                      ]}
                    >
                      {item.value}
                    </Animated.Text>
                  </Animated.View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>

          {/* X-axis */}
          <View style={styles.xAxis} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    height: chartHeight,
    position: 'relative',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: padding,
    paddingBottom: 30, // More space for labels
    position: 'relative',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 10,
    top: 0,
    height: graphHeight,
    justifyContent: 'space-between',
    width: 40,
    zIndex: 1,
  },
  gridContainer: {
    position: 'absolute',
    left: 50,
    top: 0,
    height: graphHeight,
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 0,
  },
  gridLine: {
    height: 0.5,
    backgroundColor: '#f0f0f0',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: graphHeight,
    marginLeft: 60,
    paddingBottom: 5,
    zIndex: 2,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  barValue: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -15 }],
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: 'transparent',
  },
  barLabel: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  xAxis: {
    position: 'absolute',
    bottom: 5,
    left: 60,
    right: padding,
    height: 1,
    backgroundColor: '#ddd',
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
