import { Slot } from 'expo-router';

// The (tabs) group is kept for routing compatibility but renders as a
// transparent layout with no tab bar — navigation is stack-based.
export default function TabsLayout() {
  return <Slot />;
}
