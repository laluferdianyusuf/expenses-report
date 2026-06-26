import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';

interface HealthScoreCardProps {
  score: number;
}

function getRating(score: number) {
  if (score >= 80) return { label: 'Excellent', color: '#22C55E' };
  if (score >= 60) return { label: 'Good', color: '#2563EB' };
  if (score >= 40) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Perlu Perhatian', color: '#EF4444' };
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const { colors } = useTheme();
  const rating = getRating(score);

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Health Score</Text>
      <View style={styles.row}>
        <View style={[styles.barBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${score}%`, backgroundColor: rating.color },
            ]}
          />
        </View>
        <Text style={[styles.score, { color: colors.text }]}>{score}/100</Text>
      </View>
      <Text style={[styles.rating, { color: rating.color }]}>{rating.label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barBg: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  score: { fontSize: 16, fontWeight: '700', minWidth: 56 },
  rating: { marginTop: 8, fontSize: 13, fontWeight: '500' },
});
