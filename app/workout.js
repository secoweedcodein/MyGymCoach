import { useLocalSearchParams } from 'expo-router';
import WorkoutScreen from '../src/screens/workoutscreen';

export default function WorkoutPage() {
  const { routine } = useLocalSearchParams();

  return (
    <WorkoutScreen
      route={{
        params: {
          routine: JSON.parse(routine),
        },
      }}
    />
  );
}