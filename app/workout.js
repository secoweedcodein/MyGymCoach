import { useLocalSearchParams } from 'expo-router';
import WorkoutScreen from '../src/screens/workoutscreen';

export default function WorkoutPage() {
  const { routine } = useLocalSearchParams();

  return (
    <WorkoutScreen
      route={{
        params: {
          routine: typeof routine === 'string' ? JSON.parse(routine) : routine,
        },
      }}
    />
  );
}