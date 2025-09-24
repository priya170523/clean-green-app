import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;

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

  // Find min and max values for scaling
  const values = data.map(item => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate bar heights for visualization
  const barWidth = Math.max(28, (chartWidth - 40) / data.length); // wider bars
  const maxBarHeight = chartHeight - 60;

  // Reverse the y-axis labels for descending order
  const yAxisSteps = 4;
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const value = maxValue - (i * (range / yAxisSteps));
    return Math.round(value);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Enhanced bar chart with glowing effect */}
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              // Calculate correct bar height (proportional to value)
              const targetHeight = ((item.value - minValue) / range) * maxBarHeight;
              const animatedHeight = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetHeight],
              });
              const isPositive = item.value >= (minValue + maxValue) / 2;
              return (
                <View key={index} style={[styles.barContainer, { width: barWidth }]}> 
                  <LinearGradient
                    colors={isPositive
                      ? ['#4CAF50', '#66BB6A', '#81C784']
                      : ['#F44336', '#EF5350', '#E57373']
                    }
                    style={[styles.gradientBar, { width: barWidth, borderRadius: 6 }]
                    }
                  >
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          height: animatedHeight,
                          backgroundColor: isPositive ? '#4CAF50' : '#F44336',
                          shadowColor: isPositive ? '#4CAF50' : '#F44336',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 10,
                          width: barWidth,
                          borderRadius: 6,
                        }
                      ]}
                    />
                  </LinearGradient>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <Animated.Text
                    style={[
                      styles.barValue,
                      {
                        opacity: animation,
                        color: isPositive ? '#4CAF50' : '#F44336',
                        fontWeight: '700',
                      }
                    ]}
                  >
                    {item.value}
                  </Animated.Text>
                </View>
              );
            })}
          </View>

          {/* Y-axis labels (descending order) */}
          <View style={styles.yAxisLabels}>
            {yAxisLabels.map((value, i) => (
              <Text key={i} style={styles.yAxisLabel}>{value}</Text>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: chartHeight - 40,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    borderRadius: 2,
    marginBottom: 5,
  },
  gradientBar: {
    width: '80%',
    borderRadius: 2,
    marginBottom: 5,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    top: -25,
    width: '100%',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 40,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 10,
    height: chartHeight - 40,
    justifyContent: 'space-between',
    width: 30,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
});
