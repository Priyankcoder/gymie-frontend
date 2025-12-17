
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, Button } from '../../src/components/ui';

type ToolType = 'plate' | 'warmup' | 'stopwatch';

export default function ToolsScreen() {
  const { colors, borderRadius } = useTheme();

  const [selectedTool, setSelectedTool] = useState<ToolType>('plate');

  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState('20');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [plateBreakdown, setPlateBreakdown] = useState<{ weight: number; count: number }[]>([]);

  // Warm-up Calculator State
  const [workingWeight, setWorkingWeight] = useState('');
  const [warmupSets, setWarmupSets] = useState<{ weight: number; reps: number; percentage: number }[]>([]);

  // Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Plate Calculator Logic
  const availablePlatesKg = [25, 20, 15, 10, 5, 2.5, 1.25];
  const availablePlatesLb = [45, 35, 25, 10, 5, 2.5];

  const calculatePlates = () => {
    const target = parseFloat(targetWeight);
    const bar = parseFloat(barWeight);
    if (isNaN(target) || isNaN(bar) || target <= bar) {
      setPlateBreakdown([]);
      return;
    }

    const weightPerSide = (target - bar) / 2;
    const plates = unit === 'kg' ? availablePlatesKg : availablePlatesLb;
    const breakdown: { weight: number; count: number }[] = [];
    let remaining = weightPerSide;

    for (const plate of plates) {
      if (remaining >= plate) {
        const count = Math.floor(remaining / plate);
        breakdown.push({ weight: plate, count });
        remaining -= count * plate;
      }
    }

    setPlateBreakdown(breakdown);
  };

  useEffect(() => {
    calculatePlates();
  }, [targetWeight, barWeight, unit]);

  // Warm-up Calculator Logic
  const calculateWarmup = () => {
    const working = parseFloat(workingWeight);
    if (isNaN(working) || working <= 0) {
      setWarmupSets([]);
      return;
    }

    const bar = parseFloat(barWeight);
    const warmup = [
      { percentage: 0, reps: 10 },    // Bar only
      { percentage: 40, reps: 8 },
      { percentage: 60, reps: 5 },
      { percentage: 75, reps: 3 },
      { percentage: 85, reps: 2 },
      { percentage: 90, reps: 1 },
    ];

    const sets = warmup.map((set) => {
      const calculatedWeight = set.percentage === 0 ? bar : Math.round((working * set.percentage) / 100 / 2.5) * 2.5;
      return {
        weight: Math.max(calculatedWeight, bar),
        reps: set.reps,
        percentage: set.percentage,
      };
    });

    setWarmupSets(sets);
  };

  useEffect(() => {
    calculateWarmup();
  }, [workingWeight, barWeight, unit]);

  // Stopwatch Logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const startStopwatch = () => setIsRunning(true);
  const stopStopwatch = () => setIsRunning(false);
  const resetStopwatch = () => {
    setIsRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };
  const addLap = () => {
    if (isRunning) {
      setLaps([...laps, stopwatchTime]);
    }
  };

  const renderToolSelector = () => (
    <View style={styles.toolSelector}>
      {([
        { key: 'plate', icon: 'disc', label: 'Plate Calc' },
        { key: 'warmup', icon: 'trending-up', label: 'Warm-up' },
        { key: 'stopwatch', icon: 'stopwatch', label: 'Stopwatch' },
      ] as const).map((tool) => (
        <Pressable
          key={tool.key}
          style={[
            styles.toolOption,
            {
              backgroundColor: selectedTool === tool.key ? colors.accentBlue : colors.card,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={() => setSelectedTool(tool.key)}
        >
          <Ionicons
            name={tool.icon as any}
            size={24}
            color={selectedTool === tool.key ? '#FFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.toolOptionText,
              { color: selectedTool === tool.key ? '#FFF' : colors.textSecondary },
            ]}
          >
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderPlateCalculator = () => (
    <View style={styles.toolContent}>
      <Card style={styles.inputCard}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Weight</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.weightInput,
              {
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderRadius: borderRadius.md,
              },
            ]}
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          <View style={styles.unitSelector}>
            {(['kg', 'lb'] as const).map((u) => (
              <Pressable
                key={u}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: unit === u ? colors.accentBlue : colors.inputBackground,
                    borderRadius: borderRadius.sm,
                  },
                ]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitText, { color: unit === u ? '#FFF' : colors.textSecondary }]}>
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
          Bar Weight
        </Text>
        <TextInput
          style={[
            styles.barInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderRadius: borderRadius.md,
            },
          ]}
          value={barWeight}
          onChangeText={setBarWeight}
          placeholder="20"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </Card>

      {plateBreakdown.length > 0 && (
        <Card style={styles.resultCard}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
            Plates Per Side
          </Text>
          <View style={styles.platesContainer}>
            {plateBreakdown.map((plate, index) => (
              <View key={index} style={styles.plateItem}>
                <View
                  style={[
                    styles.plateVisual,
                    {
                      backgroundColor: colors.accentBlue,
                      width: 40 + plate.weight * 1.5,
                      height: 60 + plate.weight * 2,
                    },
                  ]}
                >
                  <Text style={styles.plateWeight}>{plate.weight}</Text>
                </View>
                <Text style={[styles.plateCount, { color: colors.textPrimary }]}>
                  × {plate.count}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.totalText, { color: colors.textSecondary }]}>
            Total per side:{' '}
            {plateBreakdown.reduce((sum, p) => sum + p.weight * p.count, 0)} {unit}
          </Text>
        </Card>
      )}
    </View>
  );

  const renderWarmupCalculator = () => (
    <View style={styles.toolContent}>
      <Card style={styles.inputCard}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Working Weight</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.weightInput,
              {
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderRadius: borderRadius.md,
              },
            ]}
            value={workingWeight}
            onChangeText={setWorkingWeight}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          <View style={styles.unitSelector}>
            {(['kg', 'lb'] as const).map((u) => (
              <Pressable
                key={u}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: unit === u ? colors.accentBlue : colors.inputBackground,
                    borderRadius: borderRadius.sm,
                  },
                ]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitText, { color: unit === u ? '#FFF' : colors.textSecondary }]}>
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      {warmupSets.length > 0 && (
        <Card style={styles.resultCard}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
            Warm-up Protocol
          </Text>
          {warmupSets.map((set, index) => (
            <View
              key={index}
              style={[styles.warmupSet, { borderBottomColor: colors.border }]}
            >
              <View style={styles.warmupSetInfo}>
                <Text style={[styles.warmupSetNumber, { color: colors.textSecondary }]}>
                  Set {index + 1}
                </Text>
                <Text style={[styles.warmupPercentage, { color: colors.accentBlue }]}>
                  {set.percentage === 0 ? 'Bar' : `${set.percentage}%`}
                </Text>
              </View>
              <View style={styles.warmupSetDetails}>
                <Text style={[styles.warmupWeight, { color: colors.textPrimary }]}>
                  {set.weight} {unit}
                </Text>
                <Text style={[styles.warmupReps, { color: colors.textSecondary }]}>
                  × {set.reps} reps
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );

  const renderStopwatch = () => (
    <View style={styles.toolContent}>
      <Card style={styles.stopwatchCard}>
        <Text style={[styles.stopwatchTime, { color: colors.textPrimary }]}>
          {formatTime(stopwatchTime)}
        </Text>
        <View style={styles.stopwatchButtons}>
          {!isRunning ? (
            <Button
              title="Start"
              onPress={startStopwatch}
              style={[styles.stopwatchButton, { backgroundColor: colors.success }]}
            />
          ) : (
            <Button
              title="Stop"
              onPress={stopStopwatch}
              style={[styles.stopwatchButton, { backgroundColor: colors.error }]}
            />
          )}
          <Button
            title="Lap"
            variant="outline"
            onPress={addLap}
            disabled={!isRunning}
            style={styles.stopwatchButton}
          />
          <Button
            title="Reset"
            variant="secondary"
            onPress={resetStopwatch}
            style={styles.stopwatchButton}
          />
        </View>
      </Card>

      {laps.length > 0 && (
        <Card style={styles.lapsCard}>
          <Text style={[styles.lapsTitle, { color: colors.textPrimary }]}>Laps</Text>
          <ScrollView style={styles.lapsList}>
            {laps.map((lap, index) => (
              <View
                key={index}
                style={[styles.lapItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.lapNumber, { color: colors.textSecondary }]}>
                  Lap {index + 1}
                </Text>
                <Text style={[styles.lapTime, { color: colors.textPrimary }]}>
                  {formatTime(lap)}
                </Text>
                {index > 0 && (
                  <Text style={[styles.lapDiff, { color: colors.accentBlue }]}>
                    +{formatTime(lap - laps[index - 1])}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tools</Text>
      </View>

      {renderToolSelector()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedTool === 'plate' && renderPlateCalculator()}
        {selectedTool === 'warmup' && renderWarmupCalculator()}
        {selectedTool === 'stopwatch' && renderStopwatch()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  toolSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  toolOption: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  toolOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  toolContent: {
    paddingHorizontal: 16,
  },
  inputCard: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  unitOption: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 56,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  barInput: {
    height: 48,
    fontSize: 18,
    textAlign: 'center',
  },
  resultCard: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  platesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  plateItem: {
    alignItems: 'center',
  },
  plateVisual: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  plateWeight: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  plateCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 14,
    textAlign: 'center',
  },
  warmupSet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  warmupSetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warmupSetNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  warmupPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  warmupSetDetails: {
    alignItems: 'flex-end',
  },
  warmupWeight: {
    fontSize: 18,
    fontWeight: '700',
  },
  warmupReps: {
    fontSize: 13,
  },
  stopwatchCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  stopwatchTime: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 32,
  },
  stopwatchButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  stopwatchButton: {
    minWidth: 90,
  },
  lapsCard: {
    marginTop: 16,
  },
  lapsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  lapsList: {
    maxHeight: 300,
  },
  lapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 16,
  },
  lapNumber: {
    fontSize: 14,
    width: 50,
  },
  lapTime: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
  lapDiff: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
